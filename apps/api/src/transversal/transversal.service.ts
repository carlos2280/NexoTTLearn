import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
  forwardRef,
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
} from "@prisma/client"
import { evaluarCondicionesListo } from "../asignaciones/asignaciones.helpers"
import { apiErrorCodes } from "../common/errors/api-error.codes"
import { Paginated, buildPaginatedResponse, resolvePaginacion } from "../common/http/paginated"
import { IdempotencyService } from "../common/idempotency/idempotency.service"
import { PrismaService } from "../common/prisma/prisma.service"
import { SesionUsuario } from "../common/types/sesion.types"
import { NotaSkillService } from "../nota-skill/nota-skill.service"
import { PUNTAJES_FALTANTES_ERROR, calcularNotaTransversal } from "./calcular-nota-transversal"
import { JobEvaluacionTransversalService } from "./job-evaluacion-transversal.service"
import { toIntentoAdmin, toIntentoParticipante } from "./transversal.helpers"
import { SELECT_INTENTO_TRANSVERSAL_FIELDS, SELECT_TRANSVERSAL_FIELDS } from "./transversal.types"

const IDEMPOTENCY_SCOPE_INTENTO = "intento-transversal"
const IDEMPOTENCY_SCOPE_CAPA_TESTS = "intento-transversal.capa-tests"
const IDEMPOTENCY_SCOPE_CAPA_CUALITATIVA = "intento-transversal.capa-cualitativa"
const IDEMPOTENCY_SCOPE_CAPA_COMPRENSION = "intento-transversal.capa-comprension"
const IDEMPOTENCY_SCOPE_ANULAR = "intento-transversal.anular"
const HTTP_OK = 200
const HTTP_CREATED = 201
const EVALUACION_ETA_MS = 2000

type CapaKey = "tests" | "cualitativa" | "comprension"

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
  constructor(
    private readonly prisma: PrismaService,
    private readonly idempotency: IdempotencyService,
    private readonly notaSkill: NotaSkillService,
    @Inject(forwardRef(() => JobEvaluacionTransversalService))
    private readonly job: JobEvaluacionTransversalService,
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
      return { disponible: true, razon: "SIEMPRE", fechaDisponibleDesde: null }
    }
    if (asignacion.curso.desbloqueo === DesbloqueoCurso.DESDE_FECHA) {
      const fecha = asignacion.curso.fechaDesbloqueo
      const fechaIso = fecha ? fecha.toISOString() : null
      const disponible = fecha !== null && Date.now() >= fecha.getTime()
      return { disponible, razon: "DESDE_FECHA", fechaDisponibleDesde: fechaIso }
    }
    // ENCADENADO
    const evaluacion = await evaluarCondicionesListo(this.prisma, asignacionId, {
      transversalId: asignacion.curso.transversalId,
      entrevistaIaId: asignacion.curso.entrevistaIaId,
    })
    if (evaluacion.planCompleto) {
      return { disponible: true, razon: "PLAN_COMPLETADO", fechaDisponibleDesde: null }
    }
    return {
      disponible: false,
      razon: "BLOQUEADO_PLAN_INCOMPLETO",
      fechaDisponibleDesde: null,
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
  // Patron unico: validan estado editable, mezclan detalle en `evaluacionesCapas`
  // y transitionan a EVALUADO si tras la carga las 3 capas activas tienen nota
  // (D-S8-C3). Persistencia idempotente via IdempotencyService.
  // =========================================================================

  cargarCapaTests(input: {
    readonly intentoId: string
    readonly body: CargarCapaTestsInput
    readonly idempotencyKey: string
    readonly usuario: SesionUsuario
  }): Promise<IntentoTransversalAdminResponse> {
    return this.cargarCapaGenerico({
      capa: "tests",
      scope: IDEMPOTENCY_SCOPE_CAPA_TESTS,
      intentoId: input.intentoId,
      nota: input.body.nota,
      detalle: input.body.detalle,
      idempotencyKey: input.idempotencyKey,
      usuario: input.usuario,
    })
  }

  cargarCapaCualitativa(input: {
    readonly intentoId: string
    readonly body: CargarCapaCualitativaInput
    readonly idempotencyKey: string
    readonly usuario: SesionUsuario
  }): Promise<IntentoTransversalAdminResponse> {
    return this.cargarCapaGenerico({
      capa: "cualitativa",
      scope: IDEMPOTENCY_SCOPE_CAPA_CUALITATIVA,
      intentoId: input.intentoId,
      nota: input.body.nota,
      detalle: input.body.detalle as unknown as Record<string, unknown>,
      idempotencyKey: input.idempotencyKey,
      usuario: input.usuario,
    })
  }

  cargarCapaComprension(input: {
    readonly intentoId: string
    readonly body: CargarCapaComprensionInput
    readonly idempotencyKey: string
    readonly usuario: SesionUsuario
  }): Promise<IntentoTransversalAdminResponse> {
    return this.cargarCapaGenerico({
      capa: "comprension",
      scope: IDEMPOTENCY_SCOPE_CAPA_COMPRENSION,
      intentoId: input.intentoId,
      nota: input.body.nota,
      detalle: input.body.detalle as unknown as Record<string, unknown>,
      idempotencyKey: input.idempotencyKey,
      usuario: input.usuario,
    })
  }

  private async cargarCapaGenerico(input: {
    readonly capa: CapaKey
    readonly scope: string
    readonly intentoId: string
    readonly nota: number
    readonly detalle: Record<string, unknown>
    readonly idempotencyKey: string
    readonly usuario: SesionUsuario
  }): Promise<IntentoTransversalAdminResponse> {
    const ejecucion = await this.idempotency.runOnce<IntentoTransversalAdminResponse>({
      scope: input.scope,
      key: input.idempotencyKey,
      usuarioId: input.usuario.usuarioId,
      requestPayload: {
        intentoId: input.intentoId,
        capa: input.capa,
        nota: input.nota,
        detalle: input.detalle,
      },
      ejecutor: async (tx) => {
        const intento = await this.cargarIntentoParaCarga(tx, input.intentoId)
        validarIntentoEditableCapa(intento)
        validarCapaActiva(input.capa, intento.transversal)
        const data = construirDataCargaCapa({
          capa: input.capa,
          nota: input.nota,
          detalle: input.detalle,
          intento,
        })
        const actualizado = await tx.intentoTransversal.update({
          where: { id: input.intentoId },
          data,
          select: SELECT_INTENTO_TRANSVERSAL_FIELDS,
        })
        return { status: HTTP_OK, body: toIntentoAdmin(actualizado) }
      },
    })
    return ejecucion.body
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
      const r = await tx.intentoTransversal.updateMany({
        where: { id: input.intentoId, estado: "EVALUADO", anulado: false },
        data: {
          estado: "FINALIZADO",
          notaGlobal: new Prisma.Decimal(notaGlobal),
          aprobado,
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

  private cargarIntentoParaCarga(
    tx: Prisma.TransactionClient,
    intentoId: string,
  ): Promise<IntentoConCapasYActivas> {
    return tx.intentoTransversal
      .findUnique({
        where: { id: intentoId },
        select: {
          id: true,
          estado: true,
          anulado: true,
          notaCapaTests: true,
          notaCapaCualitativa: true,
          notaCapaComprension: true,
          evaluacionesCapas: true,
          transversal: {
            select: {
              capaTestsActiva: true,
              capaCualitativaActiva: true,
              capaComprensionActiva: true,
            },
          },
        },
      })
      .then((intento) => {
        if (!intento) {
          throw new NotFoundException({
            code: apiErrorCodes.intentoTransversalNoEncontrado,
            message: `Intento transversal ${intentoId} no encontrado.`,
          })
        }
        return intento
      })
  }

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
}

interface IntentoConCapasYActivas {
  readonly id: string
  readonly estado: "EN_EVALUACION" | "EVALUADO" | "FINALIZADO" | "ANULADO"
  readonly anulado: boolean
  readonly notaCapaTests: Prisma.Decimal | null
  readonly notaCapaCualitativa: Prisma.Decimal | null
  readonly notaCapaComprension: Prisma.Decimal | null
  readonly evaluacionesCapas: Prisma.JsonValue
  readonly transversal: {
    readonly capaTestsActiva: boolean
    readonly capaCualitativaActiva: boolean
    readonly capaComprensionActiva: boolean
  }
}

function validarIntentoEditableCapa(intento: IntentoConCapasYActivas): void {
  if (intento.anulado || intento.estado === "FINALIZADO" || intento.estado === "ANULADO") {
    throw new ConflictException({
      code: apiErrorCodes.conflictIntentoTransversalNoEditable,
      message: "El intento no admite cargar capas en su estado actual.",
      details: { estado: intento.estado, anulado: intento.anulado },
    })
  }
}

function validarCapaActiva(capa: CapaKey, flags: IntentoConCapasYActivas["transversal"]): void {
  const activa =
    capa === "tests"
      ? flags.capaTestsActiva
      : capa === "cualitativa"
        ? flags.capaCualitativaActiva
        : flags.capaComprensionActiva
  if (!activa) {
    throw new ConflictException({
      code: apiErrorCodes.conflictCapaInactiva,
      message: `La capa ${capa} esta desactivada en este curso.`,
    })
  }
}

function construirDataCargaCapa(input: {
  readonly capa: CapaKey
  readonly nota: number
  readonly detalle: Record<string, unknown>
  readonly intento: IntentoConCapasYActivas
}): Prisma.IntentoTransversalUpdateInput {
  const detalleActualizado: Record<string, unknown> = {
    ...parseDetalleCapas(input.intento.evaluacionesCapas),
    [input.capa]: input.detalle,
  }
  const data: Prisma.IntentoTransversalUpdateInput = {
    evaluacionesCapas: detalleActualizado as unknown as Prisma.InputJsonValue,
  }
  if (input.capa === "tests") {
    data.notaCapaTests = new Prisma.Decimal(input.nota)
  } else if (input.capa === "cualitativa") {
    data.notaCapaCualitativa = new Prisma.Decimal(input.nota)
  } else {
    data.notaCapaComprension = new Prisma.Decimal(input.nota)
  }
  const notasProyectadas = proyectarNotasTrasCarga(input.capa, input.nota, input.intento)
  if (todasCapasActivasConNota(notasProyectadas, input.intento.transversal)) {
    data.estado = "EVALUADO"
  }
  return data
}

function proyectarNotasTrasCarga(
  capa: CapaKey,
  nota: number,
  intento: IntentoConCapasYActivas,
): {
  readonly tests: number | null
  readonly cualitativa: number | null
  readonly comprension: number | null
} {
  return {
    tests:
      capa === "tests"
        ? nota
        : intento.notaCapaTests === null
          ? null
          : Number(intento.notaCapaTests.toString()),
    cualitativa:
      capa === "cualitativa"
        ? nota
        : intento.notaCapaCualitativa === null
          ? null
          : Number(intento.notaCapaCualitativa.toString()),
    comprension:
      capa === "comprension"
        ? nota
        : intento.notaCapaComprension === null
          ? null
          : Number(intento.notaCapaComprension.toString()),
  }
}

/**
 * Lee `evaluacionesCapas` JSON sin reventar si esta corrupto. Devuelve siempre
 * un record indexable para mezclar el detalle nuevo.
 */
function parseDetalleCapas(value: Prisma.JsonValue): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {}
  }
  return { ...(value as Record<string, unknown>) }
}

/**
 * Determina si las capas activas tienen TODAS nota tras la proyeccion de la
 * carga actual — gatilla la transicion a `EVALUADO` (D-S8-C3).
 */
function todasCapasActivasConNota(
  notas: {
    readonly tests: number | null
    readonly cualitativa: number | null
    readonly comprension: number | null
  },
  capasActivas: {
    readonly capaTestsActiva: boolean
    readonly capaCualitativaActiva: boolean
    readonly capaComprensionActiva: boolean
  },
): boolean {
  if (capasActivas.capaTestsActiva && notas.tests === null) {
    return false
  }
  if (capasActivas.capaCualitativaActiva && notas.cualitativa === null) {
    return false
  }
  if (capasActivas.capaComprensionActiva && notas.comprension === null) {
    return false
  }
  return true
}
