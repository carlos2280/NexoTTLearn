import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  NotImplementedException,
} from "@nestjs/common"
import {
  CambiarRolResponse,
  ColaboradorAdminResumen,
  CrearColaboradorInput,
  ExportarColaboradoresQuery,
  ListarColaboradoresQuery,
  Paginated,
} from "@nexott-learn/shared-types"
import { AccionAuditoria, ModoEntregaPassword, Prisma, RolUsuario } from "@prisma/client"
import bcrypt from "bcrypt"
import { AuditLogService } from "../common/audit/audit-log.service"
import { ContextoHttpAuditoria } from "../common/audit/audit-log.types"
import { FACTOR_BCRYPT } from "../common/auth/bcrypt.constants"
import { apiErrorCodes } from "../common/errors/api-error.codes"
import { PrismaService } from "../common/prisma/prisma.service"
import { AltaColaboradorResponse, SELECT_COLABORADOR_ADMIN } from "./colaboradores.types"
import { generarPasswordSegura } from "./password-generator"

type ColaboradorAdminRow = Prisma.ColaboradorGetPayload<{ select: typeof SELECT_COLABORADOR_ADMIN }>

const DIAS_CADUCIDAD_PASSWORD_INICIAL = 7
const MS_POR_DIA = 24 * 60 * 60 * 1000

@Injectable()
export class ColaboradoresService {
  private readonly logger = new Logger(ColaboradoresService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async crear(
    input: CrearColaboradorInput,
    adminUsuarioId: string,
    contexto: ContextoHttpAuditoria = {},
  ): Promise<AltaColaboradorResponse> {
    const config = await this.prisma.configuracionSistema.findUnique({
      where: { id: 1 },
      select: { modoEntregaPassword: true },
    })
    const modo = config?.modoEntregaPassword ?? ModoEntregaPassword.MANUAL
    if (modo !== ModoEntregaPassword.MANUAL) {
      throw new NotImplementedException({
        code: apiErrorCodes.modoAutomaticoNoDisponible,
        message: "El envio automatico por correo se implementa en la fase P10.",
      })
    }

    const passwordTemporal = generarPasswordSegura()
    const passwordHash = await bcrypt.hash(passwordTemporal, FACTOR_BCRYPT)
    const passwordInicialCaduca = new Date(
      Date.now() + DIAS_CADUCIDAD_PASSWORD_INICIAL * MS_POR_DIA,
    )

    try {
      const resultado = await this.prisma.$transaction(async (tx) => {
        const colaborador = await tx.colaborador.create({
          data: {
            email: input.email,
            nombre: input.nombre,
          },
          select: { id: true, email: true, nombre: true, estadoEmpleado: true },
        })
        const usuario = await tx.usuario.create({
          data: {
            colaboradorId: colaborador.id,
            rol: input.rol,
            passwordHash,
            requiereCambioPassword: true,
            passwordInicialCaduca,
            mfaHabilitado: false,
            requiereSetupMfa: input.habilitarMfa,
            intentosFallidos: 0,
            bloqueado: false,
          },
          select: { id: true, rol: true },
        })
        await tx.historicoPassword.create({
          data: { usuarioId: usuario.id, hash: passwordHash },
        })
        return { colaborador, usuario }
      })

      this.logger.log(
        `Colaborador creado ${resultado.colaborador.id} (rol ${resultado.usuario.rol})`,
      )
      await this.auditLog.record({
        usuarioId: adminUsuarioId,
        accion: AccionAuditoria.COLABORADOR_CREADO,
        exito: true,
        recursoTipo: "colaborador",
        recursoId: resultado.colaborador.id,
        ...contexto,
      })
      return {
        colaborador: resultado.colaborador,
        usuario: {
          id: resultado.usuario.id,
          rol: resultado.usuario.rol,
          requiereCambioPassword: true,
          requiereSetupMfa: input.habilitarMfa,
          passwordInicialCaducaEn: passwordInicialCaduca,
        },
        modoEntrega: "MANUAL",
        passwordTemporal,
      }
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002" &&
        Array.isArray(error.meta?.target) &&
        (error.meta.target as readonly string[]).includes("email")
      ) {
        throw new ConflictException({
          code: apiErrorCodes.conflictEmailDuplicado,
          message: "Ya existe un colaborador con ese email.",
        })
      }
      throw error
    }
  }

  /**
   * Cambia el rol (ADMIN <-> PARTICIPANTE) de la cuenta de un colaborador.
   * Accion administrativa de alto valor (OWASP A09): identidad del actor SIEMPRE
   * de la sesion, motivo obligatorio y auditoria estructural.
   *
   * Protecciones de negocio:
   *  - Un admin no puede cambiar su propio rol (evita auto-bloqueo / escalada).
   *  - No se permite degradar al ultimo ADMIN activo (evita dejar el sistema sin
   *    administradores).
   *  - Cambiar al mismo rol es un no-op rechazado (409) para no ensuciar la
   *    auditoria con eventos vacios.
   */
  async cambiarRol(
    colaboradorId: string,
    rolNuevo: RolUsuario,
    adminUsuarioId: string,
    motivo: string,
    contexto: ContextoHttpAuditoria = {},
  ): Promise<CambiarRolResponse> {
    const colaborador = await this.prisma.colaborador.findUnique({
      where: { id: colaboradorId },
      select: { usuario: { select: { id: true, rol: true } } },
    })
    if (!colaborador) {
      throw new NotFoundException({
        code: apiErrorCodes.noEncontrado,
        message: "Colaborador no encontrado.",
      })
    }
    const usuario = colaborador.usuario
    if (!usuario) {
      throw new ConflictException({
        code: apiErrorCodes.conflict,
        message: "El colaborador no tiene cuenta de acceso; no se puede asignar un rol.",
      })
    }
    if (usuario.id === adminUsuarioId) {
      throw new ForbiddenException({
        code: apiErrorCodes.prohibido,
        message: "Un administrador no puede cambiar su propio rol.",
      })
    }
    if (usuario.rol === rolNuevo) {
      throw new ConflictException({
        code: apiErrorCodes.conflict,
        message: "El colaborador ya tiene ese rol.",
      })
    }

    const esDegradacion = usuario.rol === RolUsuario.ADMIN && rolNuevo === RolUsuario.PARTICIPANTE
    try {
      // Check del "ultimo admin" + update en una transaccion serializable: el
      // recuento y la escritura deben ser atomicos, de lo contrario dos
      // degradaciones concurrentes del penultimo admin dejarian el sistema con
      // cero administradores (TOCTOU). Bajo Serializable, la segunda transaccion
      // falla con P2034 y se traduce a 409.
      await this.prisma.$transaction(
        async (tx) => {
          if (esDegradacion) {
            // Solo cuentan los administradores *efectivos* (no bloqueados y con
            // colaborador activo): un admin bloqueado o ex-empleado no puede
            // administrar, asi que no protege contra quedarse sin admin operativo.
            const adminsEfectivos = await tx.usuario.count({
              where: {
                rol: RolUsuario.ADMIN,
                bloqueado: false,
                colaborador: { estadoEmpleado: "ACTIVO" },
              },
            })
            if (adminsEfectivos <= 1) {
              throw new ConflictException({
                code: apiErrorCodes.conflict,
                message: "No se puede degradar al ultimo administrador del sistema.",
              })
            }
          }
          await tx.usuario.update({
            where: { id: usuario.id },
            data: { rol: rolNuevo },
            select: { id: true },
          })
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      )
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
        throw new ConflictException({
          code: apiErrorCodes.conflict,
          message: "Conflicto de concurrencia al cambiar el rol. Reintenta.",
        })
      }
      throw error
    }

    this.logger.log(`Rol cambiado para usuario ${usuario.id}: ${usuario.rol} -> ${rolNuevo}`)
    await this.auditLog.record({
      usuarioId: adminUsuarioId,
      accion: AccionAuditoria.USUARIO_ROL_CAMBIADO,
      exito: true,
      recursoTipo: "usuario",
      recursoId: usuario.id,
      metadata: { rolAnterior: usuario.rol, rolNuevo, motivo },
      ...contexto,
    })

    return { usuarioId: usuario.id, rolAnterior: usuario.rol, rolNuevo }
  }

  async listar(query: ListarColaboradoresQuery): Promise<Paginated<ColaboradorAdminResumen>> {
    const { page, pageSize } = query
    const skip = (page - 1) * pageSize
    const where = this.buildWhere(query)

    const [filas, total] = await this.prisma.$transaction([
      this.prisma.colaborador.findMany({
        where,
        select: SELECT_COLABORADOR_ADMIN,
        orderBy: [{ nombre: "asc" }],
        skip,
        take: pageSize,
      }),
      this.prisma.colaborador.count({ where }),
    ])

    return {
      data: filas.map(toColaboradorAdminResumen),
      meta: {
        page,
        pageSize,
        total,
        totalPages: pageSize > 0 ? Math.ceil(total / pageSize) : 0,
      },
    }
  }

  async contar(query: ExportarColaboradoresQuery): Promise<number> {
    return await this.prisma.colaborador.count({ where: this.buildWhere(query) })
  }

  async listarTodosParaExport(
    query: ExportarColaboradoresQuery,
  ): Promise<readonly ColaboradorAdminResumen[]> {
    const filas = await this.prisma.colaborador.findMany({
      where: this.buildWhere(query),
      select: SELECT_COLABORADOR_ADMIN,
      orderBy: [{ nombre: "asc" }],
    })
    return filas.map(toColaboradorAdminResumen)
  }

  private buildWhere(filtros: {
    readonly q?: string
    readonly rol?: "ADMIN" | "PARTICIPANTE"
    readonly estadoEmpleado?: "ACTIVO" | "EX_EMPLEADO"
    readonly bloqueado?: boolean
  }): Prisma.ColaboradorWhereInput {
    const { q, rol, estadoEmpleado, bloqueado } = filtros
    return {
      ...(estadoEmpleado ? { estadoEmpleado } : {}),
      ...(q
        ? {
            // biome-ignore lint/style/useNamingConvention: clave de Prisma para WHERE OR.
            OR: [
              { nombre: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(rol !== undefined || bloqueado !== undefined
        ? {
            usuario: {
              is: {
                ...(rol ? { rol } : {}),
                ...(bloqueado !== undefined ? { bloqueado } : {}),
              },
            },
          }
        : {}),
    }
  }
}

function toColaboradorAdminResumen(row: ColaboradorAdminRow): ColaboradorAdminResumen {
  return {
    id: row.id,
    email: row.email,
    nombre: row.nombre,
    estadoEmpleado: row.estadoEmpleado,
    fechaOffBoarding: row.fechaOffBoarding ? row.fechaOffBoarding.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    usuario: row.usuario
      ? {
          id: row.usuario.id,
          rol: row.usuario.rol,
          bloqueado: row.usuario.bloqueado,
          mfaHabilitado: row.usuario.mfaHabilitado,
          requiereCambioPassword: row.usuario.requiereCambioPassword,
          requiereSetupMfa: row.usuario.requiereSetupMfa,
          intentosFallidos: row.usuario.intentosFallidos,
          ultimoLogin: row.usuario.ultimoLogin ? row.usuario.ultimoLogin.toISOString() : null,
        }
      : null,
  }
}
