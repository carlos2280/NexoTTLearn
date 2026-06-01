import matter from "gray-matter"
import MarkdownIt from "markdown-it"
import { parse as parseYaml } from "yaml"

import { type ImportarCursoInput, importarCursoSchema } from "@nexott-learn/shared-types"

const md = new MarkdownIt({ html: false, linkify: true, breaks: false })

// Regex top-level (perf): se compilan una sola vez al cargar el módulo.
const RX_NEWLINE = /\r?\n/u
const RX_FENCE_OPEN = /^:::\s*([a-z_]+)\s*(.*)$/u
const RX_HEADER_SECCION = /^##\s+(.+)$/u
const RX_HEADER_MODULO = /^#\s+(.+)$/u
const RX_BLOCKQUOTE = /^>\s*(.+)$/u
const RX_PREFIJO_MODULO = /^M[oó]dulo\s+\d+\s*:\s*/iu
const RX_PREFIJO_SECCION = /^Secci[oó]n\s+[\d.]+\s*:\s*/iu
const RX_PARAM_FENCE = /([a-zA-Z_][\w]*)=("([^"]*)"|'([^']*)'|(\S+))/gu
const RX_TAGS_HTML = /<[^>]+>/gu
const RX_WHITESPACE = /\s+/gu
const RX_WORD_SPLIT = /\s+/u

/**
 * Error semántico del parser: incluye contexto humano (módulo, sección,
 * bloque) para que el admin pueda corregir su `.md` sin mirar la traza.
 */
export class ParserCursoMdError extends Error {
  constructor(
    message: string,
    readonly contexto?: string,
  ) {
    super(contexto ? `${contexto}: ${message}` : message)
    // biome-ignore lint/nursery/noSecrets: nombre de la clase de error, no es secreto.
    this.name = "ParserCursoMdError"
  }
}

const TIPOS_FENCE = new Set([
  "parrafo",
  "tip",
  "quiz",
  "codigo",
  "codigo_ilustrativo",
  "recurso",
  "video",
  "diagrama",
])

interface FenceCrudo {
  readonly tipo: string
  readonly params: Readonly<Record<string, string>>
  readonly body: string
}

interface SeccionCruda {
  readonly titulo: string
  readonly fences: readonly FenceCrudo[]
}

interface ModuloCrudo {
  readonly titulo: string
  readonly descripcion: string
  readonly secciones: readonly SeccionCruda[]
}

/**
 * Estado mutable que la máquina de estados va llenando línea a línea. Se
 * extrae para que `dividirEnModulos` tenga complejidad baja y cada handler
 * pueda mutar lo que le toca.
 */
interface EstadoParseo {
  modulos: ModuloCrudo[]
  moduloActual: { titulo: string; descripcion: string; secciones: SeccionCruda[] } | null
  seccionActual: { titulo: string; fences: FenceCrudo[] } | null
  dentroDeFence: boolean
  fenceTipo: string
  fenceParams: Record<string, string>
  fenceBody: string[]
}

/**
 * Entry point del parser. Devuelve la estructura tipada lista para que el
 * service la persista, o lanza `ParserCursoMdError` con contexto si el `.md`
 * tiene problemas estructurales o de contenido.
 */
export function parsearCursoMd(texto: string): ImportarCursoInput {
  const { data, content } = matter(texto)
  const cursoMeta = data.curso
  const modulosCrudos = dividirEnModulos(content)
  if (modulosCrudos.length === 0) {
    throw new ParserCursoMdError("El documento no contiene módulos (# Módulo ...).")
  }

  const modulos = modulosCrudos.map((mod, idx) => construirModulo(mod, idx + 1))

  const parsed = importarCursoSchema.safeParse({ curso: cursoMeta, modulos })
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `${i.path.join(".") || "(raíz)"}: ${i.message}`)
      .join("\n  • ")
    throw new ParserCursoMdError(`Validación final fallida:\n  • ${issues}`)
  }
  return parsed.data
}

// ============================================================================
// División del documento en módulos / secciones / fences (máquina de estados)
// ============================================================================

function dividirEnModulos(body: string): ModuloCrudo[] {
  const estado: EstadoParseo = {
    modulos: [],
    moduloActual: null,
    seccionActual: null,
    dentroDeFence: false,
    fenceTipo: "",
    fenceParams: {},
    fenceBody: [],
  }

  for (const linea of body.split(RX_NEWLINE)) {
    procesarLinea(estado, linea)
  }

  if (estado.dentroDeFence) {
    throw new ParserCursoMdError("Fence ::: abierto sin cerrar al final del documento.")
  }
  cerrarModulo(estado)
  return estado.modulos
}

function procesarLinea(estado: EstadoParseo, linea: string): void {
  if (estado.dentroDeFence) {
    procesarLineaDentroDeFence(estado, linea)
    return
  }
  const apertura = linea.match(RX_FENCE_OPEN)
  if (apertura) {
    abrirFence(estado, apertura[1] ?? "", apertura[2] ?? "")
    return
  }
  const headerSeccion = linea.match(RX_HEADER_SECCION)
  if (headerSeccion) {
    abrirSeccion(estado, headerSeccion[1] ?? "")
    return
  }
  const headerModulo = linea.match(RX_HEADER_MODULO)
  if (headerModulo) {
    abrirModulo(estado, headerModulo[1] ?? "")
    return
  }
  procesarDescripcionModulo(estado, linea)
}

function procesarLineaDentroDeFence(estado: EstadoParseo, linea: string): void {
  if (linea.trim() !== ":::") {
    estado.fenceBody.push(linea)
    return
  }
  if (!estado.seccionActual) {
    throw new ParserCursoMdError(
      "Encontrado fence ::: fuera de una sección. Cada bloque debe vivir bajo un `## Sección`.",
    )
  }
  estado.seccionActual.fences.push({
    tipo: estado.fenceTipo,
    params: estado.fenceParams,
    body: estado.fenceBody.join("\n"),
  })
  estado.dentroDeFence = false
  estado.fenceTipo = ""
  estado.fenceParams = {}
  estado.fenceBody = []
}

function abrirFence(estado: EstadoParseo, tipo: string, paramsRaw: string): void {
  if (!TIPOS_FENCE.has(tipo)) {
    throw new ParserCursoMdError(
      `Tipo de bloque desconocido en \`::: ${tipo}\`. Tipos válidos: ${[...TIPOS_FENCE].join(", ")}.`,
    )
  }
  estado.dentroDeFence = true
  estado.fenceTipo = tipo
  estado.fenceParams = parsearParamsFence(paramsRaw)
  estado.fenceBody = []
}

function abrirSeccion(estado: EstadoParseo, tituloRaw: string): void {
  if (!estado.moduloActual) {
    throw new ParserCursoMdError(
      `Sección "${tituloRaw}" encontrada fuera de un módulo. Debe haber un \`# Módulo\` antes.`,
    )
  }
  cerrarSeccion(estado)
  estado.seccionActual = { titulo: limpiarTituloSeccion(tituloRaw), fences: [] }
}

function abrirModulo(estado: EstadoParseo, tituloRaw: string): void {
  cerrarModulo(estado)
  estado.moduloActual = {
    titulo: limpiarTituloModulo(tituloRaw),
    descripcion: "",
    secciones: [],
  }
}

function procesarDescripcionModulo(estado: EstadoParseo, linea: string): void {
  if (!estado.moduloActual || estado.seccionActual) {
    return
  }
  const bq = linea.match(RX_BLOCKQUOTE)
  if (!bq) {
    return
  }
  const texto = (bq[1] ?? "").trim()
  const prefijo = estado.moduloActual.descripcion ? " " : ""
  estado.moduloActual.descripcion = `${estado.moduloActual.descripcion}${prefijo}${texto}`
}

function cerrarSeccion(estado: EstadoParseo): void {
  if (estado.moduloActual && estado.seccionActual) {
    estado.moduloActual.secciones.push({
      titulo: estado.seccionActual.titulo,
      fences: estado.seccionActual.fences,
    })
  }
  estado.seccionActual = null
}

function cerrarModulo(estado: EstadoParseo): void {
  cerrarSeccion(estado)
  if (estado.moduloActual) {
    estado.modulos.push({
      titulo: estado.moduloActual.titulo,
      descripcion: estado.moduloActual.descripcion,
      secciones: estado.moduloActual.secciones,
    })
  }
  estado.moduloActual = null
}

function parsearParamsFence(raw: string): Record<string, string> {
  const out: Record<string, string> = {}
  let match: RegExpExecArray | null = RX_PARAM_FENCE.exec(raw)
  while (match !== null) {
    const key = match[1]
    if (key) {
      out[key] = match[3] ?? match[4] ?? match[5] ?? ""
    }
    match = RX_PARAM_FENCE.exec(raw)
  }
  // Resetear lastIndex porque RX_PARAM_FENCE es /g y conserva estado entre llamadas.
  RX_PARAM_FENCE.lastIndex = 0
  return out
}

function limpiarTituloModulo(raw: string): string {
  return raw.replace(RX_PREFIJO_MODULO, "").trim()
}

function limpiarTituloSeccion(raw: string): string {
  return raw.replace(RX_PREFIJO_SECCION, "").trim()
}

// ============================================================================
// Construcción de módulo / sección / bloque
// ============================================================================

function construirModulo(modulo: ModuloCrudo, idxHumano: number): unknown {
  const ctx = `Módulo ${idxHumano} "${modulo.titulo}"`
  if (modulo.secciones.length === 0) {
    throw new ParserCursoMdError("Módulo sin secciones (## Sección ...).", ctx)
  }
  return {
    titulo: modulo.titulo,
    descripcion: modulo.descripcion,
    secciones: modulo.secciones.map((s, idx) => construirSeccion(s, idxHumano, idx + 1, ctx)),
  }
}

function construirSeccion(
  seccion: SeccionCruda,
  idxModulo: number,
  idxHumano: number,
  ctxPadre: string,
): unknown {
  const ctx = `${ctxPadre} → Sección ${idxModulo}.${idxHumano} "${seccion.titulo}"`
  if (seccion.fences.length === 0) {
    throw new ParserCursoMdError("Sección sin bloques (::: tipo ... :::).", ctx)
  }
  return {
    titulo: seccion.titulo,
    bloques: seccion.fences.map((f, idx) => construirBloque(f, idx + 1, ctx)),
  }
}

function construirBloque(fence: FenceCrudo, idxHumano: number, ctxPadre: string): unknown {
  const ctx = `${ctxPadre} → Bloque #${idxHumano} (${fence.tipo})`
  try {
    return delegarBuilder(fence)
  } catch (err) {
    if (err instanceof ParserCursoMdError) {
      throw err
    }
    const msg = err instanceof Error ? err.message : String(err)
    throw new ParserCursoMdError(msg, ctx)
  }
}

function delegarBuilder(fence: FenceCrudo): unknown {
  switch (fence.tipo) {
    case "parrafo":
      return construirParrafo(fence.body)
    case "tip":
      return construirTip(fence.params, fence.body)
    case "quiz":
      return construirQuiz(fence.params, fence.body)
    case "codigo":
      return construirCodigo(fence.body)
    case "codigo_ilustrativo":
      return construirCodigoIlustrativo(fence.body)
    case "recurso":
      return construirRecurso(fence.body)
    case "video":
      return construirVideo(fence.body)
    case "diagrama":
      return construirDiagrama(fence.body)
    default:
      throw new ParserCursoMdError(`Tipo de bloque no implementado: ${fence.tipo}.`)
  }
}

// ============================================================================
// Builders por tipo de bloque (devuelven el shape JSONB esperado por Zod)
// ============================================================================

function mdAHtml(body: string): string {
  return md.render(body).trim()
}

function htmlAPlano(html: string): string {
  return html.replace(RX_TAGS_HTML, " ").replace(RX_WHITESPACE, " ").trim()
}

function contarPalabras(texto: string): number {
  return texto.split(RX_WORD_SPLIT).filter(Boolean).length
}

function construirParrafo(body: string): unknown {
  const html = mdAHtml(body)
  const textoPlano = htmlAPlano(html)
  const tiempoLecturaMin = Math.min(120, Math.max(0, Math.ceil(contarPalabras(textoPlano) / 200)))
  return { tipo: "PARRAFO", contenido: { html, textoPlano, tiempoLecturaMin } }
}

function construirTip(params: Record<string, string>, body: string): unknown {
  const variante = params.variante ?? "info"
  return { tipo: "TIP", contenido: { variante, html: mdAHtml(body) } }
}

function numParam(params: Record<string, string>, key: string, fallback: number): number {
  const raw = params[key]
  if (raw === undefined) {
    return fallback
  }
  const n = Number(raw)
  return Number.isFinite(n) ? n : fallback
}

function numParamNullable(params: Record<string, string>, key: string): number | null {
  const raw = params[key]
  if (raw === undefined) {
    return null
  }
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

function construirQuiz(params: Record<string, string>, body: string): unknown {
  const { preguntasRaw, solucionVisible } = extraerPreguntasYConfig(body)
  const preguntas = preguntasRaw.map((p, idx) => normalizarPregunta(p, idx))
  return {
    tipo: "QUIZ",
    contenido: {
      intentosMax: numParamNullable(params, "intentosMax"),
      solucionVisible,
      ordenAleatorio: false,
      notaMinima: numParam(params, "notaMinima", 60),
      preguntas,
    },
  }
}

function extraerPreguntasYConfig(body: string): {
  preguntasRaw: unknown[]
  solucionVisible: string
} {
  const yamlData = parsearYaml(body, "quiz")
  if (Array.isArray(yamlData)) {
    return { preguntasRaw: yamlData, solucionVisible: "al_aprobar" }
  }
  if (yamlData && typeof yamlData === "object") {
    const obj = yamlData as Record<string, unknown>
    const preguntas = obj.preguntas
    if (!Array.isArray(preguntas)) {
      throw new ParserCursoMdError(
        "Bloque quiz: el YAML debe ser un array de preguntas o un objeto con `preguntas`.",
      )
    }
    const solucionVisible =
      typeof obj.solucionVisible === "string" ? obj.solucionVisible : "al_aprobar"
    return { preguntasRaw: preguntas, solucionVisible }
  }
  throw new ParserCursoMdError("Bloque quiz: el YAML está vacío o no es válido.")
}

function normalizarPregunta(raw: unknown, idx: number): Record<string, unknown> {
  if (!raw || typeof raw !== "object") {
    throw new ParserCursoMdError(`Pregunta #${idx + 1} inválida: no es un objeto.`)
  }
  const p = raw as Record<string, unknown>
  const tipo = String(p.tipo ?? "OPCION_UNICA")
  const base = construirBasePregunta(p, tipo, idx)
  return aplicarCuerpoPregunta(base, p, tipo)
}

function construirBasePregunta(
  p: Record<string, unknown>,
  tipo: string,
  idx: number,
): Record<string, unknown> {
  const base: Record<string, unknown> = {
    id: String(p.id ?? `q${idx + 1}`),
    enunciado: String(p.enunciado ?? ""),
    pesoPunto: typeof p.pesoPunto === "number" ? p.pesoPunto : 1,
    tipo,
  }
  if (typeof p.explicacion === "string") {
    base.explicacion = p.explicacion
  }
  return base
}

function aplicarCuerpoPregunta(
  base: Record<string, unknown>,
  p: Record<string, unknown>,
  tipo: string,
): Record<string, unknown> {
  if (tipo === "OPCION_UNICA" || tipo === "OPCION_MULTIPLE") {
    const opciones = Array.isArray(p.opciones)
      ? p.opciones.map((o, oi) => normalizarOpcion(o, oi))
      : []
    base.opciones = opciones
    if (tipo === "OPCION_MULTIPLE") {
      base.puntuacionParcial = Boolean(p.puntuacionParcial ?? false)
    }
    return base
  }
  if (tipo === "VERDADERO_FALSO") {
    base.correcta = Boolean(p.correcta)
    return base
  }
  if (tipo === "RESPUESTA_CORTA") {
    base.respuestasAceptadas = Array.isArray(p.respuestasAceptadas)
      ? (p.respuestasAceptadas as unknown[]).map(String)
      : []
    return base
  }
  throw new ParserCursoMdError(`Tipo de pregunta inválido: "${tipo}".`)
}

function normalizarOpcion(raw: unknown, idx: number): Record<string, unknown> {
  if (!raw || typeof raw !== "object") {
    throw new ParserCursoMdError(`Opción #${idx + 1} inválida: no es un objeto.`)
  }
  const o = raw as Record<string, unknown>
  return {
    id: String(o.id ?? `o${idx + 1}`),
    texto: String(o.texto ?? ""),
    esCorrecta: Boolean(o.correcta ?? o.esCorrecta ?? false),
  }
}

function construirCodigo(body: string): unknown {
  const datos = parsearYamlObjeto(body, "codigo")
  const tests = datos.tests
  if (!Array.isArray(tests)) {
    throw new ParserCursoMdError("Bloque codigo: `tests` debe ser un array.")
  }
  return {
    tipo: "CODIGO",
    contenidoReto: {
      lenguaje: String(datos.lenguaje ?? ""),
      enunciado: String(datos.enunciado ?? ""),
      esqueletoInicial: String(datos.esqueleto ?? datos.esqueletoInicial ?? ""),
      tiempoLimiteSeg: typeof datos.tiempoLimiteSeg === "number" ? datos.tiempoLimiteSeg : 30,
    },
    solucionReferencia: String(datos.solucion ?? datos.solucionReferencia ?? ""),
    tests: tests.map((t, idx) => normalizarTest(t, idx)),
  }
}

function normalizarTest(raw: unknown, idx: number): Record<string, unknown> {
  if (!raw || typeof raw !== "object") {
    throw new ParserCursoMdError(`Test #${idx + 1} inválido: no es un objeto.`)
  }
  const t = raw as Record<string, unknown>
  return {
    id: String(t.id ?? `t${idx + 1}`),
    descripcion: String(t.descripcion ?? ""),
    entrada: String(t.entrada ?? ""),
    salidaEsperada: String(t.esperada ?? t.salidaEsperada ?? ""),
    visible: t.visible === undefined ? true : Boolean(t.visible),
  }
}

function construirCodigoIlustrativo(body: string): unknown {
  const datos = parsearYamlObjeto(body, "codigo_ilustrativo")
  return {
    tipo: "CODIGO_ILUSTRATIVO",
    contenido: {
      lenguaje: String(datos.lenguaje ?? ""),
      codigo: String(datos.codigo ?? ""),
      descripcion: String(datos.descripcion ?? ""),
    },
  }
}

function construirRecurso(body: string): unknown {
  const datos = parsearYamlObjeto(body, "recurso")
  const subtipo = String(datos.subtipo ?? "enlace")
  return {
    tipo: "RECURSO",
    contenido: {
      subtipo,
      url: String(datos.url ?? ""),
      titulo: String(datos.titulo ?? ""),
      descripcion: String(datos.descripcion ?? ""),
      abrirNuevaPestana:
        datos.abrirNuevaPestana === undefined
          ? subtipo === "enlace"
          : Boolean(datos.abrirNuevaPestana),
    },
  }
}

function construirVideo(body: string): unknown {
  const datos = parsearYamlObjeto(body, "video")
  return {
    tipo: "VIDEO",
    contenido: {
      url: String(datos.url ?? ""),
      proveedor: String(datos.proveedor ?? "otro"),
      marcarAlPorcentaje:
        typeof datos.marcarAlPorcentaje === "number" ? datos.marcarAlPorcentaje : 90,
      notas: String(datos.notas ?? ""),
    },
  }
}

function construirDiagrama(body: string): unknown {
  const datos = parsearYamlObjeto(body, "diagrama")
  const elementsRaw = datos.elements
  if (!Array.isArray(elementsRaw)) {
    throw new ParserCursoMdError("`elements` del diagrama debe ser un array.")
  }
  const out: Record<string, unknown> = {
    elements: elementsRaw,
    altText: String(datos.altText ?? ""),
  }
  if (datos.caption !== undefined) {
    out.caption = String(datos.caption)
  }
  return { tipo: "DIAGRAMA", contenido: out }
}

function parsearYaml(body: string, tipoCtx: string): unknown {
  try {
    return parseYaml(body)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    throw new ParserCursoMdError(`YAML inválido en bloque ${tipoCtx}: ${msg}`)
  }
}

function parsearYamlObjeto(body: string, tipoCtx: string): Record<string, unknown> {
  const parsed = parsearYaml(body, tipoCtx)
  if (parsed === null || parsed === undefined) {
    throw new ParserCursoMdError(`Bloque ${tipoCtx} vacío: falta contenido YAML.`)
  }
  if (typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new ParserCursoMdError(`Bloque ${tipoCtx}: el YAML debe ser un objeto.`)
  }
  return parsed as Record<string, unknown>
}
