import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common"
import {
  AjustarEntrevistaResponse,
  AnularEntrevistaResponse,
  CrearIntentoEntrevistaIaResponse,
  DisponibilidadEntrevistaIaResponse,
  EntrevistaIaResponse,
  EnviarTurnoInput,
  EnviarTurnoResponse,
  FinalizarEntrevistaResponse,
  IntentoEntrevistaIaAdminResponse,
  IntentoEntrevistaIaParticipanteResponse,
  ListarIntentosEntrevistaIaQuery,
} from "@nexott-learn/shared-types"
import {
  DesbloqueoCurso,
  OrigenNotaSkill,
  Prisma,
  RolUsuario,
  TipoEventoNotif,
} from "@prisma/client"
import { transversalAprobado } from "../asignaciones/asignaciones.helpers"
import { AiService } from "../common/ai/ai.service"
import { TurnoTranscripcion } from "../common/ai/ai.types"
import { apiErrorCodes } from "../common/errors/api-error.codes"
import { Paginated, buildPaginatedResponse, resolvePaginacion } from "../common/http/paginated"
import { IdempotencyService } from "../common/idempotency/idempotency.service"
import { PrismaService } from "../common/prisma/prisma.service"
import { SesionUsuario } from "../common/types/sesion.types"
import { NotaSkillService } from "../nota-skill/nota-skill.service"
import { NotificacionesService } from "../notificaciones/notificaciones.service"
import {
  IntentoEntrevistaSeleccionado,
  SELECT_INTENTO_ENTREVISTA_FIELDS,
  TranscripcionInterna,
} from "./entrevista-ia.types"
import { construirRubricaSnapshot, construirSnapshotSeccionesBase } from "./snapshot-helpers"
import {
  derivarEstado,
  parsearTranscripcionInterna,
  toIntentoAdmin,
  toIntentoParticipante,
} from "./visibilidad-mapper"

const IDEMPOTENCY_SCOPE_INTENTO_CREAR = "intento-entrevista-ia.crear"
const IDEMPOTENCY_SCOPE_ANULAR = "intento-entrevista-ia.anular"
const HTTP_OK = 200
const HTTP_CREATED = 201
const RATE_LIMIT_VENTANA_MS = 60 * 60 * 1000 // 1 hora
const RATE_LIMIT_MAX = 5

type RazonDisponibilidadGate = "PLAN_INCOMPLETO" | "TRANSVERSAL_NO_APROBADO" | "FECHA_NO_ALCANZADA"

/**
 * Service del modulo `entrevista-ia` (Slice 8 P8c — 9 endpoints).
 *
 * Encapsula:
 *  - Lectura de la definicion + disponibilidad.
 *  - Creacion del intento con snapshot congelado (R-S8-3).
 *  - Conversacion turn-by-turn (sin WS, sintro HTTP).
 *  - Cierre con calculo de notas via Claude + replicacion D33.
 *  - Ajuste y anulacion admin con recalculo de skills.
 *
 * El motor de notas vive en `NotaSkillService`; este service solo orquesta.
 */
@Injectable()
export class EntrevistaIaService {
  private readonly logger = new Logger(EntrevistaIaService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly idempotency: IdempotencyService,
    private readonly ai: AiService,
    private readonly notaSkill: NotaSkillService,
    private readonly notificaciones: NotificacionesService,
  ) {}

  // ===========================================================================
  // E12. GET /api/v1/cursos/:cursoId/entrevista-ia
  // ===========================================================================

  async obtenerPorCurso(cursoId: string, usuario: SesionUsuario): Promise<EntrevistaIaResponse> {
    const curso = await this.prisma.curso.findUnique({
      where: { id: cursoId },
      select: { id: true, entrevistaIaId: true },
    })
    if (!curso) {
      throw new NotFoundException({
        code: apiErrorCodes.cursoNoEncontrado,
        message: `Curso ${cursoId} no encontrado.`,
      })
    }
    if (curso.entrevistaIaId === null) {
      throw new NotFoundException({
        code: apiErrorCodes.entrevistaIaNoEncontrada,
        message: "El curso no tiene entrevista IA configurada.",
      })
    }
    if (usuario.rol === RolUsuario.PARTICIPANTE) {
      await this.asegurarParticipanteEnCurso(usuario, cursoId)
    }
    const entrevista = await this.prisma.entrevistaIA.findUniqueOrThrow({
      where: { id: curso.entrevistaIaId },
      select: {
        id: true,
        cursoId: true,
        umbralAprobacion: true,
        filosofia: true,
        profundidad: true,
        duracionMinutos: true,
        tono: true,
        rubrica: { select: { areaId: true, peso: true } },
      },
    })
    return {
      entrevistaIaId: entrevista.id,
      cursoId: entrevista.cursoId,
      umbralAprobacion: Number(entrevista.umbralAprobacion.toString()),
      filosofia: entrevista.filosofia,
      profundidad: entrevista.profundidad,
      duracionMinutos: entrevista.duracionMinutos,
      tono: entrevista.tono,
      areas: entrevista.rubrica.map((r) => ({
        areaId: r.areaId,
        peso: Number(r.peso.toString()),
      })),
    }
  }

  // ===========================================================================
  // E13. GET /api/v1/asignaciones/:asignacionId/entrevista-ia/disponibilidad
  // ===========================================================================

  async obtenerDisponibilidad(
    asignacionId: string,
    usuario: SesionUsuario,
  ): Promise<DisponibilidadEntrevistaIaResponse> {
    const asignacion = await this.resolverAsignacion(asignacionId, usuario)
    if (asignacion.curso.entrevistaIaId === null) {
      return {
        disponible: false,
        razon: "ENTREVISTA_IA_NO_CONFIGURADA",
        intentosUsadosHoy: 0,
        maxPorHora: RATE_LIMIT_MAX,
      }
    }
    const intentosUsadosHoy = await this.contarIntentosUltimaHora(
      asignacion.colaboradorId,
      asignacion.curso.entrevistaIaId,
    )
    if (intentosUsadosHoy >= RATE_LIMIT_MAX) {
      return {
        disponible: false,
        razon: "RATE_LIMIT_HORA",
        intentosUsadosHoy,
        maxPorHora: RATE_LIMIT_MAX,
      }
    }
    const enCurso = await this.intentoEnCurso(
      asignacion.colaboradorId,
      asignacion.curso.entrevistaIaId,
    )
    if (enCurso) {
      return {
        disponible: false,
        razon: "INTENTO_EN_CURSO",
        intentosUsadosHoy,
        maxPorHora: RATE_LIMIT_MAX,
      }
    }
    const gate = await this.evaluarGateDesbloqueo(asignacion, asignacionId)
    if (gate !== null) {
      return { ...gate, intentosUsadosHoy, maxPorHora: RATE_LIMIT_MAX }
    }
    return {
      disponible: true,
      razon: "DISPONIBLE",
      intentosUsadosHoy,
      maxPorHora: RATE_LIMIT_MAX,
    }
  }

  /**
   * Aplica el gate de desbloqueo del curso (D43/D44). Devuelve `null` si todo
   * ok; en caso contrario retorna el `disponible:false` con su razon.
   *
   *  - `SIEMPRE`        → sin requisitos previos.
   *  - `DESDE_FECHA`    → bloquea hasta `fechaDesbloqueo`.
   *  - `ENCADENADO`     → exige plan completo y, si el curso tiene transversal
   *                       configurado, que ese transversal este aprobado por
   *                       el colaborador (politica "ultimo aprobado").
   */
  private async evaluarGateDesbloqueo(
    asignacion: {
      readonly colaboradorId: string
      readonly curso: {
        readonly transversalId: string | null
        readonly desbloqueo: DesbloqueoCurso
        readonly fechaDesbloqueo: Date | null
      }
    },
    asignacionId: string,
  ): Promise<{ readonly disponible: false; readonly razon: RazonDisponibilidadGate } | null> {
    const { desbloqueo, fechaDesbloqueo, transversalId } = asignacion.curso
    if (desbloqueo === DesbloqueoCurso.SIEMPRE) {
      return null
    }
    if (desbloqueo === DesbloqueoCurso.DESDE_FECHA) {
      const fechaAlcanzada = fechaDesbloqueo !== null && Date.now() >= fechaDesbloqueo.getTime()
      return fechaAlcanzada ? null : { disponible: false, razon: "FECHA_NO_ALCANZADA" }
    }
    // ENCADENADO
    if (!(await this.planEstaCompleto(asignacionId))) {
      return { disponible: false, razon: "PLAN_INCOMPLETO" }
    }
    if (transversalId !== null) {
      const aprobado = await transversalAprobado(this.prisma, {
        colaboradorId: asignacion.colaboradorId,
        transversalId,
      })
      if (!aprobado) {
        return { disponible: false, razon: "TRANSVERSAL_NO_APROBADO" }
      }
    }
    return null
  }

  private errorPorGate(razon: RazonDisponibilidadGate): {
    readonly code: string
    readonly message: string
  } {
    switch (razon) {
      case "PLAN_INCOMPLETO":
        return {
          code: apiErrorCodes.planIncompletoParaEntrevista,
          message: "El plan personal debe estar completo para iniciar la entrevista IA.",
        }
      case "TRANSVERSAL_NO_APROBADO":
        return {
          code: apiErrorCodes.entrevistaIaTransversalNoAprobado,
          message: "Debes aprobar el proyecto transversal antes de iniciar la entrevista IA.",
        }
      case "FECHA_NO_ALCANZADA":
        return {
          code: apiErrorCodes.entrevistaIaFechaNoAlcanzada,
          message: "La entrevista IA aun no esta disponible: no se alcanzo la fecha de desbloqueo.",
        }
      default: {
        // Exhaustividad: si se anade una rama a `RazonDisponibilidadGate` y se
        // olvida un case aqui, TS aborta el cast a `never` en compile time.
        const _exhaustivo: never = razon
        throw new Error(`razon de gate no cubierta: ${String(_exhaustivo)}`)
      }
    }
  }

  // ===========================================================================
  // E14. POST /api/v1/asignaciones/:asignacionId/intentos-entrevista-ia
  // ===========================================================================

  async crearIntento(input: {
    readonly asignacionId: string
    readonly idempotencyKey: string
    readonly usuario: SesionUsuario
  }): Promise<CrearIntentoEntrevistaIaResponse> {
    const asignacion = await this.resolverAsignacion(input.asignacionId, input.usuario)
    if (input.usuario.rol !== RolUsuario.PARTICIPANTE) {
      throw new BadRequestException({
        code: apiErrorCodes.prohibido,
        message: "Solo PARTICIPANTE puede crear intentos de entrevista IA.",
      })
    }
    if (asignacion.curso.entrevistaIaId === null) {
      throw new ConflictException({
        code: apiErrorCodes.entrevistaIaNoConfigurada,
        message: "El curso no tiene entrevista IA configurada.",
      })
    }
    if (
      (await this.contarIntentosUltimaHora(
        asignacion.colaboradorId,
        asignacion.curso.entrevistaIaId,
      )) >= RATE_LIMIT_MAX
    ) {
      throw new ConflictException({
        code: apiErrorCodes.rateLimitEntrevistaIa,
        message: "Se alcanzo el limite de 5 intentos por hora.",
      })
    }
    if (await this.intentoEnCurso(asignacion.colaboradorId, asignacion.curso.entrevistaIaId)) {
      throw new ConflictException({
        code: apiErrorCodes.conflictIntentoEntrevistaEnCurso,
        message: "Ya existe un intento de entrevista IA EN_PROGRESO.",
      })
    }
    const gate = await this.evaluarGateDesbloqueo(asignacion, input.asignacionId)
    if (gate !== null) {
      throw new ConflictException(this.errorPorGate(gate.razon))
    }

    // Construir snapshots fuera de la TX (lecturas pesadas; los snapshots se
    // congelan al crear el intento — R-S8-3).
    const entrevista = await this.prisma.entrevistaIA.findUniqueOrThrow({
      where: { id: asignacion.curso.entrevistaIaId },
      select: {
        umbralAprobacion: true,
        filosofia: true,
        profundidad: true,
        duracionMinutos: true,
        tono: true,
        rubrica: { select: { areaId: true, peso: true } },
      },
    })

    const rubricaSnapshot = construirRubricaSnapshot({
      umbralAprobacion: Number(entrevista.umbralAprobacion.toString()),
      filosofia: entrevista.filosofia,
      profundidad: entrevista.profundidad,
      duracionMinutos: entrevista.duracionMinutos,
      tono: entrevista.tono,
      areas: entrevista.rubrica.map((r) => ({
        areaId: r.areaId,
        peso: Number(r.peso.toString()),
      })),
    })

    const seccionesBaseSnapshot = await this.construirSnapshotSeccionesRecorridas({
      colaboradorId: asignacion.colaboradorId,
      asignacionId: input.asignacionId,
    })

    // Pedir la primera pregunta sincrono — el usuario lo siente como chat.
    const iniciada = await this.ai.iniciarEntrevista({
      profundidad: entrevista.profundidad,
      rubricaSnapshot,
      seccionesBaseSnapshot,
    })

    const ahora = new Date()
    const interna: TranscripcionInterna = {
      estado: "EN_PROGRESO",
      rubricaSnapshot,
      seccionesBaseSnapshot,
      turnos: [
        {
          rol: "ASISTENTE",
          mensaje: iniciada.primeraPregunta,
          timestamp: ahora.toISOString(),
        },
      ],
      fechaFinalizacion: null,
    }

    const entrevistaIaId = asignacion.curso.entrevistaIaId
    const colaboradorId = asignacion.colaboradorId

    // (S11.5 R-S11.5-1) Idempotencia inter-intentos para
    // ENTREVISTA_IA_DISPONIBLE: contamos intentos PREVIOS al create. Si era 0,
    // este sera el primer intento del colaborador en esta entrevista IA y
    // emitiremos la notif POST-commit. Cualquier intento posterior NO re-emite.
    const intentosPrevios = await this.prisma.intentoEntrevistaIA.count({
      where: { entrevistaIaId, colaboradorId },
    })

    const ejecucion = await this.idempotency.runOnce<CrearIntentoEntrevistaIaResponse>({
      scope: IDEMPOTENCY_SCOPE_INTENTO_CREAR,
      key: input.idempotencyKey,
      usuarioId: input.usuario.usuarioId,
      requestPayload: {
        asignacionId: input.asignacionId,
        colaboradorId,
        entrevistaIaId,
      },
      ejecutor: async (tx) => {
        // §5.119: SoT del estado/snapshot pasa a columnas dedicadas. Mantenemos
        // la escritura espejada en `transcripcionOLog` como sombra durante la
        // transicion (consumida por `parsearTranscripcionInterna` para flujo
        // de turnos).
        const intento = await tx.intentoEntrevistaIA.create({
          data: {
            entrevistaIaId,
            colaboradorId,
            estado: "EN_PROGRESO",
            notaGlobal: new Prisma.Decimal(0),
            aprobado: false,
            anulado: false,
            transcripcionOLog: interna as unknown as Prisma.InputJsonValue,
            rubricaSnapshot: rubricaSnapshot as unknown as Prisma.InputJsonValue,
            seccionesBaseSnapshot: seccionesBaseSnapshot as unknown as Prisma.InputJsonValue,
          },
          select: { id: true },
        })
        // Persistimos referencia relacional a las secciones base (modelo
        // fisico §3.36). No bloquea si falla por race; ya tenemos snapshot en
        // JSONB que sirve como autoridad para la IA.
        const seccionIds = seccionesBaseSnapshot.secciones.map((s) => s.seccionId)
        if (seccionIds.length > 0) {
          await tx.intentoEntrevistaIASeccionBase.createMany({
            data: seccionIds.map((seccionId) => ({ intentoId: intento.id, seccionId })),
            skipDuplicates: true,
          })
        }
        return {
          status: HTTP_CREATED,
          body: {
            intentoId: intento.id,
            primeraPregunta: iniciada.primeraPregunta,
          } satisfies CrearIntentoEntrevistaIaResponse,
        }
      },
    })

    if (!ejecucion.replay && intentosPrevios === 0) {
      // (S11.5) emitido via notificarEntrevistaIaDisponible (D-S11.5-A4, D42)
      // solo si era el primer intento del colaborador en esta entrevista IA.
      // FUERA del runOnce (R-S11.5-1). Tipo silenciable.
      await this.notificarEntrevistaIaDisponible(ejecucion.body.intentoId, input.asignacionId)
    }

    return ejecucion.body
  }

  // ===========================================================================
  // E15. POST /api/v1/intentos-entrevista-ia/:intentoId/turnos
  // ===========================================================================

  async enviarTurno(input: {
    readonly intentoId: string
    readonly body: EnviarTurnoInput
    readonly usuario: SesionUsuario
  }): Promise<EnviarTurnoResponse> {
    const intento = await this.cargarIntento(input.intentoId)
    await this.requerirAccesoIntento(intento, input.usuario)
    const interna = parsearTranscripcionInterna(intento.transcripcionOLog)
    const estado = derivarEstado(intento, interna)
    if (estado !== "EN_PROGRESO") {
      throw new ConflictException({
        code: apiErrorCodes.conflictIntentoEntrevistaCerrado,
        message: "El intento no admite mas turnos (cerrado).",
      })
    }
    // Saneamiento (R-S8-9): trim + remove control chars no permitidos.
    // biome-ignore lint/suspicious/noControlCharactersInRegex: el saneamiento intencionalmente elimina C0/C1.
    const mensajeSaneado = input.body.mensaje.replace(/[ -]/g, "").trim()
    if (mensajeSaneado.length === 0) {
      throw new BadRequestException({
        code: apiErrorCodes.invalidBody,
        message: "El mensaje quedo vacio tras el saneamiento.",
      })
    }
    const ahora = new Date()
    const turnosConColaborador = [
      ...interna.turnos,
      {
        rol: "COLABORADOR" as const,
        mensaje: mensajeSaneado,
        timestamp: ahora.toISOString(),
      },
    ]
    const transcripcionParaIa: TurnoTranscripcion[] = turnosConColaborador.map((t) => ({
      rol: t.rol,
      mensaje: t.mensaje,
      timestamp: t.timestamp,
    }))
    const resultadoIa = await this.ai.mantenerTurnoEntrevistaIa({
      transcripcion: transcripcionParaIa,
      rubricaSnapshot: interna.rubricaSnapshot,
      seccionesBaseSnapshot: interna.seccionesBaseSnapshot,
      profundidad: intento.entrevistaIA.profundidad,
    })
    const turnosFinales = [
      ...turnosConColaborador,
      {
        rol: "ASISTENTE" as const,
        mensaje: resultadoIa.respuestaIa,
        timestamp: new Date().toISOString(),
      },
    ]
    const internaActualizada: TranscripcionInterna = {
      estado: "EN_PROGRESO",
      rubricaSnapshot: interna.rubricaSnapshot,
      seccionesBaseSnapshot: interna.seccionesBaseSnapshot,
      turnos: turnosFinales,
      fechaFinalizacion: null,
    }
    await this.prisma.intentoEntrevistaIA.update({
      where: { id: input.intentoId },
      data: {
        transcripcionOLog: internaActualizada as unknown as Prisma.InputJsonValue,
      },
    })
    return {
      respuestaIa: resultadoIa.respuestaIa,
      finalizado: resultadoIa.finalizado,
      siguientePregunta: resultadoIa.finalizado ? null : resultadoIa.respuestaIa,
    }
  }

  // ===========================================================================
  // E16. POST /api/v1/intentos-entrevista-ia/:intentoId/finalizar
  // ===========================================================================

  async finalizar(input: {
    readonly intentoId: string
    readonly usuario: SesionUsuario
  }): Promise<FinalizarEntrevistaResponse> {
    const intento = await this.cargarIntento(input.intentoId)
    await this.requerirAccesoIntento(intento, input.usuario)
    const interna = parsearTranscripcionInterna(intento.transcripcionOLog)
    const estado = derivarEstado(intento, interna)
    if (estado !== "EN_PROGRESO") {
      throw new ConflictException({
        code: apiErrorCodes.conflictIntentoEntrevistaCerrado,
        message: "Solo se puede finalizar un intento EN_PROGRESO.",
      })
    }

    const resultado = await this.ai.calcularNotasFinalEntrevista({
      transcripcion: interna.turnos,
      rubricaSnapshot: interna.rubricaSnapshot,
      profundidad: intento.entrevistaIA.profundidad,
    })

    // Redistribucion D35: si el modelo omitio un area, se reparte su peso.
    const areasRubrica = intento.entrevistaIA.rubrica.map((r) => r.areaId)
    const mapaNotas = new Map(resultado.notasPorArea.map((n) => [n.areaId, n.nota]))
    const notasFinales: Array<{ areaId: string; nota: number }> = areasRubrica.map((areaId) => ({
      areaId,
      nota: mapaNotas.get(areaId) ?? 0,
    }))

    const umbral = Number(intento.entrevistaIA.umbralAprobacion.toString())
    const aprobado = resultado.notaGlobal >= umbral

    const cursoId = intento.entrevistaIA.cursoId
    const colaboradorId = intento.colaboradorId

    const internaFinal: TranscripcionInterna = {
      estado: "FINALIZADO",
      rubricaSnapshot: interna.rubricaSnapshot,
      seccionesBaseSnapshot: interna.seccionesBaseSnapshot,
      turnos: interna.turnos,
      fechaFinalizacion: new Date().toISOString(),
    }

    // Resolver skills afectadas (todas las del area de la rubrica).
    const skillsPorArea = await this.prisma.skill.findMany({
      where: {
        areaId: { in: areasRubrica },
        estado: "ACTIVA",
      },
      select: { id: true, areaId: true },
    })
    const skillsAfectadas = Array.from(new Set(skillsPorArea.map((s) => s.id)))

    await this.prisma.$transaction(async (tx) => {
      // §5.119: persistimos `estado=FINALIZADO` + `fechaFinalizacion` en columnas
      // dedicadas. `transcripcionOLog` queda como sombra para la lectura legacy.
      await tx.intentoEntrevistaIA.update({
        where: { id: input.intentoId },
        data: {
          estado: "FINALIZADO",
          fechaFinalizacion: new Date(),
          notaGlobal: new Prisma.Decimal(resultado.notaGlobal),
          aprobado,
          transcripcionOLog: internaFinal as unknown as Prisma.InputJsonValue,
        },
      })
      for (const { areaId, nota } of notasFinales) {
        await tx.intentoEntrevistaIANotaArea.upsert({
          where: {
            // biome-ignore lint/style/useNamingConvention: clave compuesta generada por Prisma para @@id.
            intentoId_areaId: { intentoId: input.intentoId, areaId },
          },
          create: {
            intentoId: input.intentoId,
            areaId,
            nota: new Prisma.Decimal(nota),
          },
          update: {
            nota: new Prisma.Decimal(nota),
          },
        })
      }
      for (const skillId of skillsAfectadas) {
        await this.notaSkill.recalcularConFuentes(tx, {
          colaboradorId,
          skillId,
          cursoId,
          origen: OrigenNotaSkill.ENTREVISTA_IA,
          referencia: {
            intentoEntrevistaIaId: input.intentoId,
            evento: "FINALIZADO",
          },
        })
      }
    })

    return {
      intentoId: input.intentoId,
      notaGlobal: resultado.notaGlobal,
      aprobado,
      notasPorArea: notasFinales,
      skillsActualizadas: skillsAfectadas,
    }
  }

  // ===========================================================================
  // E17. GET /api/v1/intentos-entrevista-ia/:intentoId
  // ===========================================================================

  async obtenerIntento(
    intentoId: string,
    usuario: SesionUsuario,
  ): Promise<IntentoEntrevistaIaAdminResponse | IntentoEntrevistaIaParticipanteResponse> {
    const intento = await this.cargarIntento(intentoId)
    await this.requerirAccesoIntento(intento, usuario)
    if (usuario.rol === RolUsuario.PARTICIPANTE) {
      return toIntentoParticipante(intento)
    }
    return toIntentoAdmin(intento)
  }

  // ===========================================================================
  // E18. GET /api/v1/asignaciones/:asignacionId/intentos-entrevista-ia
  // ===========================================================================

  async listarIntentos(input: {
    readonly asignacionId: string
    readonly query: ListarIntentosEntrevistaIaQuery
    readonly usuario: SesionUsuario
  }): Promise<
    Paginated<IntentoEntrevistaIaAdminResponse | IntentoEntrevistaIaParticipanteResponse>
  > {
    const asignacion = await this.resolverAsignacion(input.asignacionId, input.usuario)
    if (asignacion.curso.entrevistaIaId === null) {
      throw new NotFoundException({
        code: apiErrorCodes.entrevistaIaNoEncontrada,
        message: "El curso no tiene entrevista IA configurada.",
      })
    }
    const { skip, take, page, pageSize } = resolvePaginacion(input.query)
    const where: Prisma.IntentoEntrevistaIAWhereInput = {
      entrevistaIaId: asignacion.curso.entrevistaIaId,
      colaboradorId: asignacion.colaboradorId,
    }
    const [data, total] = await this.prisma.$transaction([
      this.prisma.intentoEntrevistaIA.findMany({
        where,
        select: SELECT_INTENTO_ENTREVISTA_FIELDS,
        orderBy: { fecha: "desc" },
        skip,
        take,
      }),
      this.prisma.intentoEntrevistaIA.count({ where }),
    ])
    const mapper = input.usuario.rol === RolUsuario.ADMIN ? toIntentoAdmin : toIntentoParticipante
    return buildPaginatedResponse(data.map(mapper), total, page, pageSize)
  }

  // ===========================================================================
  // E19. POST /api/v1/intentos-entrevista-ia/:intentoId/ajustar
  // ===========================================================================

  async ajustar(input: {
    readonly intentoId: string
    readonly notaAjustada: number
    readonly motivo: string
    readonly usuario: SesionUsuario
  }): Promise<AjustarEntrevistaResponse> {
    const intento = await this.cargarIntento(input.intentoId)
    if (intento.anulado) {
      throw new ConflictException({
        code: apiErrorCodes.conflictIntentoEntrevistaYaAnulado,
        message: "El intento esta anulado; no se puede ajustar.",
      })
    }
    const interna = parsearTranscripcionInterna(intento.transcripcionOLog)
    const estado = derivarEstado(intento, interna)
    if (estado !== "FINALIZADO") {
      throw new ConflictException({
        code: apiErrorCodes.conflictIntentoEntrevistaNoFinalizado,
        message: "Solo se puede ajustar un intento FINALIZADO.",
      })
    }

    const cursoId = intento.entrevistaIA.cursoId
    const colaboradorId = intento.colaboradorId
    const areasRubrica = intento.entrevistaIA.rubrica.map((r) => r.areaId)
    const umbral = Number(intento.entrevistaIA.umbralAprobacion.toString())
    const aprobado = input.notaAjustada >= umbral
    const skillsPorArea = await this.prisma.skill.findMany({
      where: { areaId: { in: areasRubrica }, estado: "ACTIVA" },
      select: { id: true },
    })
    const skillsAfectadas = Array.from(new Set(skillsPorArea.map((s) => s.id)))

    await this.prisma.$transaction(async (tx) => {
      await tx.intentoEntrevistaIA.update({
        where: { id: input.intentoId },
        data: {
          notaAjustadaAdmin: new Prisma.Decimal(input.notaAjustada),
          aprobado,
          motivoAjusteOAnulacion: input.motivo,
        },
      })
      for (const skillId of skillsAfectadas) {
        await this.notaSkill.recalcularConFuentes(tx, {
          colaboradorId,
          skillId,
          cursoId,
          origen: OrigenNotaSkill.ENTREVISTA_IA,
          referencia: {
            intentoEntrevistaIaId: input.intentoId,
            evento: "AJUSTADO",
            motivoLength: input.motivo.length,
          },
        })
      }
    })

    return {
      intentoId: input.intentoId,
      notaAjustadaAdmin: input.notaAjustada,
      skillsRecalculadas: skillsAfectadas,
    }
  }

  // ===========================================================================
  // E20. POST /api/v1/intentos-entrevista-ia/:intentoId/anular
  // ===========================================================================

  async anular(input: {
    readonly intentoId: string
    readonly motivo: string
    readonly idempotencyKey: string
    readonly usuario: SesionUsuario
  }): Promise<{ readonly response: AnularEntrevistaResponse; readonly replay: boolean }> {
    const ejecucion = await this.idempotency.runOnce<AnularEntrevistaResponse>({
      scope: IDEMPOTENCY_SCOPE_ANULAR,
      key: input.idempotencyKey,
      usuarioId: input.usuario.usuarioId,
      requestPayload: { intentoId: input.intentoId },
      ejecutor: async (tx) => {
        const intento = await tx.intentoEntrevistaIA.findUnique({
          where: { id: input.intentoId },
          select: {
            id: true,
            anulado: true,
            colaboradorId: true,
            entrevistaIA: {
              select: {
                cursoId: true,
                rubrica: { select: { areaId: true } },
              },
            },
          },
        })
        if (!intento) {
          throw new NotFoundException({
            code: apiErrorCodes.intentoEntrevistaNoEncontrado,
            message: `Intento de entrevista IA ${input.intentoId} no encontrado.`,
          })
        }
        if (intento.anulado) {
          throw new ConflictException({
            code: apiErrorCodes.conflictIntentoEntrevistaYaAnulado,
            message: "El intento ya esta anulado.",
          })
        }
        // §5.119: marcamos `estado=ANULADO` simetrico al transversal P8b.
        const r = await tx.intentoEntrevistaIA.updateMany({
          where: { id: input.intentoId, anulado: false },
          data: {
            anulado: true,
            estado: "ANULADO",
            motivoAjusteOAnulacion: input.motivo,
          },
        })
        if (r.count === 0) {
          throw new ConflictException({
            code: apiErrorCodes.conflictIntentoEntrevistaYaAnulado,
            message: "El intento ya esta anulado (race detectada).",
          })
        }
        const areasRubrica = intento.entrevistaIA.rubrica.map((rb) => rb.areaId)
        const skillsPorArea = await tx.skill.findMany({
          where: { areaId: { in: areasRubrica }, estado: "ACTIVA" },
          select: { id: true },
        })
        const skillsAfectadas = Array.from(new Set(skillsPorArea.map((s) => s.id)))
        for (const skillId of skillsAfectadas) {
          await this.notaSkill.recalcularConFuentes(tx, {
            colaboradorId: intento.colaboradorId,
            skillId,
            cursoId: intento.entrevistaIA.cursoId,
            origen: OrigenNotaSkill.ENTREVISTA_IA,
            referencia: {
              intentoEntrevistaIaId: input.intentoId,
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
            skillsRecalculadas: skillsAfectadas,
          } satisfies AnularEntrevistaResponse,
        }
      },
    })
    return { response: ejecucion.body, replay: ejecucion.replay }
  }

  // ===========================================================================
  // Helpers privados
  // ===========================================================================

  private async cargarIntento(intentoId: string): Promise<IntentoEntrevistaSeleccionado> {
    const intento = await this.prisma.intentoEntrevistaIA.findUnique({
      where: { id: intentoId },
      select: SELECT_INTENTO_ENTREVISTA_FIELDS,
    })
    if (!intento) {
      throw new NotFoundException({
        code: apiErrorCodes.intentoEntrevistaNoEncontrado,
        message: `Intento de entrevista IA ${intentoId} no encontrado.`,
      })
    }
    return intento
  }

  private async requerirAccesoIntento(
    intento: IntentoEntrevistaSeleccionado,
    usuario: SesionUsuario,
  ): Promise<void> {
    if (usuario.rol === RolUsuario.ADMIN) {
      return
    }
    const colaboradorId = await this.resolverColaboradorIdParticipante(usuario)
    if (colaboradorId === null || colaboradorId !== intento.colaboradorId) {
      throw new NotFoundException({
        code: apiErrorCodes.intentoEntrevistaNoEncontrado,
        message: `Intento de entrevista IA ${intento.id} no encontrado.`,
      })
    }
  }

  private async resolverAsignacion(
    asignacionId: string,
    usuario: SesionUsuario,
  ): Promise<{
    readonly id: string
    readonly colaboradorId: string
    readonly curso: {
      readonly id: string
      readonly entrevistaIaId: string | null
      readonly transversalId: string | null
      readonly desbloqueo: DesbloqueoCurso
      readonly fechaDesbloqueo: Date | null
    }
  }> {
    const asignacion = await this.prisma.asignacionCurso.findUnique({
      where: { id: asignacionId },
      select: {
        id: true,
        colaboradorId: true,
        curso: {
          select: {
            id: true,
            entrevistaIaId: true,
            transversalId: true,
            desbloqueo: true,
            fechaDesbloqueo: true,
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
        throw new NotFoundException({
          code: apiErrorCodes.asignacionNoEncontrada,
          message: `Asignacion ${asignacionId} no encontrada.`,
        })
      }
    }
    return asignacion
  }

  private async asegurarParticipanteEnCurso(
    usuario: SesionUsuario,
    cursoId: string,
  ): Promise<void> {
    const colaboradorId = await this.resolverColaboradorIdParticipante(usuario)
    if (colaboradorId === null) {
      throw new NotFoundException({
        code: apiErrorCodes.cursoNoEncontrado,
        message: `Curso ${cursoId} no encontrado.`,
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
        code: apiErrorCodes.cursoNoEncontrado,
        message: `Curso ${cursoId} no encontrado.`,
      })
    }
  }

  private async resolverColaboradorIdParticipante(usuario: SesionUsuario): Promise<string | null> {
    const usuarioConColab = await this.prisma.usuario.findUnique({
      where: { id: usuario.usuarioId },
      select: { colaboradorId: true },
    })
    return usuarioConColab?.colaboradorId ?? null
  }

  private async contarIntentosUltimaHora(
    colaboradorId: string,
    entrevistaIaId: string,
  ): Promise<number> {
    const desde = new Date(Date.now() - RATE_LIMIT_VENTANA_MS)
    const total = await this.prisma.intentoEntrevistaIA.count({
      where: {
        colaboradorId,
        entrevistaIaId,
        fecha: { gte: desde },
      },
    })
    return total
  }

  private async intentoEnCurso(colaboradorId: string, entrevistaIaId: string): Promise<boolean> {
    // §5.119: lectura por columna dedicada `estado`. La duplicidad JSONB queda
    // solo para flujo de turnos.
    const enCurso = await this.prisma.intentoEntrevistaIA.count({
      where: {
        colaboradorId,
        entrevistaIaId,
        anulado: false,
        estado: "EN_PROGRESO",
      },
    })
    return enCurso > 0
  }

  private async planEstaCompleto(asignacionId: string): Promise<boolean> {
    const plan = await this.prisma.planEstudio.findUnique({
      where: { asignacionId },
      select: { id: true },
    })
    if (!plan) {
      return false
    }
    const items = await this.prisma.itemPlan.findMany({
      where: { planId: plan.id, caracter: "OBLIGATORIA" },
      select: {
        seccionId: true,
        seccion: {
          select: {
            bloques: {
              where: { estado: "ACTIVO", esEvaluable: true },
              select: { id: true },
            },
          },
        },
      },
    })
    if (items.length === 0) {
      return true
    }
    const colaboradorId = (
      await this.prisma.asignacionCurso.findUniqueOrThrow({
        where: { id: asignacionId },
        select: { colaboradorId: true },
      })
    ).colaboradorId
    const bloqueIds = items.flatMap((i) => i.seccion.bloques.map((b) => b.id))
    const intentos =
      bloqueIds.length === 0
        ? []
        : await this.prisma.intentoBloque.findMany({
            where: {
              colaboradorId,
              bloqueId: { in: bloqueIds },
              esMejorIntento: true,
              estaInvalidado: false,
            },
            select: { bloqueId: true, nota: true },
          })
    const intentoPorBloque = new Map<string, number>(
      intentos.map((it) => [it.bloqueId, Number(it.nota.toString())]),
    )
    for (const item of items) {
      const bloques = item.seccion.bloques
      if (bloques.length === 0) {
        // Si no hay bloques evaluables, exigimos apertura registrada — el
        // motor de avance hace lo mismo en P7.
        const apertura = await this.prisma.aperturaSeccion.findUnique({
          where: {
            // biome-ignore lint/style/useNamingConvention: clave compuesta generada por Prisma para @@id.
            asignacionId_seccionId: { asignacionId, seccionId: item.seccionId },
          },
          select: { asignacionId: true },
        })
        if (!apertura) {
          return false
        }
        continue
      }
      const cumple = bloques.every((b) => {
        const nota = intentoPorBloque.get(b.id)
        return nota !== undefined && nota >= 60
      })
      if (!cumple) {
        return false
      }
    }
    return true
  }

  /**
   * Construye el snapshot de las secciones que el colaborador efectivamente
   * recorrio: items obligatorios del plan + secciones con apertura registrada.
   * Carga skills y bloques para alimentar el prompt de Claude. R-S8-3.
   */
  private async construirSnapshotSeccionesRecorridas(input: {
    readonly colaboradorId: string
    readonly asignacionId: string
  }): Promise<ReturnType<typeof construirSnapshotSeccionesBase>> {
    const plan = await this.prisma.planEstudio.findUnique({
      where: { asignacionId: input.asignacionId },
      select: {
        items: {
          select: {
            seccionId: true,
            seccion: {
              select: {
                id: true,
                titulo: true,
                modulo: { select: { titulo: true } },
                skills: {
                  select: {
                    skill: {
                      select: { id: true, etiquetaVisible: true, areaId: true },
                    },
                  },
                },
                bloques: {
                  where: { estado: "ACTIVO" },
                  select: { id: true, tipo: true, contenido: true },
                },
              },
            },
          },
        },
      },
    })
    if (!plan) {
      return construirSnapshotSeccionesBase([])
    }
    const aperturas = await this.prisma.aperturaSeccion.findMany({
      where: { asignacionId: input.asignacionId },
      select: { seccionId: true },
    })
    const seccionesAbiertas = new Set(aperturas.map((a) => a.seccionId))
    const seccionesRecorridas = plan.items
      .filter((i) => seccionesAbiertas.has(i.seccionId))
      .map((i) => i.seccion)
    return construirSnapshotSeccionesBase(seccionesRecorridas)
  }

  /**
   * Trigger ENTREVISTA_IA_DISPONIBLE (D-S11.5-A4, D42, §19.3). Tipo silenciable.
   * Identidad del destinatario derivada de la asignacion (NUNCA del body — A01).
   * Cualquier error se loggea sin propagar al participante (R-S11.5-2). Helper
   * se invoca FUERA del `runOnce` y solo cuando era el primer intento del
   * colaborador en esta entrevista IA (R-S11.5-1).
   */
  private async notificarEntrevistaIaDisponible(
    intentoEntrevistaIaId: string,
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
          `notif | entrevista-ia-disponible omitida | asignacion=${asignacionId} | motivo=sin-usuario-o-curso`,
        )
        return
      }
      await this.notificaciones.crear({
        usuarioId,
        tipo: TipoEventoNotif.ENTREVISTA_IA_DISPONIBLE,
        payload: {
          asignacionId,
          cursoId,
          cursoTitulo,
          intentoEntrevistaIaId,
        },
      })
    } catch (error) {
      const detalle = error instanceof Error ? error.message : String(error)
      this.logger.warn(
        `notif | fallo | tipo=ENTREVISTA_IA_DISPONIBLE | asignacion=${asignacionId} | error=${detalle}`,
      )
    }
  }
}
