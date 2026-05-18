import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common"
import {
  AnularTransversalResponse,
  CargarCapaComprensionInput,
  CargarCapaCualitativaInput,
  CargarCapaTestsInput,
  CrearIntentoTransversalInput,
  CrearIntentoTransversalResponse,
  DisponibilidadTransversalResponse,
  EditarSkillsTransversalInput,
  EditarSkillsTransversalResponse,
  FinalizarTransversalResponse,
  IntentoTransversalAdminResponse,
  IntentoTransversalParticipanteResponse,
  ListarIntentosTransversalQuery,
  TransversalResponse,
} from "@nexott-learn/shared-types"
import {
  DesbloqueoCurso,
  EstadoAsignado,
  EstadoCurso,
  EstadoVoluntario,
  OrigenNotaSkill,
  Prisma,
  RolAsignacion,
  RolUsuario,
  TipoEventoNotif,
} from "@prisma/client"
import { evaluarCondicionesListo } from "../asignaciones/asignaciones.helpers"
import { apiErrorCodes } from "../common/errors/api-error.codes"
import { Paginated, buildPaginatedResponse, resolvePaginacion } from "../common/http/paginated"
import { IdempotencyService } from "../common/idempotency/idempotency.service"
import { PrismaService } from "../common/prisma/prisma.service"
import { SesionUsuario } from "../common/types/sesion.types"
import { NotaSkillService } from "../nota-skill/nota-skill.service"
import { NotificacionesService } from "../notificaciones/notificaciones.service"
import { PUNTAJES_FALTANTES_ERROR, calcularNotaTransversal } from "./calcular-nota-transversal"
import { motivoTransversal } from "./disponibilidad-motivo.helpers"
import { JobEvaluacionTransversalService } from "./job-evaluacion-transversal.service"
import { type CargarCapaResult, TransversalCapasService } from "./transversal-capas.service"
import { toIntentoAdmin, toIntentoParticipante } from "./transversal.helpers"
import { SELECT_INTENTO_TRANSVERSAL_FIELDS, SELECT_TRANSVERSAL_FIELDS } from "./transversal.types"

export type { CargarCapaResult } from "./transversal-capas.service"

const IDEMPOTENCY_SCOPE_INTENTO = "intento-transversal"
const IDEMPOTENCY_SCOPE_ANULAR = "intento-transversal.anular"
const HTTP_OK = 200
const HTTP_CREATED = 201
const EVALUACION_ETA_MS = 2000

interface AsignacionResuelta {
  readonly id: string
  readonly colaboradorId: string
  readonly cursoId: string
  readonly rol: RolAsignacion
  readonly estadoAsignado: EstadoAsignado | null
  readonly estadoVoluntario: EstadoVoluntario | null
  readonly curso: {
    readonly id: string
    readonly estado: EstadoCurso
    readonly desbloqueo: DesbloqueoCurso
    readonly fechaDesbloqueo: Date | null
    readonly transversalId: string | null
    readonly entrevistaIaId: string | null
  }
}

/**
 * Service del modulo `transversal` (Slice 8 P8a — 6 endpoints).
 *
 * Visibilidad campo-a-campo entre ADMIN y PARTICIPANTE la resuelven los
 * mappers en `transversal.helpers.ts`. El dispatch del job asincrono se
 * delega a `JobEvaluacionTransversalService` para que la TX del POST no
 * bloquee esperando al MockAiProvider.
 *
 * Notas de mapeo asignacion -> intento: el modelo `IntentoTransversal` no
 * persiste `asignacionId` (decision §5.108 — base ajustada al schema vigente).
 * Cada endpoint que reciba `:asignacionId` la resuelve a `(transversalId,
 * colaboradorId)` antes de consultar `intentos_transversal`.
 */
@Injectable()
export class TransversalService {
  private readonly logger = new Logger(TransversalService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly idempotency: IdempotencyService,
    private readonly notaSkill: NotaSkillService,
    private readonly job: JobEvaluacionTransversalService,
    private readonly notificaciones: NotificacionesService,
    private readonly capas: TransversalCapasService,
  ) {}

  // =========================================================================
  // E1. GET /api/v1/cursos/:cursoId/transversal
  // =========================================================================

  async obtenerPorCurso(cursoId: string, usuario: SesionUsuario): Promise<TransversalResponse> {
    const curso = await this.prisma.curso.findUnique({
      where: { id: cursoId },
      select: { id: true, transversalId: true },
    })
    if (!curso) {
      throw new NotFoundException({
        code: apiErrorCodes.cursoNoEncontrado,
        message: `Curso ${cursoId} no encontrado.`,
      })
    }
    if (curso.transversalId === null) {
      throw new NotFoundException({
        code: apiErrorCodes.transversalNoEncontrado,
        message: "El curso no tiene proyecto transversal configurado.",
      })
    }

    if (usuario.rol === RolUsuario.PARTICIPANTE) {
      await this.asegurarParticipanteEnCurso(usuario, cursoId)
    }

    const transversal = await this.prisma.proyectoTransversal.findUniqueOrThrow({
      where: { id: curso.transversalId },
      select: {
        ...SELECT_TRANSVERSAL_FIELDS,
        skills: {
          select: {
            skillId: true,
            skill: { select: { etiquetaVisible: true, areaId: true } },
          },
        },
      },
    })

    return {
      transversalId: transversal.id,
      cursoId: transversal.cursoId,
      descripcion: transversal.descripcion,
      umbralAprobacion: Number(transversal.umbralAprobacion.toString()),
      pesosCapas: {
        tests: Number(transversal.pesoCapaTests.toString()),
        cualitativa: Number(transversal.pesoCapaCualitativa.toString()),
        comprension: Number(transversal.pesoCapaComprension.toString()),
      },
      capasActivas: {
        tests: transversal.capaTestsActiva,
        cualitativa: transversal.capaCualitativaActiva,
        comprension: transversal.capaComprensionActiva,
      },
      skillsQueMide: transversal.skills.map((s) => ({
        skillId: s.skillId,
        nombre: s.skill.etiquetaVisible,
        areaId: s.skill.areaId,
      })),
    }
  }

  // =========================================================================
  // E2. POST /api/v1/cursos/:cursoId/transversal/skills (admin)
  // =========================================================================

  /**
   * Resuelve si un curso esta en estado ACTIVO y por tanto exige X-Motivo.
   * Encapsula la unica consulta de Prisma que el controller necesitaba hacer
   * directo, manteniendo la regla "controller no toca Prisma". Devuelve `false`
   * si el curso no existe (la validacion principal corre en `actualizarSkills`).
   */
  async requiereMotivoPorEstadoCurso(cursoId: string): Promise<boolean> {
    const curso = await this.prisma.curso.findUnique({
      where: { id: cursoId },
      select: { estado: true },
    })
    return curso?.estado === EstadoCurso.ACTIVO
  }

  async actualizarSkills(input: {
    readonly cursoId: string
    readonly body: EditarSkillsTransversalInput
  }): Promise<EditarSkillsTransversalResponse> {
    const curso = await this.prisma.curso.findUnique({
      where: { id: input.cursoId },
      select: { id: true, estado: true, transversalId: true },
    })
    if (!curso) {
      throw new NotFoundException({
        code: apiErrorCodes.cursoNoEncontrado,
        message: `Curso ${input.cursoId} no encontrado.`,
      })
    }
    if (curso.transversalId === null) {
      throw new NotFoundException({
        code: apiErrorCodes.transversalNoEncontrado,
        message: "El curso no tiene proyecto transversal configurado.",
      })
    }
    if (curso.estado === EstadoCurso.ARCHIVADO || curso.estado === EstadoCurso.CERRADO) {
      throw new ConflictException({
        code: apiErrorCodes.conflictCursoEstadoInvalido,
        message: "El curso no admite cambios en estado actual.",
      })
    }

    const transversalId = curso.transversalId
    const skillIds = input.body.skillIds
    const skillsValidas = await this.prisma.skill.findMany({
      where: { id: { in: skillIds }, estado: "ACTIVA" },
      select: { id: true },
    })
    if (skillsValidas.length !== skillIds.length) {
      throw new UnprocessableEntityException({
        code: apiErrorCodes.conflictSkillsTransversalInvalidas,
        message:
          "Una o mas skills no existen, estan archivadas o no son ACTIVA — revise el listado.",
        details: {
          enviadas: skillIds.length,
          validas: skillsValidas.length,
        },
      })
    }

    const skillsExigidas = await this.prisma.cursoSkillExigida.findMany({
      where: { cursoId: input.cursoId, skillId: { in: skillIds } },
      select: { skillId: true },
    })
    if (skillsExigidas.length !== skillIds.length) {
      throw new UnprocessableEntityException({
        code: apiErrorCodes.conflictSkillsTransversalInvalidas,
        message:
          "Solo se permiten skills declaradas como exigidas para el curso (catalogo de cobertura D85).",
        details: {
          enviadas: skillIds.length,
          permitidas: skillsExigidas.length,
        },
      })
    }

    const intentosFinalizados = await this.prisma.intentoTransversal.findMany({
      where: { transversalId, estado: "FINALIZADO", anulado: false },
      select: { id: true },
    })

    await this.prisma.$transaction(async (tx) => {
      await tx.transversalSkill.deleteMany({ where: { transversalId } })
      await tx.transversalSkill.createMany({
        data: skillIds.map((skillId) => ({ transversalId, skillId })),
      })
      // D-S8-C6: recalcular `historico_notas_skill` para intentos FINALIZADO
      // queda diferido a P8b (motor de nota-skill). En P8a solo registramos
      // que la operacion afecto a `intentosFinalizados.length` intentos.
    })

    return {
      transversalId,
      skillsActualizadas: skillIds,
      intentosRecalculados: intentosFinalizados.length,
    }
  }

  // =========================================================================
  // E3. GET /api/v1/asignaciones/:asignacionId/transversal/disponibilidad
  // =========================================================================

  async obtenerDisponibilidad(
    asignacionId: string,
    usuario: SesionUsuario,
  ): Promise<DisponibilidadTransversalResponse> {
    const asignacion = await this.resolverAsignacionConCurso(asignacionId, usuario)
    if (asignacion.curso.transversalId === null) {
      throw new NotFoundException({
        code: apiErrorCodes.transversalNoEncontrado,
        message: "El curso no tiene proyecto transversal configurado.",
      })
    }

    if (asignacion.curso.desbloqueo === DesbloqueoCurso.SIEMPRE) {
      return {
        disponible: true,
        razon: "SIEMPRE",
        fechaDisponibleDesde: null,
        motivoBloqueo: null,
      }
    }
    if (asignacion.curso.desbloqueo === DesbloqueoCurso.DESDE_FECHA) {
      const fecha = asignacion.curso.fechaDesbloqueo
      const fechaIso = fecha ? fecha.toISOString() : null
      const disponible = fecha !== null && Date.now() >= fecha.getTime()
      return {
        disponible,
        razon: "DESDE_FECHA",
        fechaDisponibleDesde: fechaIso,
        motivoBloqueo: disponible ? null : motivoTransversal("DESDE_FECHA", fecha),
      }
    }
    // ENCADENADO
    const evaluacion = await evaluarCondicionesListo(this.prisma, asignacionId, {
      transversalId: asignacion.curso.transversalId,
      entrevistaIaId: asignacion.curso.entrevistaIaId,
    })
    if (evaluacion.planCompleto) {
      return {
        disponible: true,
        razon: "PLAN_COMPLETADO",
        fechaDisponibleDesde: null,
        motivoBloqueo: null,
      }
    }
    return {
      disponible: false,
      razon: "BLOQUEADO_PLAN_INCOMPLETO",
      fechaDisponibleDesde: null,
      motivoBloqueo: motivoTransversal("BLOQUEADO_PLAN_INCOMPLETO", null),
    }
  }

  // =========================================================================
  // E4. POST /api/v1/asignaciones/:asignacionId/intentos-transversal
  // =========================================================================

  async crearIntento(input: {
    readonly asignacionId: string
    readonly body: CrearIntentoTransversalInput
    readonly idempotencyKey: string
    readonly usuario: SesionUsuario
  }): Promise<CrearIntentoTransversalResponse> {
    const asignacion = await this.resolverAsignacionConCurso(input.asignacionId, input.usuario)
    const transversalId = asignacion.curso.transversalId
    if (transversalId === null) {
      throw new NotFoundException({
        code: apiErrorCodes.transversalNoEncontrado,
        message: "El curso no tiene proyecto transversal configurado.",
      })
    }
    if (asignacion.curso.estado !== EstadoCurso.ACTIVO) {
      throw new UnprocessableEntityException({
        code: apiErrorCodes.conflictCursoEstadoInvalido,
        message: "El curso no esta ACTIVO; no se aceptan intentos.",
      })
    }
    if (!this.esAsignacionAbierta(asignacion)) {
      throw new UnprocessableEntityException({
        code: apiErrorCodes.conflictAsignacionEstadoInvalido,
        message:
          "La asignacion debe estar en EN_PROGRESO o LISTO para registrar intentos transversal.",
      })
    }

    const disponibilidad = await this.obtenerDisponibilidad(input.asignacionId, input.usuario)
    if (!disponibilidad.disponible) {
      throw new ConflictException({
        code: apiErrorCodes.conflictTransversalNoDisponible,
        message: "El transversal aun no esta disponible para esta asignacion.",
        details: { razon: disponibilidad.razon },
      })
    }

    const repoUrl = input.body.repoOArtefacto.url
    const comentario = input.body.comentarioColaborador ?? null

    // (S11.5 R-S11.5-1) Idempotencia inter-intentos para TRANSVERSAL_DISPONIBLE:
    // contamos intentos PREVIOS al create. Si era 0, este sera el primer
    // intento del colaborador en este transversal y emitiremos la notif
    // POST-commit. Cualquier intento posterior NO re-emite.
    const intentosPrevios = await this.prisma.intentoTransversal.count({
      where: { transversalId, colaboradorId: asignacion.colaboradorId },
    })

    const ejecucion = await this.idempotency.runOnce<CrearIntentoTransversalResponse>({
      scope: IDEMPOTENCY_SCOPE_INTENTO,
      key: input.idempotencyKey,
      usuarioId: input.usuario.usuarioId,
      requestPayload: {
        asignacionId: input.asignacionId,
        transversalId,
        colaboradorId: asignacion.colaboradorId,
        repoUrl,
        comentario,
      },
      ejecutor: async (tx) => {
        const intento = await tx.intentoTransversal.create({
          data: {
            transversalId,
            colaboradorId: asignacion.colaboradorId,
            estado: "EN_EVALUACION",
            anulado: false,
            repoUrl,
            repoOArtefacto: {
              tipo: "URL_GIT",
              url: repoUrl,
            } as unknown as Prisma.InputJsonValue,
            comentarioColaborador: comentario,
          },
          select: { id: true, fecha: true },
        })
        const eta = new Date(intento.fecha.getTime() + EVALUACION_ETA_MS).toISOString()
        return {
          status: HTTP_CREATED,
          body: {
            intentoId: intento.id,
            estado: "EN_EVALUACION" as const,
            evaluacionAsincronaEsperada: eta,
          } satisfies CrearIntentoTransversalResponse,
        }
      },
    })

    if (!ejecucion.replay) {
      // Dispatch fuera de la TX (R-S8-4: cola en memoria, fire-and-forget).
      this.job.dispatch(ejecucion.body.intentoId)
      // (S11.5) emitido via notificarTransversalDisponible (D-S11.5-A3, D42)
      // solo si era el primer intento del colaborador en este transversal.
      // FUERA del runOnce (R-S11.5-1). Tipo silenciable.
      if (intentosPrevios === 0) {
        await this.notificarTransversalDisponible(ejecucion.body.intentoId, input.asignacionId)
      }
    }

    return ejecucion.body
  }

  // =========================================================================
  // E5. GET /api/v1/intentos-transversal/:intentoId
  // =========================================================================

  async obtenerIntento(
    intentoId: string,
    usuario: SesionUsuario,
  ): Promise<IntentoTransversalAdminResponse | IntentoTransversalParticipanteResponse> {
    const intento = await this.prisma.intentoTransversal.findUnique({
      where: { id: intentoId },
      select: SELECT_INTENTO_TRANSVERSAL_FIELDS,
    })
    if (!intento) {
      throw new NotFoundException({
        code: apiErrorCodes.intentoTransversalNoEncontrado,
        message: `Intento transversal ${intentoId} no encontrado.`,
      })
    }
    if (usuario.rol === RolUsuario.PARTICIPANTE) {
      const colaboradorId = await this.resolverColaboradorIdParticipante(usuario)
      if (colaboradorId === null || colaboradorId !== intento.colaboradorId) {
        // D-AS-9 / D-S7-D1: 404 patron uniforme (no revelar pertenencia).
        throw new NotFoundException({
          code: apiErrorCodes.intentoTransversalNoEncontrado,
          message: `Intento transversal ${intentoId} no encontrado.`,
        })
      }
      return toIntentoParticipante(intento)
    }
    return toIntentoAdmin(intento)
  }

  // =========================================================================
  // E6. GET /api/v1/asignaciones/:asignacionId/intentos-transversal
  // =========================================================================

  async listarIntentos(input: {
    readonly asignacionId: string
    readonly query: ListarIntentosTransversalQuery
    readonly usuario: SesionUsuario
  }): Promise<Paginated<IntentoTransversalAdminResponse | IntentoTransversalParticipanteResponse>> {
    const asignacion = await this.resolverAsignacionConCurso(input.asignacionId, input.usuario)
    if (asignacion.curso.transversalId === null) {
      throw new NotFoundException({
        code: apiErrorCodes.transversalNoEncontrado,
        message: "El curso no tiene proyecto transversal configurado.",
      })
    }

    const { skip, take, page, pageSize } = resolvePaginacion(input.query)
    const where: Prisma.IntentoTransversalWhereInput = {
      transversalId: asignacion.curso.transversalId,
      colaboradorId: asignacion.colaboradorId,
      ...(input.query.estado ? { estado: input.query.estado } : {}),
    }
    const [data, total] = await this.prisma.$transaction([
      this.prisma.intentoTransversal.findMany({
        where,
        select: SELECT_INTENTO_TRANSVERSAL_FIELDS,
        orderBy: { fecha: "desc" },
        skip,
        take,
      }),
      this.prisma.intentoTransversal.count({ where }),
    ])
    const mapper = input.usuario.rol === RolUsuario.ADMIN ? toIntentoAdmin : toIntentoParticipante
    return buildPaginatedResponse(data.map(mapper), total, page, pageSize)
  }

  // =========================================================================
  // E7. POST /api/v1/intentos-transversal/:intentoId/capas/tests
  // E8. POST /api/v1/intentos-transversal/:intentoId/capas/cualitativa
  // E9. POST /api/v1/intentos-transversal/:intentoId/capas/comprension
  //
  // Fachadas que delegan en `TransversalCapasService`. La logica vive ahi
  // para romper la dependencia circular con `JobEvaluacionTransversalService`
  // (Fase 1.3): el job invoca a `capas` directo en vez de a este service.
  // =========================================================================

  cargarCapaTests(input: {
    readonly intentoId: string
    readonly body: CargarCapaTestsInput
    readonly idempotencyKey: string
    readonly usuario: SesionUsuario
  }): Promise<CargarCapaResult> {
    return this.capas.cargarCapaTests(input)
  }

  cargarCapaCualitativa(input: {
    readonly intentoId: string
    readonly body: CargarCapaCualitativaInput
    readonly idempotencyKey: string
    readonly usuario: SesionUsuario
  }): Promise<CargarCapaResult> {
    return this.capas.cargarCapaCualitativa(input)
  }

  cargarCapaComprension(input: {
    readonly intentoId: string
    readonly body: CargarCapaComprensionInput
    readonly idempotencyKey: string
    readonly usuario: SesionUsuario
  }): Promise<CargarCapaResult> {
    return this.capas.cargarCapaComprension(input)
  }

  // =========================================================================
  // E10. POST /api/v1/intentos-transversal/:intentoId/finalizar
  //
  // D-S8-C4 + D-S8-C6: calcula nota global ponderada con redistribucion D35,
  // marca aprobado, replica a skills etiquetadas e inserta historico_notas_skill
  // y recalcula notas_skill via NotaSkillService (D33).
  // =========================================================================

  async finalizar(input: {
    readonly intentoId: string
    readonly usuario: SesionUsuario
  }): Promise<FinalizarTransversalResponse> {
    const intento = await this.prisma.intentoTransversal.findUnique({
      where: { id: input.intentoId },
      select: {
        id: true,
        transversalId: true,
        colaboradorId: true,
        estado: true,
        anulado: true,
        notaCapaTests: true,
        notaCapaCualitativa: true,
        notaCapaComprension: true,
        transversal: {
          select: {
            cursoId: true,
            umbralAprobacion: true,
            pesoCapaTests: true,
            pesoCapaCualitativa: true,
            pesoCapaComprension: true,
            capaTestsActiva: true,
            capaCualitativaActiva: true,
            capaComprensionActiva: true,
            skills: { select: { skillId: true } },
          },
        },
      },
    })
    if (!intento) {
      throw new NotFoundException({
        code: apiErrorCodes.intentoTransversalNoEncontrado,
        message: `Intento transversal ${input.intentoId} no encontrado.`,
      })
    }
    if (intento.anulado) {
      throw new ConflictException({
        code: apiErrorCodes.conflictIntentoTransversalYaAnulado,
        message: "El intento esta anulado; no se puede finalizar.",
      })
    }
    if (intento.estado !== "EVALUADO") {
      throw new ConflictException({
        code: apiErrorCodes.conflictIntentoTransversalNoEvaluado,
        message: `Solo se puede finalizar desde estado EVALUADO (actual=${intento.estado}).`,
      })
    }

    let notaGlobal: number
    try {
      notaGlobal = calcularNotaTransversal(
        {
          tests: intento.notaCapaTests === null ? null : Number(intento.notaCapaTests.toString()),
          cualitativa:
            intento.notaCapaCualitativa === null
              ? null
              : Number(intento.notaCapaCualitativa.toString()),
          comprension:
            intento.notaCapaComprension === null
              ? null
              : Number(intento.notaCapaComprension.toString()),
        },
        {
          tests: Number(intento.transversal.pesoCapaTests.toString()),
          cualitativa: Number(intento.transversal.pesoCapaCualitativa.toString()),
          comprension: Number(intento.transversal.pesoCapaComprension.toString()),
        },
        {
          tests: intento.transversal.capaTestsActiva,
          cualitativa: intento.transversal.capaCualitativaActiva,
          comprension: intento.transversal.capaComprensionActiva,
        },
      )
    } catch (error) {
      if (error instanceof Error && error.message === PUNTAJES_FALTANTES_ERROR) {
        throw new ConflictException({
          code: apiErrorCodes.puntajesFaltantes,
          message: "No hay capas activas con nota suficientes para calcular nota global.",
        })
      }
      throw error
    }

    const umbral = Number(intento.transversal.umbralAprobacion.toString())
    const aprobado = notaGlobal >= umbral
    const skillsIds = intento.transversal.skills.map((s) => s.skillId)

    await this.prisma.$transaction(async (tx) => {
      // M1 race-safe: solo transiciona si sigue en EVALUADO + no anulado.
      // §5.118: persistimos `fechaFinalizacion` para que la politica "ultimo
      // aprobado" (D-S8-C5) ordene por el evento real, no por fecha de creacion.
      const r = await tx.intentoTransversal.updateMany({
        where: { id: input.intentoId, estado: "EVALUADO", anulado: false },
        data: {
          estado: "FINALIZADO",
          notaGlobal: new Prisma.Decimal(notaGlobal),
          aprobado,
          fechaFinalizacion: new Date(),
        },
      })
      if (r.count === 0) {
        throw new ConflictException({
          code: apiErrorCodes.conflictIntentoTransversalNoEvaluado,
          message: "El intento ya no esta en EVALUADO (race detectada).",
        })
      }
      for (const skillId of skillsIds) {
        await this.notaSkill.recalcularConFuentes(tx, {
          colaboradorId: intento.colaboradorId,
          skillId,
          cursoId: intento.transversal.cursoId,
          origen: OrigenNotaSkill.TRANSVERSAL,
          referencia: {
            intentoTransversalId: input.intentoId,
            evento: "FINALIZADO",
          },
        })
      }
    })

    return {
      intentoId: input.intentoId,
      notaGlobal,
      aprobado,
      skillsActualizadas: skillsIds,
    }
  }

  // =========================================================================
  // E11. POST /api/v1/intentos-transversal/:intentoId/anular
  //
  // Cierra brecha 7.E5.1 (D-S8-C7). Marca anulado, motivoAnulacion y estado
  // ANULADO; recalcula notas_skill para skills etiquetadas (puede caer la
  // nota vigente si era este intento). X-Motivo requerido + Idempotency-Key.
  // =========================================================================

  async anular(input: {
    readonly intentoId: string
    readonly motivo: string
    readonly idempotencyKey: string
    readonly usuario: SesionUsuario
  }): Promise<{ readonly response: AnularTransversalResponse; readonly replay: boolean }> {
    const ejecucion = await this.idempotency.runOnce<AnularTransversalResponse>({
      scope: IDEMPOTENCY_SCOPE_ANULAR,
      key: input.idempotencyKey,
      usuarioId: input.usuario.usuarioId,
      requestPayload: { intentoId: input.intentoId },
      ejecutor: async (tx) => {
        const intento = await tx.intentoTransversal.findUnique({
          where: { id: input.intentoId },
          select: {
            id: true,
            transversalId: true,
            colaboradorId: true,
            estado: true,
            anulado: true,
            transversal: {
              select: {
                cursoId: true,
                skills: { select: { skillId: true } },
              },
            },
          },
        })
        if (!intento) {
          throw new NotFoundException({
            code: apiErrorCodes.intentoTransversalNoEncontrado,
            message: `Intento transversal ${input.intentoId} no encontrado.`,
          })
        }
        if (intento.anulado) {
          throw new ConflictException({
            code: apiErrorCodes.conflictIntentoTransversalYaAnulado,
            message: "El intento ya esta anulado.",
          })
        }

        const r = await tx.intentoTransversal.updateMany({
          where: { id: input.intentoId, anulado: false },
          data: {
            anulado: true,
            motivoAnulacion: input.motivo,
            estado: "ANULADO",
          },
        })
        if (r.count === 0) {
          // Carrera muy estrecha: otra writer anulo entre el SELECT y el UPDATE.
          throw new ConflictException({
            code: apiErrorCodes.conflictIntentoTransversalYaAnulado,
            message: "El intento ya esta anulado (race detectada).",
          })
        }

        const skillsIds = intento.transversal.skills.map((s) => s.skillId)
        for (const skillId of skillsIds) {
          await this.notaSkill.recalcularConFuentes(tx, {
            colaboradorId: intento.colaboradorId,
            skillId,
            cursoId: intento.transversal.cursoId,
            origen: OrigenNotaSkill.TRANSVERSAL,
            referencia: {
              intentoTransversalId: input.intentoId,
              evento: "ANULADO",
              motivoLength: input.motivo.length,
            },
          })
        }

        return {
          status: HTTP_OK,
          body: {
            intentoId: input.intentoId,
            anulado: true as const,
            skillsRecalculadas: skillsIds,
          } satisfies AnularTransversalResponse,
        }
      },
    })
    return { response: ejecucion.body, replay: ejecucion.replay }
  }

  // =========================================================================
  // Helpers internos
  // =========================================================================

  private async asegurarParticipanteEnCurso(
    usuario: SesionUsuario,
    cursoId: string,
  ): Promise<void> {
    const colaboradorId = await this.resolverColaboradorIdParticipante(usuario)
    if (colaboradorId === null) {
      throw new NotFoundException({
        code: apiErrorCodes.transversalNoEncontrado,
        message: "El curso no tiene proyecto transversal configurado.",
      })
    }
    const asignacion = await this.prisma.asignacionCurso.findUnique({
      where: {
        // biome-ignore lint/style/useNamingConvention: clave compuesta generada por Prisma para @@unique.
        colaboradorId_cursoId: { colaboradorId, cursoId },
      },
      select: { id: true },
    })
    if (!asignacion) {
      throw new NotFoundException({
        code: apiErrorCodes.transversalNoEncontrado,
        message: "El curso no tiene proyecto transversal configurado.",
      })
    }
  }

  private async resolverAsignacionConCurso(
    asignacionId: string,
    usuario: SesionUsuario,
  ): Promise<AsignacionResuelta> {
    const asignacion = await this.prisma.asignacionCurso.findUnique({
      where: { id: asignacionId },
      select: {
        id: true,
        colaboradorId: true,
        cursoId: true,
        rol: true,
        estadoAsignado: true,
        estadoVoluntario: true,
        curso: {
          select: {
            id: true,
            estado: true,
            desbloqueo: true,
            fechaDesbloqueo: true,
            transversalId: true,
            entrevistaIaId: true,
          },
        },
      },
    })
    if (!asignacion) {
      throw new NotFoundException({
        code: apiErrorCodes.asignacionNoEncontrada,
        message: `Asignacion ${asignacionId} no encontrada.`,
      })
    }
    if (usuario.rol === RolUsuario.PARTICIPANTE) {
      const colaboradorId = await this.resolverColaboradorIdParticipante(usuario)
      if (colaboradorId === null || colaboradorId !== asignacion.colaboradorId) {
        // D-AS-9: ocultar existencia.
        throw new NotFoundException({
          code: apiErrorCodes.asignacionNoEncontrada,
          message: `Asignacion ${asignacionId} no encontrada.`,
        })
      }
    }
    return asignacion satisfies AsignacionResuelta
  }

  private async resolverColaboradorIdParticipante(usuario: SesionUsuario): Promise<string | null> {
    const usuarioConColab = await this.prisma.usuario.findUnique({
      where: { id: usuario.usuarioId },
      select: { colaboradorId: true },
    })
    return usuarioConColab?.colaboradorId ?? null
  }

  private esAsignacionAbierta(asignacion: AsignacionResuelta): boolean {
    if (asignacion.rol === RolAsignacion.ASIGNADO) {
      return (
        asignacion.estadoAsignado === EstadoAsignado.EN_PROGRESO ||
        asignacion.estadoAsignado === EstadoAsignado.LISTO
      )
    }
    return (
      asignacion.estadoVoluntario === EstadoVoluntario.EN_PROGRESO ||
      asignacion.estadoVoluntario === EstadoVoluntario.LISTO
    )
  }

  /**
   * Trigger TRANSVERSAL_DISPONIBLE (D-S11.5-A3, D42, §19.3). Tipo silenciable.
   * Identidad del destinatario derivada de la asignacion (NUNCA del body — A01).
   * Cualquier error se loggea sin propagar al participante (R-S11.5-2). Helper
   * se invoca FUERA del `runOnce` y solo cuando era el primer intento del
   * colaborador en este transversal (R-S11.5-1).
   */
  private async notificarTransversalDisponible(
    intentoTransversalId: string,
    asignacionId: string,
  ): Promise<void> {
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
          `notif | transversal-disponible omitida | asignacion=${asignacionId} | motivo=sin-usuario-o-curso`,
        )
        return
      }
      await this.notificaciones.crear({
        usuarioId,
        tipo: TipoEventoNotif.TRANSVERSAL_DISPONIBLE,
        payload: {
          asignacionId,
          cursoId,
          cursoTitulo,
          intentoTransversalId,
        },
      })
    } catch (error) {
      const detalle = error instanceof Error ? error.message : String(error)
      this.logger.warn(
        `notif | fallo | tipo=TRANSVERSAL_DISPONIBLE | asignacion=${asignacionId} | error=${detalle}`,
      )
    }
  }
}
