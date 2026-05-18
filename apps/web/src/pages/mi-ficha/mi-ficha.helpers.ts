import type {
  FichaPorAreaItem,
  FichaSkillItem,
  NivelCualitativoArea,
} from "@nexott-learn/shared-types"

const UMBRAL_SOLIDO = 70
const UMBRAL_EXCELENCIA = 85
const UMBRAL_EN_DESARROLLO = 50

export interface UltimaSkill {
  readonly nombre: string
  readonly fecha: string
}

export function areasConActividad(porArea: readonly FichaPorAreaItem[]): number {
  return porArea.reduce((acc, a) => (a.skillsConNota > 0 ? acc + 1 : acc), 0)
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

export function ultimaSkill(skills: readonly FichaSkillItem[]): UltimaSkill | null {
  const conFecha = skills.filter(
    (s): s is FichaSkillItem & { fechaUltimoCambio: string } =>
      typeof s.fechaUltimoCambio === "string" && s.fechaUltimoCambio.length > 0,
  )
  const reciente = [...conFecha].sort((a, b) =>
    b.fechaUltimoCambio.localeCompare(a.fechaUltimoCambio),
  )[0]
  if (!reciente) {
    return null
  }
  return { nombre: reciente.etiquetaVisible, fecha: reciente.fechaUltimoCambio }
}

// El backend ya emite `nivelCualitativo` por area: derivamos directamente
// desde la fuente de verdad en vez de inferir desde el promedio.
export function hayAreaSolida(porArea: readonly FichaPorAreaItem[]): boolean {
  return porArea.some((a) => esNivelSolidoOExcelencia(a.nivelCualitativo))
}

export function cuentaAreasSolidasOExcelentes(porArea: readonly FichaPorAreaItem[]): number {
  return porArea.reduce(
    (acc, a) => (esNivelSolidoOExcelencia(a.nivelCualitativo) ? acc + 1 : acc),
    0,
  )
}

function esNivelSolidoOExcelencia(nivel: NivelCualitativoArea): boolean {
  return nivel === "solido" || nivel === "excelencia"
}

// Devuelve solo el sufijo (sin el nombre del usuario) para que el componente
// pueda renderizar el nombre con tipografia distinta (serif italic).
export function sufijoNarrativo(args: {
  readonly areasConActividad: number
  readonly areasSolidasOExcelentes: number
  readonly hayAreaSolida: boolean
}): string {
  const { areasConActividad: areas, areasSolidasOExcelentes, hayAreaSolida: solida } = args

  if (areas === 0) {
    return ", tu camino comienza aqui."
  }
  if (areas <= 2) {
    return ", estas dando los primeros pasos."
  }
  if (areasSolidasOExcelentes >= 5) {
    return ", tu camino tiene cuerpo."
  }
  if (solida) {
    return ", tu camino se esta consolidando."
  }
  return ", estas construyendo tu camino."
}

// Nivel cualitativo derivado de una nota individual (skill). Mismas franjas
// que la heuristica temporal de areas, pero a nivel skill: 85+ excelencia,
// 70+ solido, 50+ enDesarrollo, otra inicial, null sinTocar.
export function nivelDeNotaSkill(nota: number | null): NivelCualitativoArea {
  if (nota === null) {
    return "sinTocar"
  }
  if (nota >= UMBRAL_EXCELENCIA) {
    return "excelencia"
  }
  if (nota >= UMBRAL_SOLIDO) {
    return "solido"
  }
  if (nota >= UMBRAL_EN_DESARROLLO) {
    return "enDesarrollo"
  }
  return "inicial"
}

const ETIQUETA_NIVEL_SKILL: Record<NivelCualitativoArea, string> = {
  excelencia: "Excelencia",
  solido: "Solido",
  enDesarrollo: "En desarrollo",
  inicial: "Inicial",
  sinTocar: "Sin demostrar",
}

export function etiquetaNivelSkill(nivel: NivelCualitativoArea): string {
  return ETIQUETA_NIVEL_SKILL[nivel]
}

const ETIQUETA_NIVEL_AREA: Record<NivelCualitativoArea, string> = {
  excelencia: "Excelencia",
  solido: "Solido",
  enDesarrollo: "En desarrollo",
  inicial: "Inicial",
  sinTocar: "Por explorar",
}

export function etiquetaNivelArea(nivel: NivelCualitativoArea): string {
  return ETIQUETA_NIVEL_AREA[nivel]
}

// Origen narrativo de una skill — "Demostrada en el curso X" en vez de un tag
// crudo del enum. Combinado con la fecha relativa por el componente.
export function origenNarrativo(origen: Record<string, unknown> | null): string {
  if (!origen) {
    return "Sin evidencia registrada"
  }
  const tipo = typeof origen.tipo === "string" ? origen.tipo : null
  const cursoTitulo = typeof origen.cursoTitulo === "string" ? origen.cursoTitulo : null
  const proyectoTitulo = typeof origen.proyectoTitulo === "string" ? origen.proyectoTitulo : null
  switch (tipo) {
    case "ENTREVISTA_INICIAL":
      return "Demostrada en la entrevista inicial"
    case "BLOQUE":
      return cursoTitulo ? `Demostrada en el curso "${cursoTitulo}"` : "Demostrada en un bloque"
    case "TRANSVERSAL":
      return proyectoTitulo
        ? `Demostrada en el proyecto "${proyectoTitulo}"`
        : "Demostrada en un proyecto transversal"
    case "ENTREVISTA_IA":
      return "Demostrada en una entrevista IA"
    case "MANUAL":
      return "Ajuste manual del equipo"
    default:
      return "Demostrada"
  }
}

const DIA_MS = 24 * 60 * 60 * 1000
const SEMANA_MS = 7 * DIA_MS
const MES_MS = 30 * DIA_MS
const ANIO_MS = 365 * DIA_MS

export function relativizarFecha(iso: string): string {
  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) {
    return ""
  }
  const diff = Date.now() - fecha.getTime()
  if (diff < DIA_MS) {
    return "hoy"
  }
  if (diff < 2 * DIA_MS) {
    return "hace 1 dia"
  }
  if (diff < SEMANA_MS) {
    return `hace ${Math.floor(diff / DIA_MS)} dias`
  }
  if (diff < 2 * SEMANA_MS) {
    return "hace 1 semana"
  }
  if (diff < MES_MS) {
    return `hace ${Math.floor(diff / SEMANA_MS)} semanas`
  }
  if (diff < 2 * MES_MS) {
    return "hace 1 mes"
  }
  if (diff < ANIO_MS) {
    return `hace ${Math.floor(diff / MES_MS)} meses`
  }
  const anios = Math.floor(diff / ANIO_MS)
  return anios === 1 ? "hace 1 anio" : `hace ${anios} anios`
}
