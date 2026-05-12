import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
  forwardRef,
} from "@nestjs/common"
import {
  CrearIntentoTransversalInput,
  CrearIntentoTransversalResponse,
  DisponibilidadTransversalResponse,
  EditarSkillsTransversalInput,
  EditarSkillsTransversalResponse,
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
import { JobEvaluacionTransversalService } from "./job-evaluacion-transversal.service"
import { toIntentoAdmin, toIntentoParticipante } from "./transversal.helpers"
import { SELECT_INTENTO_TRANSVERSAL_FIELDS, SELECT_TRANSVERSAL_FIELDS } from "./transversal.types"

const IDEMPOTENCY_SCOPE_INTENTO = "intento-transversal"
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
  constructor(
    private readonly prisma: PrismaService,
    private readonly idempotency: IdempotencyService,
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
}
