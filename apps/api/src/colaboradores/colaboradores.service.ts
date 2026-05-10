import { ConflictException, Injectable, Logger, NotImplementedException } from "@nestjs/common"
import { CrearColaboradorInput } from "@nexott-learn/shared-types"
import { AccionAuditoria, ModoEntregaPassword, Prisma } from "@prisma/client"
import bcrypt from "bcrypt"
import { AuditLogService } from "../common/audit/audit-log.service"
import { ContextoHttpAuditoria } from "../common/audit/audit-log.types"
import { apiErrorCodes } from "../common/errors/api-error.codes"
import { PrismaService } from "../common/prisma/prisma.service"
import { AltaColaboradorResponse } from "./colaboradores.types"
import { generarPasswordSegura } from "./password-generator"

const FACTOR_BCRYPT = 12
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
}
