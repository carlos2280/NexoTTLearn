import type {
  CrearIntentoEntrevistaIaResponse,
  EnviarTurnoResponse,
  IntentoEntrevistaIaParticipanteResponse,
  TurnoEntrevistaIa,
} from "@nexott-learn/shared-types"
import { ApiError } from "../api-error"
import { cargarSnapshot, guardarSnapshot } from "./mocks-storage"
import { type MockRequest, defineRoute } from "./router"

const RTE_CREAR = /^\/asignaciones\/([^/]+)\/intentos-entrevista-ia$/
const RTE_TURNO = /^\/intentos-entrevista-ia\/([^/]+)\/turnos$/
const RTE_DETALLE = /^\/intentos-entrevista-ia\/([^/]+)$/

const RGX_ASIG_ID = /^\/asignaciones\/([^/]+)\/intentos-entrevista-ia/
const RGX_INTENTO_ID = /^\/intentos-entrevista-ia\/([^/]+)/

const STORAGE_KEY = "entrevista-ia-intentos"
const CIERRE_OVERRIDE_KEY = "nexott-mock:entrevista-ia-resultado"
const HARD_CAP_TURNOS_PAR = 8 // 4 preguntas IA + 4 respuestas user — luego cierra

/**
 * Pool de preguntas plausibles por curso. Se eligen secuencialmente para que
 * el participante vea progresion (no repeticion aleatoria). La idea: simular
 * un evaluador real, NO un script obvio.
 *
 * Cuando llegue el backend real (B-19), este pool desaparece y el LLM del
 * proveedor configurado genera las preguntas con el system prompt del curso.
 */
const POOL_PREGUNTAS: ReadonlyMap<string, readonly string[]> = new Map([
  [
    "curso-java-senior",
    [
      "Cuentame sobre el patron Vertical Slice Architecture y cuando lo usarias en un proyecto Java.",
      "Bien. Tu argumento es solido. Ahora dime: ¿que ventajas concretas le ves frente a la arquitectura tradicional en capas?",
      "Interesante. Cuando hablamos de transacciones distribuidas, ¿prefieres saga o 2PC? Justifica.",
      "Vale. Ultima pregunta: ¿como manejas autenticacion y autorizacion en una API REST con Spring Boot?",
    ],
  ],
  [
    "curso-fullstack-devops",
    [
      "Para empezar, cuentame: ¿como decides cuando dockerizar un servicio y cuando dejarlo correr nativo?",
      "Bien. ¿Y como gestionas variables sensibles (credenciales, claves) en tus contenedores?",
      "Sobre el frontend: ¿prefieres SSR o SPA puro para una app interna? ¿Por que?",
      "Ultima: si tu app tarda 3 segundos en cargar, ¿cuales son los 3 primeros lugares donde buscarias el cuello de botella?",
    ],
  ],
  [
    "curso-react-frontend-mid",
    [
      "Cuentame: ¿como organizas el estado global en una app React mediana? ¿Cuando subirias estado al global y cuando lo dejarias local?",
      "Bien. Sobre Tanstack Query: ¿cual es la diferencia conceptual entre `staleTime` y `gcTime`?",
      "Interesante. ¿Cuando usarias `useMemo` y cuando seria un anti-patron?",
      "Ultima: si una page tarda en renderizar, ¿como atacas el problema?",
    ],
  ],
])

const POOL_DEFAULT: readonly string[] = [
  "Cuentame algo que hayas aprendido en este curso que te haya cambiado la forma de pensar.",
  "Interesante. ¿Como lo aplicarias en un proyecto real?",
  "Vale. ¿Que dificultad mayor te encontraste y como la resolviste?",
  "Ultima pregunta: si tuvieras que enseñar lo aprendido a alguien que empieza, ¿por donde le harias empezar?",
]

const PREGUNTA_GENERICA = "Cuentame mas sobre eso."
const CONECTOR_FALLBACK = "Bien."

const RESPUESTAS_CONECTORAS: readonly string[] = [
  "Entiendo tu enfoque.",
  "Vale, claro.",
  "Eso tiene sentido.",
  "Bien planteado.",
  "Interesante perspectiva.",
]

interface MockIntentoConContexto extends IntentoEntrevistaIaParticipanteResponse {
  readonly asignacionId: string
  readonly cursoId: string
  readonly indicePregunta: number // proxima pregunta a usar del pool
}

function cargarIntentos(): MockIntentoConContexto[] {
  return cargarSnapshot<MockIntentoConContexto>(STORAGE_KEY, [])
}

function guardarIntentos(data: readonly MockIntentoConContexto[]): void {
  guardarSnapshot(STORAGE_KEY, data)
}

function nuevoUuid(): string {
  const hex = Math.floor(Math.random() * 0xff_ff_ff_ff)
    .toString(16)
    .padStart(8, "0")
  return `00000000-0000-4000-c000-0001${hex}`
}

function poolDelCurso(cursoId: string | null): readonly string[] {
  if (!cursoId) {
    return POOL_DEFAULT
  }
  return POOL_PREGUNTAS.get(cursoId) ?? POOL_DEFAULT
}

function leerOverrideCierre(): "APROBADO" | "NO_APROBADO" | null {
  if (typeof window === "undefined") {
    return null
  }
  const raw = window.localStorage.getItem(CIERRE_OVERRIDE_KEY)
  if (raw === "APROBADO" || raw === "NO_APROBADO") {
    return raw
  }
  return null
}

function cursoIdDeAsignacion(asignacionId: string): string {
  // Mapeo inverso simple. En el codigo real, el handler de asignaciones lo
  // gestiona; aqui solo necesitamos un cursoId para elegir pool.
  if (asignacionId.includes("java")) {
    return "curso-java-senior"
  }
  if (asignacionId.includes("fullstack")) {
    return "curso-fullstack-devops"
  }
  if (asignacionId.includes("react")) {
    return "curso-react-frontend-mid"
  }
  return "curso-default"
}

function handlerCrearIntento(req: MockRequest): CrearIntentoEntrevistaIaResponse {
  const match = req.path.match(RGX_ASIG_ID)
  const asignacionId = match?.[1] ?? "asg-unknown"
  const cursoId = cursoIdDeAsignacion(asignacionId)
  const pool = poolDelCurso(cursoId)
  const primeraPregunta = pool[0] ?? PREGUNTA_GENERICA
  const intentoId = nuevoUuid()
  const ahora = new Date().toISOString()

  const intento: MockIntentoConContexto = {
    intentoId,
    estado: "EN_PROGRESO",
    fecha: ahora,
    transcripcion: [
      {
        rol: "ASISTENTE",
        mensaje: primeraPregunta,
        timestamp: ahora,
      },
    ],
    notaGlobal: null,
    aprobado: null,
    anulado: false,
    notasPorArea: [],
    asignacionId,
    cursoId,
    indicePregunta: 1, // proxima a usar
  }

  const lista = cargarIntentos()
  guardarIntentos([intento, ...lista])

  return {
    intentoId,
    primeraPregunta,
  }
}

interface BodyTurno {
  readonly mensaje?: string
}

function isBodyTurno(value: unknown): value is BodyTurno {
  return typeof value === "object" && value !== null && "mensaje" in value
}

function elegirRespuestaConectora(indice: number): string {
  return RESPUESTAS_CONECTORAS[indice % RESPUESTAS_CONECTORAS.length] ?? CONECTOR_FALLBACK
}

interface SiguienteTurnoCalc {
  readonly respuestaIa: string
  readonly siguientePregunta: string | null
  readonly nuevoIndice: number
}

function calcularSiguienteTurno(input: {
  readonly pool: readonly string[]
  readonly indiceActual: number
  readonly totalTurnosUser: number
}): SiguienteTurnoCalc {
  const { pool, indiceActual, totalTurnosUser } = input
  const debeFinalizar = totalTurnosUser >= HARD_CAP_TURNOS_PAR / 2
  if (debeFinalizar) {
    const conector = elegirRespuestaConectora(totalTurnosUser)
    return {
      respuestaIa: `${conector} Has cubierto bien los puntos clave del curso. Te dejo procesando tu desempeño.`,
      siguientePregunta: null,
      nuevoIndice: indiceActual,
    }
  }
  if (indiceActual < pool.length) {
    const conector = elegirRespuestaConectora(totalTurnosUser - 1)
    const pregunta = pool[indiceActual] ?? PREGUNTA_GENERICA
    return {
      respuestaIa: `${conector} ${pregunta}`,
      siguientePregunta: pregunta,
      nuevoIndice: indiceActual + 1,
    }
  }
  const conector = elegirRespuestaConectora(totalTurnosUser)
  return {
    respuestaIa: `${conector} Creo que hemos cubierto lo necesario. Te dejo procesando tu desempeño.`,
    siguientePregunta: null,
    nuevoIndice: indiceActual,
  }
}

function buscarIntentoEnLista(intentoId: string): {
  readonly idx: number
  readonly intento: MockIntentoConContexto
} {
  const lista = cargarIntentos()
  const idx = lista.findIndex((i) => i.intentoId === intentoId)
  const intento = idx === -1 ? null : (lista[idx] ?? null)
  if (idx === -1 || !intento) {
    throw new ApiError(404, "INTENTO_NO_ENCONTRADO", "No encuentro ese intento.")
  }
  if (intento.estado === "FINALIZADO") {
    throw new ApiError(409, "INTENTO_FINALIZADO", "Esta entrevista ya termino.")
  }
  return { idx, intento }
}

function handlerEnviarTurno(req: MockRequest): EnviarTurnoResponse {
  if (!(isBodyTurno(req.body) && req.body.mensaje)) {
    throw new ApiError(400, "BODY_INVALIDO", "Falta el mensaje del colaborador.")
  }
  const match = req.path.match(RGX_INTENTO_ID)
  const intentoId = match?.[1]
  if (!intentoId) {
    throw new ApiError(404, "INTENTO_NO_ENCONTRADO", "No encuentro ese intento.")
  }
  const { idx, intento } = buscarIntentoEnLista(intentoId)

  const ahora = new Date().toISOString()
  const turnoUser: TurnoEntrevistaIa = {
    rol: "COLABORADOR",
    mensaje: req.body.mensaje,
    timestamp: ahora,
  }

  const pool = poolDelCurso(intento.cursoId)
  const totalTurnosUser = intento.transcripcion.filter((t) => t.rol === "COLABORADOR").length + 1
  const { respuestaIa, siguientePregunta, nuevoIndice } = calcularSiguienteTurno({
    pool,
    indiceActual: intento.indicePregunta,
    totalTurnosUser,
  })

  const turnoAsistente: TurnoEntrevistaIa = {
    rol: "ASISTENTE",
    mensaje: respuestaIa,
    timestamp: new Date().toISOString(),
  }

  const finalizado = siguientePregunta === null
  const override = leerOverrideCierre()
  const aprobado = override ? override === "APROBADO" : true
  const intentoActualizado: MockIntentoConContexto = {
    ...intento,
    estado: finalizado ? "FINALIZADO" : "EN_PROGRESO",
    transcripcion: [...intento.transcripcion, turnoUser, turnoAsistente],
    notaGlobal: finalizado ? (aprobado ? 84 : 58) : null,
    aprobado: finalizado ? aprobado : null,
    indicePregunta: nuevoIndice,
  }
  const nuevaLista = [...cargarIntentos()]
  nuevaLista[idx] = intentoActualizado
  guardarIntentos(nuevaLista)

  return {
    respuestaIa,
    finalizado,
    siguientePregunta,
  }
}

function handlerDetalleIntento(req: MockRequest): IntentoEntrevistaIaParticipanteResponse {
  const match = req.path.match(RGX_INTENTO_ID)
  const intentoId = match?.[1] ?? null
  if (!intentoId) {
    throw new ApiError(404, "INTENTO_NO_ENCONTRADO", "No encuentro ese intento.")
  }
  const lista = cargarIntentos()
  const intento = lista.find((i) => i.intentoId === intentoId)
  if (!intento) {
    throw new ApiError(404, "INTENTO_NO_ENCONTRADO", "No encuentro ese intento.")
  }
  const { asignacionId: _a, cursoId: _c, indicePregunta: _i, ...publico } = intento
  return publico
}

export const handlersIntentosEntrevistaIa = [
  defineRoute("POST", RTE_CREAR, handlerCrearIntento),
  defineRoute("POST", RTE_TURNO, handlerEnviarTurno),
  defineRoute("GET", RTE_DETALLE, handlerDetalleIntento),
]
