import type {
  EventoHistorialFicha,
  FichaPorAreaItem,
  FichaResponse,
  NivelCualitativoArea,
} from "@nexott-learn/shared-types"
import PDFDocument from "pdfkit"

/**
 * Render del reporte PDF de la ficha del colaborador con identidad NexoTT
 * Learn (B-25 evolucionado). A diferencia de `fichaAPdf` (que produce un
 * volcado tabular crudo para portabilidad), este helper produce una "carta
 * de presentacion" de 1 pagina: wordmark + linea aurora + nombre + frase
 * narrativa + areas activas + hitos del camino + footer sobrio.
 *
 * Decisiones cerradas:
 *  - 1 pagina A4. Lo que no quepa, no entra (el detalle granular vive en el
 *    CSV y en /mi-ficha).
 *  - Tipografia Helvetica (built-in en pdfkit). Manrope variable font produjo
 *    glyphs faltantes (D, x, tildes) con fontkit, asi que la identidad vive
 *    en colores, linea aurora y composicion editorial — no en la fuente.
 *  - Tono profesional en tercera persona: el PDF se puede compartir con un
 *    manager o cliente.
 *  - Sin "cargo" del colaborador (no esta en el modelo). Subtexto del hero
 *    usa la fortaleza actual como contexto profesional.
 */

/**
 * Alias del tipo de instancia de pdfkit. `PDFDocument` se importa como valor
 * (CommonJS) y TS no lo expone como tipo directamente; el namespace global
 * `PDFKit.PDFDocument` tampoco es reconocido por Biome. `InstanceType` evita
 * ambos problemas y mantiene el helper portable.
 */
type PdfDoc = InstanceType<typeof PDFDocument>

const FONT_REGULAR = "Helvetica"
const FONT_BOLD = "Helvetica-Bold"

const COLOR_TEXT_PRIMARY = "#0c0a09"
const COLOR_TEXT_SECONDARY = "#57534e"
const COLOR_TEXT_TERTIARY = "#a8a29e"
const COLOR_BORDER = "#e7e5e4"
const COLOR_BORDER_STRONG = "#d6d3d1"
const COLOR_AURORA_CYAN = "#22d3ee"
const COLOR_AURORA_VIOLET = "#8b5cf6"
const COLOR_AURORA_MAGENTA = "#ec4899"

const AREA_COLORS: Record<string, string> = {
  frontend: "#22d3ee",
  backend: "#f97316",
  cloud: "#0ea5e9",
  data: "#8b5cf6",
  mobile: "#10b981",
  devops: "#ef4444",
  qa: "#84cc16",
  soft: "#ec4899",
}

const ETIQUETA_NIVEL: Record<NivelCualitativoArea, string> = {
  excelencia: "Excelencia",
  solido: "Solido",
  enDesarrollo: "En desarrollo",
  inicial: "Inicial",
  sinTocar: "Por explorar",
}

const DOTS_LLENOS: Record<NivelCualitativoArea, number> = {
  excelencia: 5,
  solido: 4,
  enDesarrollo: 3,
  inicial: 2,
  sinTocar: 0,
}

const FMT_FECHA_LARGA = new Intl.DateTimeFormat("es", {
  day: "numeric",
  month: "long",
  year: "numeric",
})

const FMT_MES = new Intl.DateTimeFormat("es", { month: "long" })

export interface ReporteFichaInput {
  readonly ficha: FichaResponse
  readonly identidad: { readonly nombre: string }
  readonly hitos: readonly EventoHistorialFicha[]
  readonly fechaGeneracion?: Date
}

export function fichaAPdfReporte(input: ReporteFichaInput): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 48, bottom: 48, left: 60, right: 60 },
        info: {
          // biome-ignore lint/style/useNamingConvention: clave PDF 1.7 literal.
          Title: `Ficha NexoTT — ${input.identidad.nombre}`,
          // biome-ignore lint/style/useNamingConvention: clave PDF 1.7 literal.
          Author: "NexoTT Learn",
          // biome-ignore lint/style/useNamingConvention: clave PDF 1.7 literal.
          Producer: "NexoTT Learn",
        },
      })
      const chunks: Buffer[] = []
      doc.on("data", (chunk: Buffer) => chunks.push(chunk))
      doc.on("error", (err: Error) => reject(err))
      doc.on("end", () => resolve(Buffer.concat(chunks)))

      const fecha = input.fechaGeneracion ?? new Date()

      renderHeader(doc, fecha)
      renderHero(doc, input.identidad.nombre, input.ficha)
      renderDondeEstaHoy(doc, input.ficha.porArea)
      renderHitos(doc, input.hitos)
      renderFooter(doc, fecha)

      doc.end()
    } catch (err) {
      reject(err instanceof Error ? err : new Error(String(err)))
    }
  })
}

/**
 * Header: marca con cuadrado aurora + wordmark "NexoTT · Learn" a la
 * izquierda, fecha a la derecha. Wordmark y fecha alineados a la BASE del
 * cuadrado del logo. Linea aurora horizontal debajo (firma de marca).
 */
function renderHeader(doc: PdfDoc, fecha: Date): void {
  const yInicio = doc.y
  const xBase = doc.page.margins.left
  const anchoUtil = doc.page.width - doc.page.margins.left - doc.page.margins.right
  const fechaTexto = capitalizar(FMT_FECHA_LARGA.format(fecha))

  const tamLogo = 18
  const yBaseLogo = yInicio + tamLogo

  // Cuadrado aurora con la "N" del logo NexoTT.
  doc.fillColor(COLOR_AURORA_VIOLET).rect(xBase, yInicio, tamLogo, tamLogo).fill()
  doc
    .fillColor("#ffffff")
    .font(FONT_BOLD)
    .fontSize(12)
    .text("N", xBase + 4.5, yInicio + 3, {
      lineBreak: false,
    })

  // Wordmark: alineado con la base del cuadrado (yBaseLogo - ascent del texto).
  // Helvetica-Bold 13 tiene ascent ~9.5pt; restamos para que la base coincida.
  const fontSizeWordmark = 13
  const yWordmark = yBaseLogo - fontSizeWordmark * 0.95
  doc
    .font(FONT_BOLD)
    .fontSize(fontSizeWordmark)
    .fillColor(COLOR_TEXT_PRIMARY)
    .text("NexoTT", xBase + tamLogo + 8, yWordmark, { lineBreak: false, continued: true })
    .fillColor(COLOR_AURORA_VIOLET)
    .text(" · ", { continued: true })
    .fillColor(COLOR_TEXT_PRIMARY)
    .text("Learn", { lineBreak: false })

  // Fecha: misma estrategia, base alineada con la base del cuadrado.
  const fontSizeFecha = 10
  const yFecha = yBaseLogo - fontSizeFecha * 0.95
  doc
    .font(FONT_REGULAR)
    .fontSize(fontSizeFecha)
    .fillColor(COLOR_TEXT_TERTIARY)
    .text(fechaTexto, xBase, yFecha, {
      width: anchoUtil,
      align: "right",
      lineBreak: false,
    })

  // Linea aurora horizontal: 3 segmentos para simular el gradiente
  // cyan -> violet -> magenta sin recurrir a gradientes complejos.
  const yLinea = yBaseLogo + 8
  const segmento = anchoUtil / 3
  doc.lineWidth(1)
  doc
    .moveTo(xBase, yLinea)
    .lineTo(xBase + segmento, yLinea)
    .strokeColor(COLOR_AURORA_CYAN)
    .stroke()
  doc
    .moveTo(xBase + segmento, yLinea)
    .lineTo(xBase + 2 * segmento, yLinea)
    .strokeColor(COLOR_AURORA_VIOLET)
    .stroke()
  doc
    .moveTo(xBase + 2 * segmento, yLinea)
    .lineTo(xBase + anchoUtil, yLinea)
    .strokeColor(COLOR_AURORA_MAGENTA)
    .stroke()

  doc.x = xBase
  doc.y = yLinea + 40
}

/**
 * Hero: nombre grande del colaborador + fortaleza actual + frase narrativa.
 * Posiciones Y calculadas como variables para evitar el solapamiento que
 * produce `doc.y` automatico cuando se combina con `lineBreak: false`.
 */
function renderHero(doc: PdfDoc, nombre: string, ficha: FichaResponse): void {
  const fortaleza = fortalezaActual(ficha.porArea)
  const xBase = doc.page.margins.left
  const yNombre = doc.y

  doc
    .font(FONT_BOLD)
    .fontSize(28)
    .fillColor(COLOR_TEXT_PRIMARY)
    .text(nombre.toUpperCase(), xBase, yNombre, {
      characterSpacing: 0.5,
      lineBreak: false,
    })

  const yFortaleza = yNombre + 38
  if (fortaleza) {
    doc
      .font(FONT_REGULAR)
      .fontSize(11)
      .fillColor(COLOR_TEXT_SECONDARY)
      .text("Fortaleza actual ", xBase, yFortaleza, { lineBreak: false, continued: true })
      .fillColor(COLOR_AURORA_VIOLET)
      .text("· ", { continued: true })
      .fillColor(COLOR_TEXT_SECONDARY)
      .text(fortaleza, { lineBreak: false })
  } else {
    doc
      .font(FONT_REGULAR)
      .fontSize(11)
      .fillColor(COLOR_TEXT_TERTIARY)
      .text("Su camino comienza aqui.", xBase, yFortaleza, { lineBreak: false })
  }

  const yFrase = yFortaleza + 22
  const frase = construirFraseNarrativa(ficha.porArea)
  doc
    .font(FONT_REGULAR)
    .fontSize(13)
    .fillColor(COLOR_TEXT_SECONDARY)
    .text(frase, xBase, yFrase, { lineBreak: false })

  doc.x = xBase
  doc.y = yFrase + 32
}

/**
 * Bloque "Donde esta hoy" — una fila por area activa con dot del color,
 * nombre, 5 dots de progreso, etiqueta de nivel y conteo de habilidades.
 */
function renderDondeEstaHoy(doc: PdfDoc, porArea: readonly FichaPorAreaItem[]): void {
  const activas = porArea.filter((a) => a.nivelCualitativo !== "sinTocar")
  const porExplorar = porArea.filter((a) => a.nivelCualitativo === "sinTocar")
  const xBase = doc.page.margins.left
  const anchoUtil = doc.page.width - doc.page.margins.left - doc.page.margins.right

  renderEyebrow(doc, "Donde esta hoy")

  if (activas.length === 0) {
    doc
      .font(FONT_REGULAR)
      .fontSize(11)
      .fillColor(COLOR_TEXT_SECONDARY)
      .text(
        "Aun no tiene habilidades demostradas. Su camino comienza con el primer curso.",
        xBase,
        doc.y,
      )
    doc.moveDown(1.2)
    return
  }

  const colNombreX = xBase + 18
  const colDotsX = xBase + 200
  const colNivelX = xBase + 290
  const colHabX = xBase + anchoUtil - 80
  const alturaFila = 22

  for (const area of activas) {
    const y = doc.y
    const colorArea = colorParaArea(area.nombre)

    doc
      .fillColor(colorArea)
      .circle(xBase + 4, y + 6, 3)
      .fill()

    doc
      .font(FONT_BOLD)
      .fontSize(11)
      .fillColor(COLOR_TEXT_PRIMARY)
      .text(area.nombre, colNombreX, y, { lineBreak: false, width: 175 })

    const llenos = DOTS_LLENOS[area.nivelCualitativo]
    for (let i = 0; i < 5; i++) {
      const cx = colDotsX + i * 11
      const cy = y + 6
      if (i < llenos) {
        doc.fillColor(colorArea).circle(cx, cy, 2.5).fill()
      } else {
        doc.strokeColor(COLOR_BORDER_STRONG).lineWidth(0.8).circle(cx, cy, 2.5).stroke()
      }
    }

    doc
      .font(FONT_REGULAR)
      .fontSize(11)
      .fillColor(COLOR_TEXT_SECONDARY)
      .text(ETIQUETA_NIVEL[area.nivelCualitativo], colNivelX, y, { lineBreak: false })

    const conteo = `${area.skillsConNota} ${area.skillsConNota === 1 ? "hab." : "hab."}`
    doc
      .font(FONT_REGULAR)
      .fontSize(10)
      .fillColor(COLOR_TEXT_TERTIARY)
      .text(conteo, colHabX, y + 1, { width: 60, align: "right", lineBreak: false })

    doc
      .strokeColor(COLOR_BORDER)
      .lineWidth(0.5)
      .moveTo(xBase, y + alturaFila - 4)
      .lineTo(xBase + anchoUtil, y + alturaFila - 4)
      .stroke()

    doc.x = xBase
    doc.y = y + alturaFila
  }

  doc.moveDown(0.5)
  if (porExplorar.length > 0) {
    const nombres = porExplorar.map((a) => a.nombre).join(", ")
    doc
      .font(FONT_REGULAR)
      .fontSize(10)
      .fillColor(COLOR_TEXT_TERTIARY)
      .text("Otras areas aun esperan: ", xBase, doc.y, { continued: true })
      .fillColor(COLOR_TEXT_SECONDARY)
      .text(`${nombres}.`, { lineBreak: true })
  }

  doc.moveDown(1.4)
}

/**
 * Bloque "Hitos de su camino" — hasta 6 hitos mayores. Cada descripcion se
 * trunca a 1 linea con ellipsis para mantener layout consistente y evitar
 * solapamiento cuando los textos son largos.
 */
function renderHitos(doc: PdfDoc, hitos: readonly EventoHistorialFicha[]): void {
  if (hitos.length === 0) {
    return
  }
  const xBase = doc.page.margins.left
  const anchoUtil = doc.page.width - doc.page.margins.left - doc.page.margins.right

  renderEyebrow(doc, "Hitos de tu camino")

  const xFecha = xBase
  const anchoFecha = 100
  const xDescripcion = xBase + 110
  const anchoDescripcion = anchoUtil - 110
  const alturaFila = 22

  for (const evento of hitos.slice(0, 6)) {
    const y = doc.y
    const fechaLabel = formatearMesAnio(evento.fecha)
    const descripcion = descripcionHito(evento)

    doc
      .font(FONT_REGULAR)
      .fontSize(10)
      .fillColor(COLOR_TEXT_TERTIARY)
      .text(fechaLabel, xFecha, y + 1, { width: anchoFecha, lineBreak: false })

    // Truncado manual: `ellipsis: true` de pdfkit solo aplica con `height`
    // definido + `lineBreak: true`. Para garantizar 1 linea siempre, medimos
    // y cortamos con "..." si el texto desborda el ancho disponible.
    const descripcionUnaLinea = truncarParaAncho(doc, descripcion, anchoDescripcion, 11)
    doc
      .font(FONT_REGULAR)
      .fontSize(11)
      .fillColor(COLOR_TEXT_PRIMARY)
      .text(descripcionUnaLinea, xDescripcion, y, {
        width: anchoDescripcion,
        lineBreak: false,
      })

    doc.x = xBase
    doc.y = y + alturaFila
  }

  doc.moveDown(1.2)
}

function renderFooter(doc: PdfDoc, fecha: Date): void {
  const yFooter = doc.page.height - doc.page.margins.bottom - 18
  const fechaCorta = FMT_FECHA_LARGA.format(fecha)
  doc
    .font(FONT_REGULAR)
    .fontSize(9)
    .fillColor(COLOR_TEXT_TERTIARY)
    .text(
      `Generado por NexoTT Learn · Ficha vigente al ${fechaCorta}.`,
      doc.page.margins.left,
      yFooter,
      {
        width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
        align: "center",
        lineBreak: false,
      },
    )
}

/**
 * Eyebrow tipografico. Avanza `doc.y` con un gap explicito porque `lineBreak:
 * false` no mueve el cursor en pdfkit y, sin esto, la primera fila siguiente
 * queda montada sobre el eyebrow.
 */
function renderEyebrow(doc: PdfDoc, texto: string): void {
  const xBase = doc.page.margins.left
  const yInicio = doc.y
  doc
    .font(FONT_BOLD)
    .fontSize(9)
    .fillColor(COLOR_TEXT_TERTIARY)
    .text(texto.toUpperCase(), xBase, yInicio, {
      characterSpacing: 1.8,
      lineBreak: false,
    })
  doc.x = xBase
  doc.y = yInicio + 20
}

// Helpers de calculo (puros, testables) ---------------------------------------

function colorParaArea(nombre: string): string {
  const slug = nombre
    .normalize("NFD")
    .replace(/\p{Mn}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
  return AREA_COLORS[slug] ?? COLOR_AURORA_VIOLET
}

export function fortalezaActual(porArea: readonly FichaPorAreaItem[]): string | null {
  const conActividad = porArea.filter((a) => a.skillsConNota > 0 && a.promedio !== null)
  const mejor = [...conActividad].sort((a, b) => {
    const pa = a.promedio ?? 0
    const pb = b.promedio ?? 0
    if (pb !== pa) {
      return pb - pa
    }
    return b.skillsConNota - a.skillsConNota
  })[0]
  return mejor ? mejor.nombre : null
}

export function construirFraseNarrativa(porArea: readonly FichaPorAreaItem[]): string {
  const areas = porArea.filter((a) => a.skillsConNota > 0).length
  const solidasOExcelentes = porArea.filter(
    (a) => a.nivelCualitativo === "solido" || a.nivelCualitativo === "excelencia",
  ).length
  const haySolida = solidasOExcelentes > 0

  if (areas === 0) {
    return "Su camino comienza aqui."
  }
  if (areas <= 2) {
    return "Esta dando los primeros pasos."
  }
  if (solidasOExcelentes >= 5) {
    return "Su camino tiene cuerpo."
  }
  if (haySolida) {
    return "Tu camino se esta consolidando."
  }
  return "Esta construyendo su camino."
}

export function esHitoMayor(evento: EventoHistorialFicha): boolean {
  if (evento.tipo === "CURSO_COMPLETADO") {
    return true
  }
  if (evento.tipo === "SKILL_DEMOSTRADA") {
    if (evento.origen === "TRANSVERSAL" || evento.origen === "ENTREVISTA_IA") {
      return true
    }
    if (evento.nivelCualitativo === "excelencia") {
      return true
    }
  }
  return false
}

export function filtrarHitosMayores(
  eventos: readonly EventoHistorialFicha[],
): readonly EventoHistorialFicha[] {
  return eventos.filter(esHitoMayor)
}

/**
 * Descripcion compacta de un hito con patron `<Tipo> · <Sujeto>`. Mas legible
 * en formato tabular y deja mas ancho al sujeto, que es lo informativo.
 */
function descripcionHito(evento: EventoHistorialFicha): string {
  switch (evento.tipo) {
    case "CURSO_COMPLETADO":
      return `Curso completado · ${evento.cursoTitulo}`
    case "CURSO_INICIADO":
      return `Curso iniciado · ${evento.cursoTitulo}`
    case "SKILL_DEMOSTRADA": {
      if (evento.origen === "TRANSVERSAL") {
        return `Transversal · ${evento.skillNombre}`
      }
      if (evento.origen === "ENTREVISTA_IA") {
        return `Entrevista IA · ${evento.skillNombre}`
      }
      if (evento.nivelCualitativo === "excelencia") {
        return `Excelencia · ${evento.skillNombre}`
      }
      return `Skill · ${evento.skillNombre}`
    }
    default:
      return ""
  }
}

function formatearMesAnio(fechaIso: string): string {
  const fecha = new Date(fechaIso)
  if (Number.isNaN(fecha.getTime())) {
    return ""
  }
  // "Mayo 2026" en vez de "Mayo de 2026" — mas compacto y deja mas ancho a la
  // descripcion del hito.
  return `${capitalizar(FMT_MES.format(fecha))} ${fecha.getFullYear()}`
}

function capitalizar(texto: string): string {
  if (texto.length === 0) {
    return texto
  }
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

/**
 * Trunca `texto` con "..." hasta que entre en `ancho` (en pt) usando la fuente
 * regular al `fontSize` indicado. Busca con bisecciones para minimizar el
 * numero de mediciones (`widthOfString` es relativamente costoso).
 */
function truncarParaAncho(doc: PdfDoc, texto: string, ancho: number, fontSize: number): string {
  doc.font(FONT_REGULAR).fontSize(fontSize)
  if (doc.widthOfString(texto) <= ancho) {
    return texto
  }
  const sufijo = "..."
  let lo = 0
  let hi = texto.length
  while (lo < hi) {
    const mid = Math.floor((lo + hi + 1) / 2)
    const candidato = texto.slice(0, mid).trimEnd() + sufijo
    if (doc.widthOfString(candidato) <= ancho) {
      lo = mid
    } else {
      hi = mid - 1
    }
  }
  return texto.slice(0, lo).trimEnd() + sufijo
}
