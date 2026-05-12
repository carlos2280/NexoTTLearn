import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common"
import {
  Asignacion,
  AsignacionDetallada,
  AsignacionHistoricoEntrada,
  AsignacionRechazada,
  AutoInscripcionRequest,
  CerrarCasoAsignadoRequest,
  CerrarCasoVoluntarioRequest,
  CrearAsignacionesBatchRequest,
  CrearAsignacionesBatchResponse,
  CursoDisponibleVoluntario,
  ListarAsignacionesQuery,
  PaginacionQuery,
  Paginated,
  PatchResultadoEntrevistaRequest,
  cerrarCasoAsignadoSchema,
  cerrarCasoVoluntarioSchema,
} from "@nexott-learn/shared-types"
import { EstadoCurso, Prisma, RolAsignacion, RolUsuario, TipoEventoNotif } from "@prisma/client"
import { apiErrorCodes } from "../common/errors/api-error.codes"
import { buildPaginatedResponse, resolvePaginacion } from "../common/http/paginated"
import { IdempotencyService } from "../common/idempotency/idempotency.service"
import { PrismaService } from "../common/prisma/prisma.service"
import { SesionUsuario } from "../common/types/sesion.types"
import { NotificacionesService } from "../notificaciones/notificaciones.service"
import { ResultadoCierre } from "../notificaciones/payload/resultado-cierre.payload"
import { PlanPersonalService } from "../plan-personal/plan-personal.service"
import {
  HISTORICO_LITERAL_ASIGNADO_ASIGNADO,
  SELECT_ASIGNACION_DETALLE_FIELDS,
  SELECT_ASIGNACION_FIELDS,
  esEstadoAsignado,
  esEstadoCerradoParaReabrir,
  esEstadoVoluntario,
  evaluarCondicionesListo,
  literalEstado,
  toAsignacion,
  toAsignacionDetallada,
} from "./asignaciones.helpers"

const IDEMPOTENCY_SCOPE_CERRAR = "asignaciones.cerrar-caso"
const IDEMPOTENCY_SCOPE_REABRIR = "asignaciones.reabrir-caso"
const HTTP_OK = 200

export interface IniciarProgresoResultado {
  readonly asignacion: Asignacion
  /** `true` si la transicion modifico estado; `false` si era noop (idempotencia). */
  readonly transiciono: boolean
}

export interface CerrarCasoResultado {
  readonly asignacion: Asignacion
  /** `false` cuando el resultado proviene del cache de idempotencia. */
  readonly nuevo: boolean
}

export interface ReabrirCasoResultado {
  readonly asignacion: Asignacion
  readonly nuevo: boolean
}

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
  private readonly logger = new Logger(AsignacionesService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly idempotency: IdempotencyService,
    private readonly planPersonal: PlanPersonalService,
    private readonly notificaciones: NotificacionesService,
  ) {}

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
      // §5.75: 1 sola query con relacion reverse colaborador.usuarios.
      // Evita el lookup previo de `colaboradorId` para escenarios donde el
      // PARTICIPANTE no tiene asignacion en el curso (caso comun en bandeja).
      const propia = await this.prisma.asignacionCurso.findFirst({
        where: {
          cursoId,
          colaborador: { usuario: { is: { id: usuario.usuarioId } } },
        },
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
        // Calculo del plan personal en el mismo flujo (D-S7-B4). Si falla,
        // el service del plan lo loguea y no aborta el alta; el admin puede
        // recalcular manualmente (POST /plan/recalcular).
        await this.planPersonal.calcularSiAsignado(row.id)
        // (S11.5) emitido via notificarAsignacionCurso (D-S11.5-A1, D88) —
        // broadcast 1-a-1 solo para las efectivamente creadas (no para las
        // que rebotaron por race P2002 -> YA_INSCRITO). Best-effort: errores
        // no propagan al admin (R-S11.5-2).
        await this.notificarAsignacionCurso(row.id)
        // TODO(S11): emitir notificacion PLAN_CALCULADO al participante (D-S7-D3).
        //  -- nota P10c: el calculo del plan no llama a calcularExplicito/recalcular,
        //     usa calcularSiAsignado interno; el trigger debe cablearse aqui en S11.
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
    if (previa.rol === RolAsignacion.VOLUNTARIO && previa.estadoVoluntario === null) {
      // §5.81: CHECK chk_asig_rol_estado deberia prevenir este caso; el
      // fallback `?? "INSCRITO"` existe como defensa en profundidad y
      // queda registrado en logs si llegara a dispararse.
      this.logger.warn(
        `Asignacion ${previa.id}: rol=VOLUNTARIO con estadoVoluntario=null (CHECK chk_asig_rol_estado deberia prevenirlo)`,
      )
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
          estadoNuevo: HISTORICO_LITERAL_ASIGNADO_ASIGNADO,
          motivo,
          autorUsuarioId,
        },
      })
      const row = await tx.asignacionCurso.findUniqueOrThrow({
        where: { id: asignacionId },
        select: SELECT_ASIGNACION_FIELDS,
      })
      // Calcular plan personal en el mismo TX (D-S7-B4). El voluntario
      // promovido pasa a ASIGNADO y obtiene plan calculado desde cero.
      await this.planPersonal.calcularSiAsignado(asignacionId, tx)
      // TODO(S11): emitir notificacion PLAN_CALCULADO al participante (D-S7-D3).
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
      // (S11.5) emitido via notificarAsignacionCurso (D-S11.5-A1, D88) tras el
      // exito del flujo voluntario. Best-effort: errores no propagan al
      // participante (R-S11.5-2).
      await this.notificarAsignacionCurso(row.id)
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

  // ===== Slice 6 P6b — Transiciones de estado =====

  /**
   * `POST /asignaciones/:id/iniciar-progreso` — ADMIN o el propio
   * PARTICIPANTE. Transicion `ASIGNADO|INSCRITO -> EN_PROGRESO`.
   * Idempotente: si ya estaba en `EN_PROGRESO`, devuelve la asignacion
   * actual con `transiciono=false` para que el controller omita audit.
   *
   * Scope PARTICIPANTE (D-AS-9 / D-CUR-13): si la asignacion no pertenece
   * al colaborador del usuario, 404 `asignacionNoEncontrada`.
   *
   * §5.85 — Nota sobre idempotencia: el noop es post-commit, NO race-safe.
   * Si dos requests concurrentes con estado `ASIGNADO|INSCRITO` llegan al
   * mismo tiempo, una transiciona y la otra recibe 409
   * `conflictAsignacionEstado` (cuando el `updateMany` devuelve `count===0`).
   * El cliente puede reintentar y obtener el noop con `transiciono=false`.
   */
  async iniciarProgreso(
    asignacionId: string,
    usuario: SesionUsuario,
  ): Promise<IniciarProgresoResultado> {
    // §5.87: `previa` lee directo `SELECT_ASIGNACION_FIELDS` para devolver
    // la asignacion en la rama noop sin un segundo SELECT. La rama no-noop
    // sigue releyendo post-`updateMany` para reflejar el estado nuevo.
    const previa = await this.prisma.asignacionCurso.findUnique({
      where: { id: asignacionId },
      select: SELECT_ASIGNACION_FIELDS,
    })
    if (!previa) {
      throw new NotFoundException({
        code: apiErrorCodes.asignacionNoEncontrada,
        message: `Asignacion ${asignacionId} no encontrada.`,
      })
    }
    if (usuario.rol === RolUsuario.PARTICIPANTE) {
      const colaboradorId = await this.colaboradorIdDeUsuario(usuario.usuarioId)
      if (!colaboradorId || previa.colaboradorId !== colaboradorId) {
        // D-AS-9: ocultar existencia, no 403.
        throw new NotFoundException({
          code: apiErrorCodes.asignacionNoEncontrada,
          message: `Asignacion ${asignacionId} no encontrada.`,
        })
      }
    }

    // Idempotencia implicita: si ya esta EN_PROGRESO, noop. Devolvemos la
    // misma `previa` ya leida con `SELECT_ASIGNACION_FIELDS` (sin segundo SELECT).
    if (
      (previa.rol === RolAsignacion.ASIGNADO && previa.estadoAsignado === "EN_PROGRESO") ||
      (previa.rol === RolAsignacion.VOLUNTARIO && previa.estadoVoluntario === "EN_PROGRESO")
    ) {
      return { asignacion: toAsignacion(previa), transiciono: false }
    }

    const fechaInicio = previa.fechaInicio ?? new Date()
    const estadoAnterior = literalEstado(previa.rol, previa.estadoAsignado, previa.estadoVoluntario)
    const estadoNuevo = literalEstado(
      previa.rol,
      previa.rol === RolAsignacion.ASIGNADO ? "EN_PROGRESO" : null,
      previa.rol === RolAsignacion.VOLUNTARIO ? "EN_PROGRESO" : null,
    )

    const asignacion = await this.prisma.$transaction(async (tx) => {
      // M1 race-safe (D-AS-6): guard por estado origen esperado.
      const r = await tx.asignacionCurso.updateMany({
        where:
          previa.rol === RolAsignacion.ASIGNADO
            ? { id: asignacionId, estadoAsignado: "ASIGNADO" }
            : { id: asignacionId, estadoVoluntario: "INSCRITO" },
        data:
          previa.rol === RolAsignacion.ASIGNADO
            ? { estadoAsignado: "EN_PROGRESO", fechaInicio }
            : { estadoVoluntario: "EN_PROGRESO", fechaInicio },
      })
      if (r.count === 0) {
        throw new ConflictException({
          code: apiErrorCodes.conflictAsignacionEstado,
          message: "La asignacion no esta en un estado valido para iniciar progreso.",
        })
      }
      await tx.historicoEstadoAsignacion.create({
        data: {
          asignacionId,
          estadoAnterior,
          estadoNuevo,
          motivo: null,
          autorUsuarioId: usuario.usuarioId,
        },
      })
      const row = await tx.asignacionCurso.findUniqueOrThrow({
        where: { id: asignacionId },
        select: SELECT_ASIGNACION_FIELDS,
      })
      return toAsignacion(row)
    })

    return { asignacion, transiciono: true }
  }

  /**
   * `POST /asignaciones/:id/marcar-listo` — ADMIN. Aplica D-AS-10 (helper
   * `evaluarCondicionesListo`). Transicion `EN_PROGRESO -> LISTO`.
   *
   * En S6 con `toggleCierreAutomatico=true` no se encadena cerrar-caso
   * automatico: el calculo APTO/NO_APTO server-side llega con S7-S9. Hoy
   * deja en `LISTO` y registra TODO inline (decision documentada en design
   * doc D-AS-11 / D-AS-12). El admin sigue llamando `cerrar-caso` manual.
   */
  async marcarListo(asignacionId: string, autorUsuarioId: string): Promise<Asignacion> {
    const previa = await this.prisma.asignacionCurso.findUnique({
      where: { id: asignacionId },
      select: {
        id: true,
        rol: true,
        cursoId: true,
        estadoAsignado: true,
        estadoVoluntario: true,
      },
    })
    if (!previa) {
      throw new NotFoundException({
        code: apiErrorCodes.asignacionNoEncontrada,
        message: `Asignacion ${asignacionId} no encontrada.`,
      })
    }

    const enProgreso =
      (previa.rol === RolAsignacion.ASIGNADO && previa.estadoAsignado === "EN_PROGRESO") ||
      (previa.rol === RolAsignacion.VOLUNTARIO && previa.estadoVoluntario === "EN_PROGRESO")
    if (!enProgreso) {
      throw new ConflictException({
        code: apiErrorCodes.conflictAsignacionEstado,
        message: "Solo se puede marcar listo desde EN_PROGRESO.",
      })
    }

    const curso = await this.prisma.curso.findUniqueOrThrow({
      where: { id: previa.cursoId },
      select: { transversalId: true, entrevistaIaId: true, toggleCierreAutomatico: true },
    })

    const evaluacion = await evaluarCondicionesListo(this.prisma, asignacionId, {
      transversalId: curso.transversalId,
      entrevistaIaId: curso.entrevistaIaId,
    })
    if (!evaluacion.cumple) {
      throw new UnprocessableEntityException({
        code: apiErrorCodes.condicionesListoNoCumplidas,
        message: "El colaborador aun no cumple las condiciones para LISTO.",
        details: { faltantes: evaluacion.faltantes },
      })
    }

    // TODO(S7-S9): cuando `toggleCierreAutomatico=true` y existan plan/transversal/IA,
    // encadenar `cerrar-caso` dentro de este mismo `$transaction` con el resultado
    // calculado server-side (D-AS-11). En S6 sin calculo real, se deja en LISTO y
    // el admin invoca `cerrar-caso` manual con el resultado.

    const estadoAnterior = literalEstado(previa.rol, previa.estadoAsignado, previa.estadoVoluntario)
    const estadoNuevo = literalEstado(
      previa.rol,
      previa.rol === RolAsignacion.ASIGNADO ? "LISTO" : null,
      previa.rol === RolAsignacion.VOLUNTARIO ? "LISTO" : null,
    )

    return await this.prisma.$transaction(async (tx) => {
      const r = await tx.asignacionCurso.updateMany({
        where:
          previa.rol === RolAsignacion.ASIGNADO
            ? { id: asignacionId, estadoAsignado: "EN_PROGRESO" }
            : { id: asignacionId, estadoVoluntario: "EN_PROGRESO" },
        data:
          previa.rol === RolAsignacion.ASIGNADO
            ? { estadoAsignado: "LISTO" }
            : { estadoVoluntario: "LISTO" },
      })
      if (r.count === 0) {
        throw new ConflictException({
          code: apiErrorCodes.conflictAsignacionEstado,
          message: "Solo se puede marcar listo desde EN_PROGRESO.",
        })
      }
      await tx.historicoEstadoAsignacion.create({
        data: {
          asignacionId,
          estadoAnterior,
          estadoNuevo,
          motivo: null,
          autorUsuarioId,
        },
      })
      const row = await tx.asignacionCurso.findUniqueOrThrow({
        where: { id: asignacionId },
        select: SELECT_ASIGNACION_FIELDS,
      })
      // TODO(S11): emitir notificacion COLABORADOR_LISTO al admin del curso (D88).
      return toAsignacion(row)
    })
  }

  /**
   * `POST /asignaciones/:id/cerrar-caso` — ADMIN, idempotency-key requerida.
   * D-AS-12: body discriminado por rol; asignados llevan `resultado`
   * (`APTO`|`NO_APTO`), voluntarios solo `observacionesAdmin`. El service
   * decide el schema segun `asignacion.rol` ya cargado.
   *
   * Estado origen: `EN_PROGRESO` o `LISTO`. Otros estados -> 409
   * `conflictAsignacionNoListoNiEnProgreso`.
   */
  async cerrarCaso(input: {
    readonly asignacionId: string
    readonly bodyRaw: unknown
    readonly motivo: string | null
    readonly idempotencyKey: string
    readonly autorUsuarioId: string
  }): Promise<CerrarCasoResultado> {
    const previa = await this.prisma.asignacionCurso.findUnique({
      where: { id: input.asignacionId },
      select: {
        id: true,
        rol: true,
        estadoAsignado: true,
        estadoVoluntario: true,
      },
    })
    if (!previa) {
      throw new NotFoundException({
        code: apiErrorCodes.asignacionNoEncontrada,
        message: `Asignacion ${input.asignacionId} no encontrada.`,
      })
    }

    const esAsignado = previa.rol === RolAsignacion.ASIGNADO
    const parsed = esAsignado
      ? cerrarCasoAsignadoSchema.safeParse(input.bodyRaw)
      : cerrarCasoVoluntarioSchema.safeParse(input.bodyRaw)
    if (!parsed.success) {
      throw new BadRequestException({
        code: apiErrorCodes.invalidBody,
        message: "Body invalido para cerrar-caso.",
        details: parsed.error.flatten(),
      })
    }

    // La validacion de estado origen se hace DENTRO de `runOnce` para que el
    // replay idempotente (misma key, mismo body) devuelva el cache aunque el
    // estado ya haya transicionado. El primer writer obtiene el guard
    // race-safe via `updateMany WHERE id AND estado IN (LISTO,EN_PROGRESO)`;
    // un segundo cliente NO idempotente con el estado destino recibe 409 al
    // verificar el `count===0` del updateMany.

    const ejecucion = await this.idempotency.runOnce<Asignacion>({
      scope: IDEMPOTENCY_SCOPE_CERRAR,
      key: input.idempotencyKey,
      usuarioId: input.autorUsuarioId,
      requestPayload: {
        asignacionId: input.asignacionId,
        body: parsed.data,
      },
      ejecutor: async (tx) => {
        const fechaCierre = new Date()
        const estadoAnterior = literalEstado(
          previa.rol,
          previa.estadoAsignado,
          previa.estadoVoluntario,
        )

        if (esAsignado) {
          const dto = parsed.data as CerrarCasoAsignadoRequest
          const r = await tx.asignacionCurso.updateMany({
            where: {
              id: input.asignacionId,
              estadoAsignado: { in: ["EN_PROGRESO", "LISTO"] },
            },
            data: {
              estadoAsignado: dto.resultado,
              fechaCierre,
              ...(dto.observacionesAdmin !== undefined
                ? { observacionesAdmin: dto.observacionesAdmin }
                : {}),
            },
          })
          if (r.count === 0) {
            throw new ConflictException({
              code: apiErrorCodes.conflictAsignacionNoListoNiEnProgreso,
              message: "Solo se puede cerrar desde LISTO o EN_PROGRESO.",
            })
          }
          const estadoNuevo = literalEstado(RolAsignacion.ASIGNADO, dto.resultado, null)
          await tx.historicoEstadoAsignacion.create({
            data: {
              asignacionId: input.asignacionId,
              estadoAnterior,
              estadoNuevo,
              motivo: input.motivo,
              autorUsuarioId: input.autorUsuarioId,
            },
          })
        } else {
          const dto = parsed.data as CerrarCasoVoluntarioRequest
          const r = await tx.asignacionCurso.updateMany({
            where: {
              id: input.asignacionId,
              estadoVoluntario: { in: ["EN_PROGRESO", "LISTO"] },
            },
            data: {
              estadoVoluntario: "COMPLETADO",
              fechaCierre,
              ...(dto.observacionesAdmin !== undefined
                ? { observacionesAdmin: dto.observacionesAdmin }
                : {}),
            },
          })
          if (r.count === 0) {
            throw new ConflictException({
              code: apiErrorCodes.conflictAsignacionNoListoNiEnProgreso,
              message: "Solo se puede cerrar desde LISTO o EN_PROGRESO.",
            })
          }
          const estadoNuevo = literalEstado(RolAsignacion.VOLUNTARIO, null, "COMPLETADO")
          await tx.historicoEstadoAsignacion.create({
            data: {
              asignacionId: input.asignacionId,
              estadoAnterior,
              estadoNuevo,
              motivo: input.motivo,
              autorUsuarioId: input.autorUsuarioId,
            },
          })
        }
        const row = await tx.asignacionCurso.findUniqueOrThrow({
          where: { id: input.asignacionId },
          select: SELECT_ASIGNACION_FIELDS,
        })
        return { status: HTTP_OK, body: toAsignacion(row) }
      },
    })

    if (!ejecucion.replay) {
      // D-AUDIT-2 / R-S10-2: notificacion FUERA del runOnce. Si la accion fue
      // un replay idempotente, NO se reemite. RESULTADO_CIERRE es critico
      // (D-S10-C2) — el guard EX_EMPLEADO se aplica en el service de notif.
      const resultadoNotif: ResultadoCierre = esAsignado
        ? (parsed.data as CerrarCasoAsignadoRequest).resultado
        : "COMPLETADO"
      await this.notificarResultadoCierre(input.asignacionId, resultadoNotif)
    }

    return { asignacion: ejecucion.body, nuevo: !ejecucion.replay }
  }

  /**
   * `POST /asignaciones/:id/reabrir-caso` — ADMIN, X-Motivo + Idempotency-Key
   * requeridas. Transicion `APTO|NO_APTO|COMPLETADO -> EN_PROGRESO`.
   * cap. 12.5: las notas previas se conservan (no se toca
   * `resultadoEntrevistaCliente`).
   */
  async reabrirCaso(input: {
    readonly asignacionId: string
    readonly motivo: string
    readonly idempotencyKey: string
    readonly autorUsuarioId: string
  }): Promise<ReabrirCasoResultado> {
    const previa = await this.prisma.asignacionCurso.findUnique({
      where: { id: input.asignacionId },
      select: {
        id: true,
        rol: true,
        estadoAsignado: true,
        estadoVoluntario: true,
      },
    })
    if (!previa) {
      throw new NotFoundException({
        code: apiErrorCodes.asignacionNoEncontrada,
        message: `Asignacion ${input.asignacionId} no encontrada.`,
      })
    }

    // La validacion de estado origen se hace DENTRO de `runOnce` para que el
    // replay idempotente (misma key, mismo body) devuelva el cache aunque el
    // estado ya haya transicionado a EN_PROGRESO. El primer writer obtiene el
    // guard race-safe via `updateMany WHERE id AND estado IN (APTO,NO_APTO,COMPLETADO)`;
    // un segundo cliente NO idempotente con el estado destino recibe 409 al
    // verificar el `count===0` del updateMany.

    const ejecucion = await this.idempotency.runOnce<Asignacion>({
      scope: IDEMPOTENCY_SCOPE_REABRIR,
      key: input.idempotencyKey,
      usuarioId: input.autorUsuarioId,
      requestPayload: { asignacionId: input.asignacionId },
      ejecutor: async (tx) => {
        if (!esEstadoCerradoParaReabrir(previa)) {
          throw new ConflictException({
            code: apiErrorCodes.conflictAsignacionNoCerrada,
            message: "Solo se puede reabrir un caso cerrado (APTO/NO_APTO/COMPLETADO).",
          })
        }

        const estadoAnterior = literalEstado(
          previa.rol,
          previa.estadoAsignado,
          previa.estadoVoluntario,
        )

        if (previa.rol === RolAsignacion.ASIGNADO) {
          const r = await tx.asignacionCurso.updateMany({
            where: {
              id: input.asignacionId,
              estadoAsignado: { in: ["APTO", "NO_APTO"] },
            },
            data: {
              estadoAsignado: "EN_PROGRESO",
              fechaCierre: null,
            },
          })
          if (r.count === 0) {
            throw new ConflictException({
              code: apiErrorCodes.conflictAsignacionNoCerrada,
              message: "Solo se puede reabrir un caso cerrado (APTO/NO_APTO).",
            })
          }
        } else {
          const r = await tx.asignacionCurso.updateMany({
            where: {
              id: input.asignacionId,
              estadoVoluntario: "COMPLETADO",
            },
            data: {
              estadoVoluntario: "EN_PROGRESO",
              fechaCierre: null,
            },
          })
          if (r.count === 0) {
            throw new ConflictException({
              code: apiErrorCodes.conflictAsignacionNoCerrada,
              message: "Solo se puede reabrir un caso cerrado (COMPLETADO).",
            })
          }
        }

        const estadoNuevo = literalEstado(
          previa.rol,
          previa.rol === RolAsignacion.ASIGNADO ? "EN_PROGRESO" : null,
          previa.rol === RolAsignacion.VOLUNTARIO ? "EN_PROGRESO" : null,
        )
        await tx.historicoEstadoAsignacion.create({
          data: {
            asignacionId: input.asignacionId,
            estadoAnterior,
            estadoNuevo,
            motivo: input.motivo,
            autorUsuarioId: input.autorUsuarioId,
          },
        })
        const row = await tx.asignacionCurso.findUniqueOrThrow({
          where: { id: input.asignacionId },
          select: SELECT_ASIGNACION_FIELDS,
        })
        // §9.5: reabrir NO recalcula el plan automaticamente. Se marca como
        // desactualizado y el admin decide via POST /plan/recalcular.
        await tx.planEstudio.updateMany({
          where: { asignacionId: input.asignacionId },
          data: { estaDesactualizado: true },
        })
        // (S11.5) emitido via notificarCasoReabierto FUERA del runOnce — ver
        // bloque post-ejecucion (D-AUDIT-2 / R-S11.5-1).
        // TODO(S11): emitir notificacion PLAN_DESACTUALIZADO al admin (D-S7-D3).
        return { status: HTTP_OK, body: toAsignacion(row) }
      },
    })

    if (!ejecucion.replay) {
      // D-AUDIT-2 / R-S11.5-1: notificacion FUERA del runOnce. Si la accion
      // fue un replay idempotente, NO se reemite. CASO_REABIERTO es critico
      // (D-S11.5-A2) — el guard EX_EMPLEADO se aplica en el service de notif.
      await this.notificarCasoReabierto(input.asignacionId, input.motivo)
    }

    return { asignacion: ejecucion.body, nuevo: !ejecucion.replay }
  }

  /**
   * `POST /asignaciones/:id/retirar` — ADMIN, X-Motivo requerido. Transicion
   * `<cualquier estado activo> -> RETIRADO`. Sin idempotencia (cap. 12.1: es
   * un cierre final por decision administrativa, no reintenable).
   */
  async retirar(asignacionId: string, motivo: string, autorUsuarioId: string): Promise<Asignacion> {
    const previa = await this.prisma.asignacionCurso.findUnique({
      where: { id: asignacionId },
      select: {
        id: true,
        rol: true,
        estadoAsignado: true,
        estadoVoluntario: true,
      },
    })
    if (!previa) {
      throw new NotFoundException({
        code: apiErrorCodes.asignacionNoEncontrada,
        message: `Asignacion ${asignacionId} no encontrada.`,
      })
    }
    const yaRetirado =
      (previa.rol === RolAsignacion.ASIGNADO && previa.estadoAsignado === "RETIRADO") ||
      (previa.rol === RolAsignacion.VOLUNTARIO && previa.estadoVoluntario === "RETIRADO")
    if (yaRetirado) {
      throw new ConflictException({
        code: apiErrorCodes.conflictAsignacionEstado,
        message: "La asignacion ya esta RETIRADA.",
      })
    }

    const estadoAnterior = literalEstado(previa.rol, previa.estadoAsignado, previa.estadoVoluntario)
    const estadoNuevo = literalEstado(
      previa.rol,
      previa.rol === RolAsignacion.ASIGNADO ? "RETIRADO" : null,
      previa.rol === RolAsignacion.VOLUNTARIO ? "RETIRADO" : null,
    )

    return await this.prisma.$transaction(async (tx) => {
      const r = await tx.asignacionCurso.updateMany({
        where:
          previa.rol === RolAsignacion.ASIGNADO
            ? { id: asignacionId, estadoAsignado: { not: "RETIRADO" } }
            : { id: asignacionId, estadoVoluntario: { not: "RETIRADO" } },
        data:
          previa.rol === RolAsignacion.ASIGNADO
            ? { estadoAsignado: "RETIRADO", fechaCierre: new Date() }
            : { estadoVoluntario: "RETIRADO", fechaCierre: new Date() },
      })
      if (r.count === 0) {
        throw new ConflictException({
          code: apiErrorCodes.conflictAsignacionEstado,
          message: "La asignacion ya esta RETIRADA.",
        })
      }
      await tx.historicoEstadoAsignacion.create({
        data: {
          asignacionId,
          estadoAnterior,
          estadoNuevo,
          motivo,
          autorUsuarioId,
        },
      })
      const row = await tx.asignacionCurso.findUniqueOrThrow({
        where: { id: asignacionId },
        select: SELECT_ASIGNACION_FIELDS,
      })
      return toAsignacion(row)
    })
  }

  // ===== Slice 6 P6c — Resultado entrevista cliente + historico =====

  /**
   * `PATCH /asignaciones/:id/resultado-entrevista-cliente` — ADMIN. Registra
   * el resultado real con el cliente externo (D58, cap. 12.6). No afecta a la
   * aptitud calculada; alimenta el reporte de eficacia. CHECK
   * `chk_asig_resultado_solo_asignado` es el guard de ultima instancia en BD.
   *
   * No usa Idempotency-Key: es un UPDATE con valores fijos, naturalmente
   * idempotente. Sin patron M1 race-safe: el CHECK ya bloquea cambios en
   * estados no permitidos.
   */
  async registrarResultadoEntrevistaCliente(
    asignacionId: string,
    input: PatchResultadoEntrevistaRequest,
  ): Promise<Asignacion> {
    const previa = await this.prisma.asignacionCurso.findUnique({
      where: { id: asignacionId },
      select: { id: true, rol: true, estadoAsignado: true },
    })
    if (!previa) {
      throw new NotFoundException({
        code: apiErrorCodes.asignacionNoEncontrada,
        message: `Asignacion ${asignacionId} no encontrada.`,
      })
    }
    if (previa.rol !== RolAsignacion.ASIGNADO) {
      throw new UnprocessableEntityException({
        code: apiErrorCodes.validacionResultadoSoloAsignado,
        message: "El resultado de entrevista cliente solo aplica a asignaciones con rol=ASIGNADO.",
      })
    }
    if (previa.estadoAsignado !== "APTO" && previa.estadoAsignado !== "NO_APTO") {
      throw new UnprocessableEntityException({
        code: apiErrorCodes.validacionAsignacionNoCerrada,
        message: "Solo se puede registrar resultado cuando la asignacion esta APTO o NO_APTO.",
      })
    }

    const row = await this.prisma.asignacionCurso.update({
      where: { id: asignacionId },
      data: {
        resultadoEntrevistaCliente: input.resultadoEntrevistaCliente,
        observacionesCliente: input.observacionesCliente ?? null,
        fechaEntrevistaCliente:
          input.fechaEntrevistaCliente !== undefined
            ? new Date(`${input.fechaEntrevistaCliente}T00:00:00Z`)
            : null,
      },
      select: SELECT_ASIGNACION_FIELDS,
    })
    return toAsignacion(row)
  }

  /**
   * `GET /asignaciones/:id/historico-estados` — ADMIN; PARTICIPANTE solo la
   * suya (D-AS-9: 404 si ajena, NO 403). Ordenado `fecha DESC`, paginado.
   * Sin audit log: lectura admin/propia frecuente, patron heredado de
   * P5c historial (D-CAT-3).
   */
  async obtenerHistoricoEstados(
    asignacionId: string,
    query: PaginacionQuery,
    usuario: SesionUsuario,
  ): Promise<Paginated<AsignacionHistoricoEntrada>> {
    const previa = await this.prisma.asignacionCurso.findUnique({
      where: { id: asignacionId },
      select: { id: true, colaboradorId: true },
    })
    if (!previa) {
      throw new NotFoundException({
        code: apiErrorCodes.asignacionNoEncontrada,
        message: `Asignacion ${asignacionId} no encontrada.`,
      })
    }
    if (usuario.rol === RolUsuario.PARTICIPANTE) {
      const colaboradorId = await this.colaboradorIdDeUsuario(usuario.usuarioId)
      if (!colaboradorId || previa.colaboradorId !== colaboradorId) {
        // D-AS-9: ocultar existencia para PARTICIPANTE ajeno.
        throw new NotFoundException({
          code: apiErrorCodes.asignacionNoEncontrada,
          message: `Asignacion ${asignacionId} no encontrada.`,
        })
      }
    }

    const { skip, take, page, pageSize } = resolvePaginacion(query)
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.historicoEstadoAsignacion.findMany({
        where: { asignacionId },
        select: { fecha: true, estadoAnterior: true, estadoNuevo: true, motivo: true },
        orderBy: { fecha: "desc" },
        skip,
        take,
      }),
      this.prisma.historicoEstadoAsignacion.count({ where: { asignacionId } }),
    ])

    const data: AsignacionHistoricoEntrada[] = rows.map((h) => ({
      fecha: h.fecha.toISOString(),
      estadoAnterior: h.estadoAnterior,
      estadoNuevo: h.estadoNuevo,
      motivo: h.motivo,
    }))
    return buildPaginatedResponse(data, total, page, pageSize)
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
      // §5.80: el schema valida `estado` como union de los 2 enums; los
      // type guards estrechan al enum Prisma adecuado y descartan la
      // columna donde el valor no es valido (e.g. INSCRITO no aplica a
      // estadoAsignado), reemplazando los `as` antiguos.
      const branches: Prisma.AsignacionCursoWhereInput[] = []
      if (esEstadoAsignado(query.estado)) {
        branches.push({ estadoAsignado: query.estado })
      }
      if (esEstadoVoluntario(query.estado)) {
        branches.push({ estadoVoluntario: query.estado })
      }
      where.OR = branches
    }
    if (query.q) {
      const contains = query.q
      // TODO(post-S6 perf): si /asignaciones?q= se vuelve hot path,
      // considerar indice trigram (pg_trgm) sobre colaboradores.nombre y .email
      // para evitar seq-scan con ILIKE %term%.
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

  /**
   * Trigger RESULTADO_CIERRE (D-S10-C9, §19.3.1). Tipo critico — no silenciable.
   * Identidad del destinatario derivada de la asignacion (NUNCA del body).
   * Cualquier error se loggea sin propagar al admin (R-S10-2 / B7).
   */
  private async notificarResultadoCierre(
    asignacionId: string,
    resultado: ResultadoCierre,
  ): Promise<void> {
    try {
      const asignacion = await this.prisma.asignacionCurso.findUnique({
        where: { id: asignacionId },
        select: {
          curso: { select: { titulo: true } },
          colaborador: { select: { usuario: { select: { id: true } } } },
        },
      })
      const usuarioId = asignacion?.colaborador?.usuario?.id
      const cursoTitulo = asignacion?.curso?.titulo
      if (!(usuarioId && cursoTitulo)) {
        this.logger.warn(
          `notif | resultado-cierre omitida | asignacion=${asignacionId} | motivo=sin-usuario-o-curso`,
        )
        return
      }
      await this.notificaciones.crear({
        usuarioId,
        tipo: TipoEventoNotif.RESULTADO_CIERRE,
        payload: {
          asignacionId,
          cursoTitulo,
          resultado,
        },
      })
    } catch (error) {
      const detalle = error instanceof Error ? error.message : String(error)
      this.logger.warn(
        `notif | fallo | tipo=RESULTADO_CIERRE | asignacion=${asignacionId} | error=${detalle}`,
      )
    }
  }

  /**
   * Trigger ASIGNACION_CURSO (D-S11.5-A1, §19.3). Tipo critico — no silenciable.
   * Identidad del destinatario derivada de la asignacion (NUNCA del body — A01).
   * Cualquier error se loggea sin propagar al admin (R-S10-2 / R-S11.5-2).
   *
   * Se invoca:
   *  - en `crearAsignacionesAdmin` por cada asignacion efectivamente creada
   *    (no para las que rebotaron por P2002 race -> YA_INSCRITO).
   *  - en `autoInscribir` tras crear el row VOLUNTARIO con exito.
   */
  private async notificarAsignacionCurso(asignacionId: string): Promise<void> {
    try {
      const asignacion = await this.prisma.asignacionCurso.findUnique({
        where: { id: asignacionId },
        select: {
          curso: { select: { id: true, titulo: true } },
          colaborador: { select: { usuario: { select: { id: true } } } },
        },
      })
      const usuarioId = asignacion?.colaborador?.usuario?.id
      const cursoId = asignacion?.curso?.id
      const cursoTitulo = asignacion?.curso?.titulo
      if (!(usuarioId && cursoId && cursoTitulo)) {
        this.logger.warn(
          `notif | asignacion-curso omitida | asignacion=${asignacionId} | motivo=sin-usuario-o-curso`,
        )
        return
      }
      await this.notificaciones.crear({
        usuarioId,
        tipo: TipoEventoNotif.ASIGNACION_CURSO,
        payload: {
          asignacionId,
          cursoId,
          cursoTitulo,
        },
      })
    } catch (error) {
      const detalle = error instanceof Error ? error.message : String(error)
      this.logger.warn(
        `notif | fallo | tipo=ASIGNACION_CURSO | asignacion=${asignacionId} | error=${detalle}`,
      )
    }
  }

  /**
   * Trigger CASO_REABIERTO (D-S11.5-A2, §19.3). Tipo critico — no silenciable.
   * El motivo viene del header `X-Motivo` validado por `@RequiereMotivo()` en
   * el controller y se incluye en el payload para que el colaborador entienda
   * el porque del cambio. Cualquier error se loggea sin propagar al admin
   * (R-S10-2 / R-S11.5-2). Se invoca FUERA del `runOnce` y solo cuando
   * `!ejecucion.replay` (D-AUDIT-2 / R-S11.5-1).
   */
  private async notificarCasoReabierto(asignacionId: string, motivo: string): Promise<void> {
    try {
      const asignacion = await this.prisma.asignacionCurso.findUnique({
        where: { id: asignacionId },
        select: {
          curso: { select: { id: true, titulo: true } },
          colaborador: { select: { usuario: { select: { id: true } } } },
        },
      })
      const usuarioId = asignacion?.colaborador?.usuario?.id
      const cursoId = asignacion?.curso?.id
      const cursoTitulo = asignacion?.curso?.titulo
      if (!(usuarioId && cursoId && cursoTitulo)) {
        this.logger.warn(
          `notif | caso-reabierto omitida | asignacion=${asignacionId} | motivo=sin-usuario-o-curso`,
        )
        return
      }
      await this.notificaciones.crear({
        usuarioId,
        tipo: TipoEventoNotif.CASO_REABIERTO,
        payload: {
          asignacionId,
          cursoId,
          cursoTitulo,
          motivo,
        },
      })
    } catch (error) {
      const detalle = error instanceof Error ? error.message : String(error)
      this.logger.warn(
        `notif | fallo | tipo=CASO_REABIERTO | asignacion=${asignacionId} | error=${detalle}`,
      )
    }
  }
}
