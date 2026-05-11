import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common"
import {
  Asignacion,
  AsignacionDetallada,
  AsignacionRechazada,
  AutoInscripcionRequest,
  CrearAsignacionesBatchRequest,
  CrearAsignacionesBatchResponse,
  CursoDisponibleVoluntario,
  ListarAsignacionesQuery,
  Paginated,
} from "@nexott-learn/shared-types"
import { EstadoCurso, Prisma, RolAsignacion, RolUsuario } from "@prisma/client"
import { apiErrorCodes } from "../common/errors/api-error.codes"
import { buildPaginatedResponse, resolvePaginacion } from "../common/http/paginated"
import { PrismaService } from "../common/prisma/prisma.service"
import { SesionUsuario } from "../common/types/sesion.types"
import {
  SELECT_ASIGNACION_DETALLE_FIELDS,
  SELECT_ASIGNACION_FIELDS,
  toAsignacion,
  toAsignacionDetallada,
} from "./asignaciones.helpers"

/**
 * Service del modulo asignaciones (Slice 6 P6a). Cubre listados, alta admin
 * batch, conversion voluntario→asignado, bandeja del participante y
 * auto-inscripcion.
 *
 * Patrones heredados:
 *   - M1 race-safe (D-AS-6 / D-CUR-3 / D-EVI-7) en convertirAAsignado.
 *   - Histórico DENTRO del tx, audit log FUERA en el controller (D-AS-7).
 *   - Scope PARTICIPANTE devuelve 404, no 403 (D-AS-9).
 *   - Selects explicitos con `satisfies Prisma.AsignacionCursoSelect`.
 *   - P2002 capturado puntualmente en autoInscripcion para devolver
 *     `conflictAsignacionDuplicada` y no el 409 generico del filtro global.
 */
@Injectable()
export class AsignacionesService {
  constructor(private readonly prisma: PrismaService) {}

  async listarPorCurso(
    cursoId: string,
    query: ListarAsignacionesQuery,
    usuario: SesionUsuario,
  ): Promise<Paginated<Asignacion>> {
    const curso = await this.prisma.curso.findUnique({
      where: { id: cursoId },
      select: { id: true },
    })
    if (!curso) {
      throw new NotFoundException({
        code: apiErrorCodes.cursoNoEncontrado,
        message: `Curso ${cursoId} no encontrado.`,
      })
    }

    const { skip, take, page, pageSize } = resolvePaginacion(query)

    if (usuario.rol === RolUsuario.PARTICIPANTE) {
      const colaboradorId = await this.colaboradorIdDeUsuario(usuario.usuarioId)
      if (!colaboradorId) {
        return buildPaginatedResponse<Asignacion>([], 0, page, pageSize)
      }
      const propia = await this.prisma.asignacionCurso.findFirst({
        where: { cursoId, colaboradorId },
        select: SELECT_ASIGNACION_FIELDS,
      })
      if (!propia) {
        return buildPaginatedResponse<Asignacion>([], 0, page, pageSize)
      }
      return buildPaginatedResponse([toAsignacion(propia)], 1, page, pageSize)
    }

    const where = this.buildWhereListado(cursoId, query)
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.asignacionCurso.findMany({
        where,
        select: SELECT_ASIGNACION_FIELDS,
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      this.prisma.asignacionCurso.count({ where }),
    ])

    return buildPaginatedResponse(rows.map(toAsignacion), total, page, pageSize)
  }

  async obtenerPorId(asignacionId: string, usuario: SesionUsuario): Promise<AsignacionDetallada> {
    const row = await this.prisma.asignacionCurso.findUnique({
      where: { id: asignacionId },
      select: SELECT_ASIGNACION_DETALLE_FIELDS,
    })
    if (!row) {
      throw new NotFoundException({
        code: apiErrorCodes.asignacionNoEncontrada,
        message: `Asignacion ${asignacionId} no encontrada.`,
      })
    }
    if (usuario.rol === RolUsuario.PARTICIPANTE) {
      const colaboradorId = await this.colaboradorIdDeUsuario(usuario.usuarioId)
      if (!colaboradorId || row.colaboradorId !== colaboradorId) {
        // D-AS-9: ocultar existencia para PARTICIPANTE ajeno.
        throw new NotFoundException({
          code: apiErrorCodes.asignacionNoEncontrada,
          message: `Asignacion ${asignacionId} no encontrada.`,
        })
      }
    }
    return toAsignacionDetallada(row)
  }

  async crearBatch(
    cursoId: string,
    input: CrearAsignacionesBatchRequest,
  ): Promise<CrearAsignacionesBatchResponse> {
    const curso = await this.prisma.curso.findUnique({
      where: { id: cursoId },
      select: { id: true, estado: true },
    })
    if (!curso) {
      throw new NotFoundException({
        code: apiErrorCodes.cursoNoEncontrado,
        message: `Curso ${cursoId} no encontrado.`,
      })
    }
    if (curso.estado !== EstadoCurso.BORRADOR && curso.estado !== EstadoCurso.ACTIVO) {
      throw new ConflictException({
        code: apiErrorCodes.conflictCursoNoActivo,
        message: `El curso no acepta nuevas asignaciones en estado ${curso.estado}.`,
        details: { estado: curso.estado },
      })
    }

    const { aCrear, rechazadas } = await this.clasificarBatch(cursoId, input.colaboradorIds)
    const creadas = await this.crearAsignacionesAdmin(cursoId, aCrear, rechazadas)
    return { creadas, rechazadas }
  }

  private async clasificarBatch(
    cursoId: string,
    colaboradorIds: readonly string[],
  ): Promise<{ readonly aCrear: readonly string[]; readonly rechazadas: AsignacionRechazada[] }> {
    const idsSolicitados = [...new Set(colaboradorIds)]
    const [colaboradores, yaInscritos] = await this.prisma.$transaction([
      this.prisma.colaborador.findMany({
        where: { id: { in: idsSolicitados } },
        select: { id: true, estadoEmpleado: true },
      }),
      this.prisma.asignacionCurso.findMany({
        where: { cursoId, colaboradorId: { in: idsSolicitados } },
        select: { colaboradorId: true },
      }),
    ])
    const colaboradoresPorId = new Map(colaboradores.map((c) => [c.id, c]))
    const yaInscritosSet = new Set(yaInscritos.map((a) => a.colaboradorId))

    const rechazadas: AsignacionRechazada[] = []
    const aCrear: string[] = []
    for (const colaboradorId of idsSolicitados) {
      const motivo = this.evaluarColaboradorBatch(colaboradorId, colaboradoresPorId, yaInscritosSet)
      if (motivo) {
        rechazadas.push({ colaboradorId, motivo })
      } else {
        aCrear.push(colaboradorId)
      }
    }
    return { aCrear, rechazadas }
  }

  private evaluarColaboradorBatch(
    colaboradorId: string,
    colaboradoresPorId: Map<string, { id: string; estadoEmpleado: string }>,
    yaInscritosSet: Set<string>,
  ): "NO_ENCONTRADO" | "EX_EMPLEADO" | "YA_INSCRITO" | null {
    const colaborador = colaboradoresPorId.get(colaboradorId)
    if (!colaborador) {
      return "NO_ENCONTRADO"
    }
    if (colaborador.estadoEmpleado !== "ACTIVO") {
      // D84: prohibido asignar a EX_EMPLEADO.
      return "EX_EMPLEADO"
    }
    if (yaInscritosSet.has(colaboradorId)) {
      return "YA_INSCRITO"
    }
    return null
  }

  private async crearAsignacionesAdmin(
    cursoId: string,
    aCrear: readonly string[],
    rechazadasAcum: AsignacionRechazada[],
  ): Promise<Asignacion[]> {
    const creadas: Asignacion[] = []
    for (const colaboradorId of aCrear) {
      try {
        const row = await this.prisma.asignacionCurso.create({
          data: {
            cursoId,
            colaboradorId,
            rol: RolAsignacion.ASIGNADO,
            estadoAsignado: "ASIGNADO",
            // D-AS-1 + chk_asig_rol_estado: ASIGNADO => estado_voluntario NULL
            // y origen_voluntario NULL.
          },
          select: SELECT_ASIGNACION_FIELDS,
        })
        creadas.push(toAsignacion(row))
        // TODO(S7): calcular plan personal al asignar (D-AS-14).
        // TODO(S10): emitir notificacion ASIGNACION_CURSO al colaborador (D-AS-13, D88).
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
          // Race: otro admin asigno el mismo colaborador en paralelo. Lo
          // tratamos como `YA_INSCRITO` y seguimos con el resto del batch.
          rechazadasAcum.push({ colaboradorId, motivo: "YA_INSCRITO" })
          continue
        }
        throw error
      }
    }
    return creadas
  }

  async convertirAAsignado(
    asignacionId: string,
    motivo: string,
    autorUsuarioId: string,
  ): Promise<Asignacion> {
    const previa = await this.prisma.asignacionCurso.findUnique({
      where: { id: asignacionId },
      select: { id: true, rol: true, estadoVoluntario: true },
    })
    if (!previa) {
      throw new NotFoundException({
        code: apiErrorCodes.asignacionNoEncontrada,
        message: `Asignacion ${asignacionId} no encontrada.`,
      })
    }
    if (previa.rol !== RolAsignacion.VOLUNTARIO) {
      throw new ConflictException({
        code: apiErrorCodes.conflictAsignacionNoVoluntario,
        message: "La asignacion no esta en rol VOLUNTARIO.",
        details: { rol: previa.rol },
      })
    }
    const estadoVoluntarioPrevio = previa.estadoVoluntario ?? "INSCRITO"

    return await this.prisma.$transaction(async (tx) => {
      // M1 race-safe (D-AS-6): guard por rol esperado. Segundo writer recibe
      // count=0 y 409 limpio sin duplicar historico.
      const r = await tx.asignacionCurso.updateMany({
        where: { id: asignacionId, rol: RolAsignacion.VOLUNTARIO },
        data: {
          rol: RolAsignacion.ASIGNADO,
          estadoAsignado: "ASIGNADO",
          estadoVoluntario: null,
          origenVoluntario: null,
        },
      })
      if (r.count === 0) {
        throw new ConflictException({
          code: apiErrorCodes.conflictAsignacionNoVoluntario,
          message: "La asignacion ya no esta en rol VOLUNTARIO.",
        })
      }
      await tx.historicoEstadoAsignacion.create({
        data: {
          asignacionId,
          estadoAnterior: `VOLUNTARIO:${estadoVoluntarioPrevio}`,
          estadoNuevo: "ASIGNADO:ASIGNADO",
          motivo,
          autorUsuarioId,
        },
      })
      const row = await tx.asignacionCurso.findUniqueOrThrow({
        where: { id: asignacionId },
        select: SELECT_ASIGNACION_FIELDS,
      })
      // TODO(S7): recalcular plan personal tras la conversion (D-AS-14).
      return toAsignacion(row)
    })
  }

  async listarCursosDisponiblesVoluntario(
    query: { readonly page: number; readonly pageSize: number },
    usuario: SesionUsuario,
  ): Promise<Paginated<CursoDisponibleVoluntario>> {
    const { skip, take, page, pageSize } = resolvePaginacion(query)

    const colaboradorId = await this.colaboradorIdDeUsuario(usuario.usuarioId)
    if (!colaboradorId) {
      return buildPaginatedResponse<CursoDisponibleVoluntario>([], 0, page, pageSize)
    }

    const where: Prisma.CursoWhereInput = {
      estado: EstadoCurso.ACTIVO,
      toggleVoluntarios: true,
      asignaciones: { none: { colaboradorId } },
    }

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.curso.findMany({
        where,
        select: {
          id: true,
          titulo: true,
          fechaInicio: true,
          fechaDeadline: true,
          cliente: { select: { id: true, nombre: true } },
          _count: {
            select: {
              asignaciones: { where: { rol: RolAsignacion.VOLUNTARIO } },
            },
          },
        },
        orderBy: { fechaDeadline: "asc" },
        skip,
        take,
      }),
      this.prisma.curso.count({ where }),
    ])

    const data: CursoDisponibleVoluntario[] = rows.map((c) => ({
      cursoId: c.id,
      titulo: c.titulo,
      cliente: { id: c.cliente.id, nombre: c.cliente.nombre },
      fechaInicio: c.fechaInicio.toISOString().slice(0, 10),
      fechaDeadline: c.fechaDeadline.toISOString().slice(0, 10),
      voluntariosInscritos: c._count.asignaciones,
    }))
    return buildPaginatedResponse(data, total, page, pageSize)
  }

  async autoInscribir(
    cursoId: string,
    input: AutoInscripcionRequest,
    usuario: SesionUsuario,
  ): Promise<Asignacion> {
    const colaboradorId = await this.colaboradorIdDeUsuario(usuario.usuarioId)
    if (!colaboradorId) {
      // Patron P5c: si el usuario no tiene colaborador, 404
      // colaboradorNoEncontrado (no 401: la sesion es valida pero la cuenta
      // esta desligada y no hay nada que mostrar).
      throw new NotFoundException({
        code: apiErrorCodes.colaboradorNoEncontrado,
        message: "El usuario no tiene colaborador asociado.",
      })
    }

    const curso = await this.prisma.curso.findUnique({
      where: { id: cursoId },
      select: { id: true, estado: true, toggleVoluntarios: true },
    })
    if (!curso) {
      throw new NotFoundException({
        code: apiErrorCodes.cursoNoEncontrado,
        message: `Curso ${cursoId} no encontrado.`,
      })
    }
    if (curso.estado !== EstadoCurso.ACTIVO) {
      throw new ConflictException({
        code: apiErrorCodes.conflictCursoNoActivo,
        message: "El curso no admite auto-inscripcion en su estado actual.",
        details: { estado: curso.estado },
      })
    }
    if (!curso.toggleVoluntarios) {
      throw new ForbiddenException({
        code: apiErrorCodes.conflictAutoInscripcionDeshabilitada,
        message: "El curso tiene la auto-inscripcion deshabilitada.",
      })
    }

    try {
      const row = await this.prisma.asignacionCurso.create({
        data: {
          cursoId,
          colaboradorId,
          rol: RolAsignacion.VOLUNTARIO,
          estadoVoluntario: "INSCRITO",
          origenVoluntario: input.origenVoluntario,
          // CHECK chk_asig_resultado_solo_asignado obliga a NULL para voluntarios;
          // el @default(PENDIENTE) del schema solo aplica a ASIGNADO.
          resultadoEntrevistaCliente: null,
        },
        select: SELECT_ASIGNACION_FIELDS,
      })
      // TODO(S10): emitir notificacion ASIGNACION_CURSO al participante (D-AS-13, D88).
      return toAsignacion(row)
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictException({
          code: apiErrorCodes.conflictAsignacionDuplicada,
          message: "El colaborador ya tiene una asignacion en este curso.",
        })
      }
      throw error
    }
  }

  private async colaboradorIdDeUsuario(usuarioId: string): Promise<string | null> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { colaboradorId: true },
    })
    return usuario?.colaboradorId ?? null
  }

  private buildWhereListado(
    cursoId: string,
    query: ListarAsignacionesQuery,
  ): Prisma.AsignacionCursoWhereInput {
    const where: Prisma.AsignacionCursoWhereInput = { cursoId }
    if (query.rol) {
      where.rol = query.rol
    }
    if (query.estado) {
      // El estado se busca en ambas columnas; CHECK asegura que solo una
      // este poblada por fila. No fuerza rol cuando rol no esta filtrado.
      where.OR = [
        { estadoAsignado: query.estado as Prisma.AsignacionCursoWhereInput["estadoAsignado"] },
        {
          estadoVoluntario: query.estado as Prisma.AsignacionCursoWhereInput["estadoVoluntario"],
        },
      ]
    }
    if (query.q) {
      const contains = query.q
      where.colaborador = {
        // biome-ignore lint/style/useNamingConvention: Prisma usa la clave OR en PascalCase.
        OR: [
          { nombre: { contains, mode: "insensitive" } },
          { email: { contains, mode: "insensitive" } },
        ],
      }
    }
    return where
  }
}
