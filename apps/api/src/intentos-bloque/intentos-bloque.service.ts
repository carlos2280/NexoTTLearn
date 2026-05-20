import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common"
import {
  type BloqueEvaluableAdminItem,
  type BloqueEvaluableColaboradorItem,
  type BloqueEvaluableDetalleResponse,
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
import { umbralAprobacionBloque } from "../catalogo/bloques/umbral-aprobacion"
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
    const { calculo, respuestasPersistidas, notaMinima } = await this.calcularYEnriquecer({
      bloque,
      respuestas: input.body.respuestas,
    })

    // Snapshot del mejor previo (vigente, no invalidado) ANTES del INSERT.
    // Se reutiliza para dos propositos:
    //   - decidir `esPrimeraAprobacion` (B-extra.2 punto 3),
    //   - alimentar `recalcularMejorIntento` sin un round-trip extra a la BD.
    // La lectura va fuera del TX; la consistencia esta protegida por el
    // indice unico parcial `uq_intentos_bloque_mejor` (D-S7-C3).
    const mejorPrevio = await this.prisma.intentoBloque.findFirst({
      where: {
        colaboradorId,
        bloqueId: bloque.id,
        esMejorIntento: true,
        estaInvalidado: false,
      },
      select: { id: true, nota: true },
    })
    const esPrimeraAprobacion = this.calcularEsPrimeraAprobacion({
      notaMinima,
      notaActual: calculo.nota,
      mejorPrevio,
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
            // B-extra.2 punto 4: persistimos las falladas solo para QUIZ.
            // En CODIGO_PREGUNTAS la columna queda null y `toIntentoResponse`
            // devuelve `[]`.
            preguntasFalladas:
              bloque.tipo === TipoBloque.QUIZ
                ? (calculo.preguntasFalladasIds as unknown as Prisma.InputJsonValue)
                : Prisma.DbNull,
            versionBloque: bloque.version,
            esMejorIntento: false,
            estaInvalidado: false,
          },
          select: SELECT_INTENTO_FIELDS,
        })
        await this.recalcularMejorIntento(tx, {
          mejorActual: mejorPrevio,
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
        const base = toIntentoResponse(intentoFinal)
        return {
          status: HTTP_CREATED,
          body: esPrimeraAprobacion === undefined ? base : { ...base, esPrimeraAprobacion },
        }
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
  // GET /cursos/:cursoId/bloques-evaluables (admin)
  // =========================================================================

  /**
   * Listado admin de bloques evaluables del curso con stats agregadas. NO
   * pagina (un curso suele tener < 30 bloques). Solo bloques en módulos
   * habilitados del curso. Stats excluyen intentos invalidados.
   *
   * Estrategia: 2 queries.
   *  1) Bloques + relaciones (sección/módulo/skill) + contenido para umbral.
   *  2) Todos los IntentoBloque del curso (no anulados) con los campos
   *     mínimos para agregar en memoria. Cardinalidad acotada por colaboradores
   *     × bloques × intentos.
   */
  async listarBloquesEvaluablesParaAdmin(cursoId: string): Promise<BloqueEvaluableAdminItem[]> {
    const cursoExiste = await this.prisma.curso.findUnique({
      where: { id: cursoId },
      select: { id: true },
    })
    if (!cursoExiste) {
      throw new NotFoundException({
        code: apiErrorCodes.cursoNoEncontrado,
        message: "Curso no encontrado.",
      })
    }
    const bloques = await this.prisma.bloque.findMany({
      where: {
        esEvaluable: true,
        seccion: {
          modulo: {
            cursosModulosHabilitados: { some: { cursoId } },
          },
        },
      },
      select: {
        id: true,
        orden: true,
        tipo: true,
        version: true,
        contenido: true,
        seccion: {
          select: {
            id: true,
            titulo: true,
            orden: true,
            modulo: { select: { id: true, titulo: true } },
          },
        },
        skillQueMide: { select: { id: true, etiquetaVisible: true } },
      },
      orderBy: [
        { seccion: { modulo: { titulo: "asc" } } },
        { seccion: { orden: "asc" } },
        { orden: "asc" },
      ],
    })
    if (bloques.length === 0) return []

    const bloqueIds = bloques.map((b) => b.id)
    const intentos = await this.prisma.intentoBloque.findMany({
      where: { cursoId, estaInvalidado: false, bloqueId: { in: bloqueIds } },
      select: {
        bloqueId: true,
        colaboradorId: true,
        nota: true,
        esMejorIntento: true,
      },
    })

    const intentosPorBloque = new Map<string, typeof intentos>()
    for (const it of intentos) {
      const arr = intentosPorBloque.get(it.bloqueId) ?? []
      arr.push(it)
      intentosPorBloque.set(it.bloqueId, arr)
    }

    return bloques.map((b): BloqueEvaluableAdminItem => {
      const umbralAprobacion = umbralAprobacionBloque(b.tipo, b.contenido)
      const propios = intentosPorBloque.get(b.id) ?? []
      const colaboradoresUnicos = new Set(propios.map((p) => p.colaboradorId))
      const mejores = propios.filter((p) => p.esMejorIntento)
      const notasMejores = mejores.map((m) => Number(m.nota))
      const aprobados = notasMejores.filter((n) => n >= umbralAprobacion).length
      const notaMedia =
        notasMejores.length === 0
          ? null
          : Math.round((notasMejores.reduce((s, n) => s + n, 0) / notasMejores.length) * 100) / 100
      return {
        bloqueId: b.id,
        orden: b.orden,
        tipo: b.tipo,
        version: b.version,
        umbralAprobacion,
        modulo: { id: b.seccion.modulo.id, titulo: b.seccion.modulo.titulo },
        seccion: { id: b.seccion.id, titulo: b.seccion.titulo, orden: b.seccion.orden },
        skill: b.skillQueMide
          ? { id: b.skillQueMide.id, etiqueta: b.skillQueMide.etiquetaVisible }
          : null,
        stats: {
          colaboradoresConIntento: colaboradoresUnicos.size,
          totalIntentos: propios.length,
          aprobados,
          notaMedia,
        },
      }
    })
  }

  // =========================================================================
  // GET /cursos/:cursoId/bloques-evaluables/:bloqueId/colaboradores (admin)
  // =========================================================================

  /**
   * Detalle del drawer "ver por colaborador". Una fila por colaborador con
   * al menos un intento (no anulado) en el bloque, dentro del curso.
   * Para QUIZ, agrega también las preguntas más falladas.
   */
  async obtenerDetalleBloqueParaAdmin(input: {
    readonly cursoId: string
    readonly bloqueId: string
  }): Promise<BloqueEvaluableDetalleResponse> {
    const bloque = await this.prisma.bloque.findUnique({
      where: { id: input.bloqueId },
      select: { id: true, tipo: true, version: true, contenido: true, esEvaluable: true },
    })
    if (!bloque || !bloque.esEvaluable) {
      throw new NotFoundException({
        code: apiErrorCodes.bloqueNoEncontrado,
        message: "Bloque evaluable no encontrado.",
      })
    }
    const umbralAprobacion = umbralAprobacionBloque(bloque.tipo, bloque.contenido)

    const intentos = await this.prisma.intentoBloque.findMany({
      where: {
        cursoId: input.cursoId,
        bloqueId: input.bloqueId,
        estaInvalidado: false,
      },
      select: {
        colaboradorId: true,
        nota: true,
        fecha: true,
        esMejorIntento: true,
        versionBloque: true,
        preguntasFalladas: true,
        colaborador: { select: { id: true, nombre: true, email: true } },
      },
      orderBy: { fecha: "desc" },
    })

    const porColaborador = new Map<string, typeof intentos>()
    for (const it of intentos) {
      const arr = porColaborador.get(it.colaboradorId) ?? []
      arr.push(it)
      porColaborador.set(it.colaboradorId, arr)
    }

    const colaboradores: BloqueEvaluableColaboradorItem[] = []
    for (const [, lista] of porColaborador) {
      const mejor = lista.find((l) => l.esMejorIntento) ?? lista[0]
      if (!mejor) continue
      const mejorNota = Number(mejor.nota)
      const ultimo = lista[0]
      if (!ultimo) continue
      colaboradores.push({
        colaborador: {
          id: mejor.colaborador.id,
          nombre: mejor.colaborador.nombre,
          email: mejor.colaborador.email,
        },
        mejorNota,
        cantidadIntentos: lista.length,
        ultimoIntentoFecha: ultimo.fecha.toISOString(),
        aprobado: mejorNota >= umbralAprobacion,
        tieneVersionVieja: lista.some((l) => l.versionBloque < bloque.version),
      })
    }
    colaboradores.sort((a, b) => b.mejorNota - a.mejorNota)

    const preguntasMasFalladas =
      bloque.tipo === TipoBloque.QUIZ ? agregarPreguntasFalladas(intentos) : undefined

    return {
      bloque: {
        id: bloque.id,
        tipo: bloque.tipo,
        umbralAprobacion,
        versionActual: bloque.version,
      },
      colaboradores,
      ...(preguntasMasFalladas ? { preguntasMasFalladas } : {}),
    }
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
    /**
     * B-extra.2 punto 3: nota minima del bloque para calcular
     * `esPrimeraAprobacion`. Solo definida para QUIZ (el unico tipo que
     * declara `notaMinima` en su contenido); para CODIGO_PREGUNTAS es null
     * y el campo no se emite en la respuesta del POST.
     */
    readonly notaMinima: number | null
  }> {
    if (input.bloque.tipo === TipoBloque.QUIZ && input.respuestas.tipo === "QUIZ") {
      const contenido = parsearContenidoQuiz(input.bloque.contenido)
      const calculo = calcularNotaQuiz(contenido, input.respuestas.preguntas)
      return {
        calculo,
        respuestasPersistidas: { ...input.respuestas },
        notaMinima: contenido.notaMinima,
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
        notaMinima: null,
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

  /**
   * B-extra.2 punto 3: marca `true` cuando el nuevo intento aprueba y el
   * mejor previo no aprobaba (o no existia). `undefined` para bloques sin
   * `notaMinima` declarado en el contenido (CODIGO_PREGUNTAS) — el campo
   * se omite en la respuesta.
   */
  private calcularEsPrimeraAprobacion(input: {
    readonly notaMinima: number | null
    readonly notaActual: number
    readonly mejorPrevio: { readonly nota: Prisma.Decimal } | null
  }): boolean | undefined {
    if (input.notaMinima === null) {
      return undefined
    }
    const aprobadoAhora = input.notaActual >= input.notaMinima
    if (!aprobadoAhora) {
      return false
    }
    const aprobadoPrev =
      input.mejorPrevio !== null && Number(input.mejorPrevio.nota.toString()) >= input.notaMinima
    return !aprobadoPrev
  }

  private async recalcularMejorIntento(
    tx: PrismaTx,
    input: {
      readonly mejorActual: { readonly id: string; readonly nota: Prisma.Decimal } | null
      readonly nuevoIntentoId: string
      readonly nuevoIntentoNota: number
    },
  ): Promise<void> {
    const { mejorActual } = input
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

/**
 * Agrega `preguntasFalladas` de todos los intentos QUIZ pasados y devuelve la
 * lista ordenada desc por conteo. Tolera shapes inesperados: ignora valores
 * que no son string. Devuelve `undefined` si tras el filtro no queda nada
 * útil para no añadir ruido a la respuesta.
 */
function agregarPreguntasFalladas(
  intentos: readonly { readonly preguntasFalladas: Prisma.JsonValue | null }[],
): readonly { readonly preguntaId: string; readonly conteo: number }[] | undefined {
  const conteo = new Map<string, number>()
  for (const it of intentos) {
    const raw = it.preguntasFalladas
    if (!Array.isArray(raw)) continue
    for (const v of raw) {
      if (typeof v !== "string") continue
      conteo.set(v, (conteo.get(v) ?? 0) + 1)
    }
  }
  if (conteo.size === 0) return undefined
  return [...conteo.entries()]
    .map(([preguntaId, c]) => ({ preguntaId, conteo: c }))
    .sort((a, b) => b.conteo - a.conteo)
}
