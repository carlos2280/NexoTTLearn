import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common"
import {
  type CrearIntentoBloqueInput,
  type IntentoBloqueResponse,
  type ListarIntentosBloqueQuery,
  type ListarIntentosCursoBloqueQuery,
} from "@nexott-learn/shared-types"
import {
  EstadoAsignado,
  EstadoCurso,
  EstadoVoluntario,
  OrigenNotaSkill,
  Prisma,
  RolAsignacion,
  RolUsuario,
  TipoBloque,
} from "@prisma/client"
import { apiErrorCodes } from "../common/errors/api-error.codes"
import { Paginated, buildPaginatedResponse, resolvePaginacion } from "../common/http/paginated"
import { IdempotencyService } from "../common/idempotency/idempotency.service"
import { PrismaService } from "../common/prisma/prisma.service"
import { SesionUsuario } from "../common/types/sesion.types"
import { NotaSkillService } from "../nota-skill/nota-skill.service"
import { CodigoEvaluadorService } from "./codigo-evaluador.service"
import {
  calcularNotaQuiz,
  parsearContenidoQuiz,
  toIntentoResponse,
} from "./intentos-bloque.helpers"
import { type CalculoQuizResultado, SELECT_INTENTO_FIELDS } from "./intentos-bloque.types"

const IDEMPOTENCY_SCOPE = "intento-bloque"
const HTTP_CREATED = 201
const HISTORICO_LITERAL_ASIGNADO_ASIGNADO = "ASIGNADO:ASIGNADO" as const
const HISTORICO_LITERAL_ASIGNADO_EN_PROGRESO = "ASIGNADO:EN_PROGRESO" as const
const HISTORICO_LITERAL_VOLUNTARIO_INSCRITO = "VOLUNTARIO:INSCRITO" as const
const HISTORICO_LITERAL_VOLUNTARIO_EN_PROGRESO = "VOLUNTARIO:EN_PROGRESO" as const
const MOTIVO_TRANSICION_AUTOMATICA = "TRANSICION_AUTOMATICA_POR_INTENTO" as const

type PrismaTx = Prisma.TransactionClient

interface CrearIntentoInput {
  readonly body: CrearIntentoBloqueInput
  readonly idempotencyKey: string
  readonly usuario: SesionUsuario
}

interface CrearIntentoResult {
  readonly status: number
  readonly body: IntentoBloqueResponse
  readonly replay: boolean
}

interface InvalidarResult {
  readonly intento: IntentoBloqueResponse
  readonly motivoLength: number
  readonly bloqueId: string
  readonly colaboradorId: string
}

/**
 * Service del modulo `intentos-bloque` (Slice 7 P7b).
 *
 * Cubre los 5 endpoints del dominio (D-S7-C1..C6, D-S7-D1..D6):
 *  - `POST /intentos-bloque` (PARTICIPANTE para si, Idempotency-Key obligatoria).
 *  - `GET /colaboradores/:id/bloques/:id/intentos` (admin o propio).
 *  - `GET /colaboradores/:id/bloques/:id/mejor-intento` (admin o propio).
 *  - `GET /cursos/:id/bloques/:id/intentos` (admin).
 *  - `POST /intentos-bloque/:id/invalidar` (admin con X-Motivo).
 *
 * El audit `INTENTO_BLOQUE_INVALIDADO` lo registra el controller fuera del TX.
 * `INTENTO_BLOQUE_REGISTRADO` NO se audita (D-S7-D4): la fila `IntentoBloque`
 * es el audit funcional.
 */
@Injectable()
export class IntentosBloqueService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly idempotency: IdempotencyService,
    private readonly notaSkill: NotaSkillService,
    private readonly codigoEvaluador: CodigoEvaluadorService,
  ) {}

  // =========================================================================
  // POST /intentos-bloque
  // =========================================================================

  async crear(input: CrearIntentoInput): Promise<CrearIntentoResult> {
    const colaboradorId = await this.resolverColaboradorIdParticipante(input.usuario)
    if (colaboradorId === null) {
      throw new NotFoundException({
        code: apiErrorCodes.asignacionNoEncontrada,
        message: "El usuario no tiene colaborador asociado.",
      })
    }

    // Pre-checks fuera del TX para fallar rapido sin reservar Idempotency-Key.
    const bloque = await this.prisma.bloque.findUnique({
      where: { id: input.body.bloqueId },
      select: {
        id: true,
        seccionId: true,
        tipo: true,
        esEvaluable: true,
        skillQueMideId: true,
        estado: true,
        version: true,
        contenido: true,
      },
    })
    if (!bloque || bloque.estado !== "ACTIVO") {
      throw new NotFoundException({
        code: apiErrorCodes.bloqueNoEncontrado,
        message: `Bloque ${input.body.bloqueId} no encontrado.`,
      })
    }
    if (!bloque.esEvaluable) {
      throw new ConflictException({
        code: apiErrorCodes.bloqueNoEvaluable,
        message: "El bloque no es evaluable.",
      })
    }
    if (bloque.tipo === TipoBloque.CODIGO_TESTS) {
      // CODIGO_TESTS es contenido auxiliar del admin; nunca recibe intentos.
      // El participante envia codigo al CODIGO_PREGUNTAS asociado.
      throw new ConflictException({
        code: apiErrorCodes.bloqueNoEvaluable,
        message: "CODIGO_TESTS no acepta intentos directos.",
      })
    }
    if (bloque.tipo !== TipoBloque.QUIZ && bloque.tipo !== TipoBloque.CODIGO_PREGUNTAS) {
      throw new ConflictException({
        code: apiErrorCodes.bloqueNoEvaluable,
        message: "Solo se aceptan intentos en bloques QUIZ o CODIGO_PREGUNTAS.",
      })
    }
    if (bloque.skillQueMideId === null) {
      throw new ConflictException({
        code: apiErrorCodes.bloqueSinSkillMedida,
        message: "El bloque evaluable no tiene skill asociada.",
      })
    }
    // El `tipo` del wrapper de respuestas debe coincidir con el tipo de bloque.
    if (input.body.respuestas.tipo !== bloque.tipo) {
      throw new BadRequestException({
        code: apiErrorCodes.invalidBody,
        message: `El tipo de respuestas (${input.body.respuestas.tipo}) no coincide con el bloque (${bloque.tipo}).`,
      })
    }

    const curso = await this.prisma.curso.findUnique({
      where: { id: input.body.cursoId },
      select: { id: true, estado: true },
    })
    if (!curso) {
      throw new NotFoundException({
        code: apiErrorCodes.cursoNoEncontrado,
        message: `Curso ${input.body.cursoId} no encontrado.`,
      })
    }
    if (curso.estado !== EstadoCurso.ACTIVO) {
      throw new ConflictException({
        code: apiErrorCodes.conflictCursoNoActivo,
        message: "El curso no esta activo.",
      })
    }

    // Cruce bloque∈curso: el bloque pertenece a una seccion de un modulo que
    // debe estar habilitado para el curso. Modulo NO tiene cursoId directo —
    // la relacion vive en `CursoModuloHabilitado`. Si la verificacion falla
    // devolvemos 404 sin revelar la existencia del bloque (D-S7-D1).
    const seccion = await this.prisma.seccion.findUnique({
      where: { id: bloque.seccionId },
      select: { id: true, moduloId: true },
    })
    if (!seccion) {
      throw new NotFoundException({
        code: apiErrorCodes.bloqueNoEncontrado,
        message: `Bloque ${input.body.bloqueId} no encontrado.`,
      })
    }
    const moduloHabilitado = await this.prisma.cursoModuloHabilitado.findUnique({
      where: {
        // biome-ignore lint/style/useNamingConvention: clave compuesta generada por Prisma para @@id.
        cursoId_moduloId: { cursoId: curso.id, moduloId: seccion.moduloId },
      },
      select: { cursoId: true },
    })
    if (!moduloHabilitado) {
      throw new NotFoundException({
        code: apiErrorCodes.bloqueNoEncontrado,
        message: `Bloque ${input.body.bloqueId} no encontrado.`,
      })
    }

    const asignacion = await this.prisma.asignacionCurso.findUnique({
      where: {
        // biome-ignore lint/style/useNamingConvention: clave compuesta generada por Prisma para @@unique.
        colaboradorId_cursoId: { colaboradorId, cursoId: curso.id },
      },
      select: { id: true, rol: true, estadoAsignado: true, estadoVoluntario: true },
    })
    if (!asignacion) {
      throw new NotFoundException({
        code: apiErrorCodes.asignacionNoEncontrada,
        message: "El colaborador no tiene asignacion para este curso.",
      })
    }
    if (
      this.esAsignacionCerrada(
        asignacion.rol,
        asignacion.estadoAsignado,
        asignacion.estadoVoluntario,
      )
    ) {
      throw new ConflictException({
        code: apiErrorCodes.conflictAsignacionCerrada,
        message: "La asignacion esta cerrada y no acepta nuevos intentos.",
      })
    }

    // Calculo de la nota — FUERA de la TX (sandbox hace I/O HTTP en el caso
    // CODIGO_PREGUNTAS; jamas hacer I/O externa dentro de Prisma $transaction).
    const { calculo, respuestasPersistidas } = await this.calcularYEnriquecer({
      bloque,
      respuestas: input.body.respuestas,
    })

    const ejecucion = await this.idempotency.runOnce<IntentoBloqueResponse>({
      scope: IDEMPOTENCY_SCOPE,
      key: input.idempotencyKey,
      usuarioId: input.usuario.usuarioId,
      requestPayload: {
        bloqueId: input.body.bloqueId,
        cursoId: input.body.cursoId,
        colaboradorId,
        respuestas: input.body.respuestas,
      },
      ejecutor: async (tx) => {
        const intento = await tx.intentoBloque.create({
          data: {
            colaboradorId,
            bloqueId: bloque.id,
            // bloque.skillQueMideId no es null tras la guarda de arriba.
            skillId: bloque.skillQueMideId as string,
            cursoId: curso.id,
            nota: new Prisma.Decimal(calculo.nota),
            respuestas: respuestasPersistidas as unknown as Prisma.InputJsonValue,
            versionBloque: bloque.version,
            esMejorIntento: false,
            estaInvalidado: false,
          },
          select: SELECT_INTENTO_FIELDS,
        })
        await this.recalcularMejorIntento(tx, {
          colaboradorId,
          bloqueId: bloque.id,
          nuevoIntentoId: intento.id,
          nuevoIntentoNota: calculo.nota,
        })
        await this.notaSkill.recalcularConFuentes(tx, {
          colaboradorId,
          skillId: bloque.skillQueMideId as string,
          cursoId: curso.id,
          origen: OrigenNotaSkill.BLOQUE,
          referencia: {
            intentoBloqueId: intento.id,
            bloqueId: bloque.id,
            version: bloque.version,
            evento: "CREADO",
          },
        })
        await this.transicionarAsignacionSiCorresponde(tx, {
          asignacionId: asignacion.id,
          rol: asignacion.rol,
          autorUsuarioId: input.usuario.usuarioId,
        })
        // Releemos el intento para recoger `esMejorIntento` actualizado.
        const intentoFinal = await tx.intentoBloque.findUniqueOrThrow({
          where: { id: intento.id },
          select: SELECT_INTENTO_FIELDS,
        })
        // (S11.5 cerrado) NO emite notificacion por intento de bloque
        // entregado — D-S7-D3 confirmo silencio en el catalogo D88.
        return { status: HTTP_CREATED, body: toIntentoResponse(intentoFinal) }
      },
    })

    return { status: ejecucion.status, body: ejecucion.body, replay: ejecucion.replay }
  }

  // =========================================================================
  // GET /colaboradores/:colaboradorId/bloques/:bloqueId/intentos
  // =========================================================================

  async listarPorColaboradorYBloque(input: {
    readonly colaboradorId: string
    readonly bloqueId: string
    readonly query: ListarIntentosBloqueQuery
    readonly usuario: SesionUsuario
  }): Promise<Paginated<IntentoBloqueResponse>> {
    await this.asegurarAccesoColaborador(input.usuario, input.colaboradorId)
    const incluirInvalidados = this.resolverIncluirInvalidados(
      input.usuario.rol,
      input.query.incluirInvalidados,
    )
    const { skip, take, page, pageSize } = resolvePaginacion(input.query)
    const where: Prisma.IntentoBloqueWhereInput = {
      colaboradorId: input.colaboradorId,
      bloqueId: input.bloqueId,
      ...(incluirInvalidados ? {} : { estaInvalidado: false }),
    }
    const [data, total] = await this.prisma.$transaction([
      this.prisma.intentoBloque.findMany({
        where,
        select: SELECT_INTENTO_FIELDS,
        orderBy: { fecha: "desc" },
        skip,
        take,
      }),
      this.prisma.intentoBloque.count({ where }),
    ])
    return buildPaginatedResponse(data.map(toIntentoResponse), total, page, pageSize)
  }

  // =========================================================================
  // GET /colaboradores/:colaboradorId/bloques/:bloqueId/mejor-intento
  // =========================================================================

  async obtenerMejorIntento(input: {
    readonly colaboradorId: string
    readonly bloqueId: string
    readonly usuario: SesionUsuario
  }): Promise<IntentoBloqueResponse | null> {
    await this.asegurarAccesoColaborador(input.usuario, input.colaboradorId)
    const intento = await this.prisma.intentoBloque.findFirst({
      where: {
        colaboradorId: input.colaboradorId,
        bloqueId: input.bloqueId,
        esMejorIntento: true,
        estaInvalidado: false,
      },
      select: SELECT_INTENTO_FIELDS,
    })
    return intento ? toIntentoResponse(intento) : null
  }

  // =========================================================================
  // GET /cursos/:cursoId/bloques/:bloqueId/intentos (admin)
  // =========================================================================

  async listarPorCursoYBloque(input: {
    readonly cursoId: string
    readonly bloqueId: string
    readonly query: ListarIntentosCursoBloqueQuery
  }): Promise<Paginated<IntentoBloqueResponse>> {
    const { skip, take, page, pageSize } = resolvePaginacion(input.query)
    const where: Prisma.IntentoBloqueWhereInput = {
      cursoId: input.cursoId,
      bloqueId: input.bloqueId,
      ...(input.query.colaboradorId ? { colaboradorId: input.query.colaboradorId } : {}),
      ...(input.query.incluirInvalidados ? {} : { estaInvalidado: false }),
    }
    const [data, total] = await this.prisma.$transaction([
      this.prisma.intentoBloque.findMany({
        where,
        select: SELECT_INTENTO_FIELDS,
        orderBy: { fecha: "desc" },
        skip,
        take,
      }),
      this.prisma.intentoBloque.count({ where }),
    ])
    return buildPaginatedResponse(data.map(toIntentoResponse), total, page, pageSize)
  }

  // =========================================================================
  // POST /intentos-bloque/:id/invalidar (admin)
  // =========================================================================

  async invalidar(input: {
    readonly intentoId: string
    readonly motivo: string
  }): Promise<InvalidarResult> {
    const motivoTrim = input.motivo.trim()
    if (motivoTrim.length < 3) {
      throw new BadRequestException({
        code: apiErrorCodes.motivoRequerido,
        message: "El header X-Motivo es obligatorio (longitud minima 3).",
      })
    }

    const intentoPrev = await this.prisma.intentoBloque.findUnique({
      where: { id: input.intentoId },
      select: {
        id: true,
        colaboradorId: true,
        bloqueId: true,
        cursoId: true,
        esMejorIntento: true,
        estaInvalidado: true,
        bloque: { select: { skillQueMideId: true, version: true } },
      },
    })
    if (!intentoPrev) {
      throw new NotFoundException({
        code: apiErrorCodes.intentoNoEncontrado,
        message: `Intento ${input.intentoId} no encontrado.`,
      })
    }
    if (intentoPrev.estaInvalidado) {
      throw new ConflictException({
        code: apiErrorCodes.conflictIntentoYaInvalidado,
        message: "El intento ya estaba invalidado.",
      })
    }

    const intentoActualizado = await this.prisma.$transaction(async (tx) => {
      await tx.intentoBloque.update({
        where: { id: intentoPrev.id },
        data: { estaInvalidado: true, esMejorIntento: false },
      })

      if (intentoPrev.esMejorIntento) {
        // Recalcular mejor-intento promoviendo el siguiente vigente con
        // (nota desc, fecha desc) como criterio de desempate.
        const candidato = await tx.intentoBloque.findFirst({
          where: {
            colaboradorId: intentoPrev.colaboradorId,
            bloqueId: intentoPrev.bloqueId,
            estaInvalidado: false,
          },
          orderBy: [{ nota: "desc" }, { fecha: "desc" }],
          select: { id: true },
        })
        if (candidato) {
          await tx.intentoBloque.update({
            where: { id: candidato.id },
            data: { esMejorIntento: true },
          })
        }
        if (intentoPrev.bloque.skillQueMideId !== null) {
          await this.notaSkill.recalcularConFuentes(tx, {
            colaboradorId: intentoPrev.colaboradorId,
            skillId: intentoPrev.bloque.skillQueMideId,
            cursoId: intentoPrev.cursoId,
            origen: OrigenNotaSkill.BLOQUE,
            referencia: {
              intentoBloqueId: intentoPrev.id,
              bloqueId: intentoPrev.bloqueId,
              version: intentoPrev.bloque.version,
              evento: "INVALIDADO",
            },
          })
        }
      }

      return await tx.intentoBloque.findUniqueOrThrow({
        where: { id: intentoPrev.id },
        select: SELECT_INTENTO_FIELDS,
      })
    })

    return {
      intento: toIntentoResponse(intentoActualizado),
      motivoLength: motivoTrim.length,
      bloqueId: intentoPrev.bloqueId,
      colaboradorId: intentoPrev.colaboradorId,
    }
  }

  // =========================================================================
  // Helpers internos
  // =========================================================================

  /**
   * Calcula la nota del intento y produce el JSON enriquecido que se persiste
   * en `IntentoBloque.respuestas`. Enruta por tipo de bloque:
   *  - QUIZ: parsea contenido, corre `calcularNotaQuiz` (sincrono). El JSON
   *    persistido es el wrapper de respuestas tal cual lo envio el cliente.
   *  - CODIGO_PREGUNTAS: delega al `CodigoEvaluadorService` (async: sandbox).
   *    El JSON persistido incluye `codigoEnviado`, `lenguaje`, `resultadosTests`
   *    y los conteos de puntos — todo lo que el participante/admin verá luego.
   */
  private async calcularYEnriquecer(input: {
    readonly bloque: {
      readonly id: string
      readonly seccionId: string
      readonly tipo: TipoBloque
      readonly contenido: Prisma.JsonValue
    }
    readonly respuestas: CrearIntentoBloqueInput["respuestas"]
  }): Promise<{
    readonly calculo: CalculoQuizResultado
    readonly respuestasPersistidas: Record<string, unknown>
  }> {
    if (input.bloque.tipo === TipoBloque.QUIZ && input.respuestas.tipo === "QUIZ") {
      const contenido = parsearContenidoQuiz(input.bloque.contenido)
      const calculo = calcularNotaQuiz(contenido, input.respuestas.preguntas)
      return {
        calculo,
        respuestasPersistidas: { ...input.respuestas },
      }
    }
    if (
      input.bloque.tipo === TipoBloque.CODIGO_PREGUNTAS &&
      input.respuestas.tipo === "CODIGO_PREGUNTAS"
    ) {
      const resultado = await this.codigoEvaluador.evaluar({
        bloque: input.bloque,
        codigoEnviado: input.respuestas.codigoEnviado,
        resultadosReportados: input.respuestas.resultadosTests,
      })
      return {
        calculo: resultado.calculo,
        respuestasPersistidas: {
          tipo: "CODIGO_PREGUNTAS",
          lenguaje: resultado.lenguaje,
          codigoEnviado: input.respuestas.codigoEnviado,
          resultadosTests: resultado.resultadosTests,
          puntosObtenidos: resultado.calculo.puntosObtenidos,
          puntosTotales: resultado.calculo.puntosTotales,
        },
      }
    }
    // Combinacion imposible tras los pre-checks; el `BadRequestException`
    // previo cubre el caso (tipoBloque vs tipoRespuesta divergentes).
    throw new BadRequestException({
      code: apiErrorCodes.invalidBody,
      message: `Tipo de bloque ${input.bloque.tipo} con respuestas ${input.respuestas.tipo} no soportado.`,
    })
  }

  private async resolverColaboradorIdParticipante(usuario: SesionUsuario): Promise<string | null> {
    const usuarioConColab = await this.prisma.usuario.findUnique({
      where: { id: usuario.usuarioId },
      select: { colaboradorId: true },
    })
    return usuarioConColab?.colaboradorId ?? null
  }

  private resolverIncluirInvalidados(rol: RolUsuario, incluir: boolean): boolean {
    // D-S7-D2: PARTICIPANTE no recibe filas invalidadas aunque pase el query
    // `?incluirInvalidados=true`. Solo ADMIN respeta el flag.
    return rol === RolUsuario.ADMIN ? incluir : false
  }

  private async asegurarAccesoColaborador(
    usuario: SesionUsuario,
    colaboradorIdParam: string,
  ): Promise<void> {
    if (usuario.rol === RolUsuario.ADMIN) {
      return
    }
    const colaboradorId = await this.resolverColaboradorIdParticipante(usuario)
    if (colaboradorId === null || colaboradorId !== colaboradorIdParam) {
      // D-S7-D1: 404 patron uniforme; no revelar la existencia del recurso.
      throw new NotFoundException({
        code: apiErrorCodes.asignacionNoEncontrada,
        message: "Recurso no encontrado.",
      })
    }
  }

  private esAsignacionCerrada(
    rol: RolAsignacion,
    estadoAsignado: EstadoAsignado | null,
    estadoVoluntario: EstadoVoluntario | null,
  ): boolean {
    if (rol === RolAsignacion.ASIGNADO) {
      return (
        estadoAsignado === EstadoAsignado.APTO ||
        estadoAsignado === EstadoAsignado.NO_APTO ||
        estadoAsignado === EstadoAsignado.RETIRADO
      )
    }
    return (
      estadoVoluntario === EstadoVoluntario.COMPLETADO ||
      estadoVoluntario === EstadoVoluntario.RETIRADO
    )
  }

  private async recalcularMejorIntento(
    tx: PrismaTx,
    input: {
      readonly colaboradorId: string
      readonly bloqueId: string
      readonly nuevoIntentoId: string
      readonly nuevoIntentoNota: number
    },
  ): Promise<void> {
    const mejorActual = await tx.intentoBloque.findFirst({
      where: {
        colaboradorId: input.colaboradorId,
        bloqueId: input.bloqueId,
        esMejorIntento: true,
        estaInvalidado: false,
      },
      select: { id: true, nota: true },
    })
    if (!mejorActual) {
      await tx.intentoBloque.update({
        where: { id: input.nuevoIntentoId },
        data: { esMejorIntento: true },
      })
      return
    }
    const notaMejorActual = Number(mejorActual.nota.toString())
    if (input.nuevoIntentoNota > notaMejorActual) {
      await tx.intentoBloque.update({
        where: { id: mejorActual.id },
        data: { esMejorIntento: false },
      })
      await tx.intentoBloque.update({
        where: { id: input.nuevoIntentoId },
        data: { esMejorIntento: true },
      })
    }
    // Si la nueva nota no supera la actual, el nuevo intento se queda con
    // `esMejorIntento=false` (estado inicial del INSERT).
  }

  private async transicionarAsignacionSiCorresponde(
    tx: PrismaTx,
    input: {
      readonly asignacionId: string
      readonly rol: RolAsignacion
      readonly autorUsuarioId: string
    },
  ): Promise<void> {
    if (input.rol === RolAsignacion.ASIGNADO) {
      const { count } = await tx.asignacionCurso.updateMany({
        where: {
          id: input.asignacionId,
          rol: RolAsignacion.ASIGNADO,
          estadoAsignado: EstadoAsignado.ASIGNADO,
        },
        data: { estadoAsignado: EstadoAsignado.EN_PROGRESO, fechaInicio: new Date() },
      })
      if (count === 1) {
        await tx.historicoEstadoAsignacion.create({
          data: {
            asignacionId: input.asignacionId,
            estadoAnterior: HISTORICO_LITERAL_ASIGNADO_ASIGNADO,
            estadoNuevo: HISTORICO_LITERAL_ASIGNADO_EN_PROGRESO,
            motivo: MOTIVO_TRANSICION_AUTOMATICA,
            autorUsuarioId: input.autorUsuarioId,
          },
        })
      }
      return
    }
    const { count } = await tx.asignacionCurso.updateMany({
      where: {
        id: input.asignacionId,
        rol: RolAsignacion.VOLUNTARIO,
        estadoVoluntario: EstadoVoluntario.INSCRITO,
      },
      data: { estadoVoluntario: EstadoVoluntario.EN_PROGRESO, fechaInicio: new Date() },
    })
    if (count === 1) {
      await tx.historicoEstadoAsignacion.create({
        data: {
          asignacionId: input.asignacionId,
          estadoAnterior: HISTORICO_LITERAL_VOLUNTARIO_INSCRITO,
          estadoNuevo: HISTORICO_LITERAL_VOLUNTARIO_EN_PROGRESO,
          motivo: MOTIVO_TRANSICION_AUTOMATICA,
          autorUsuarioId: input.autorUsuarioId,
        },
      })
    }
  }
}
