import type { FichaPorAreaItem, FichaSkillItem } from "@nexott-learn/shared-types"

const UMBRAL_SOLIDO = 70

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

// Heuristica temporal: hasta que B-21 traiga `nivelCualitativo` por area,
// derivamos "tiene area solida" desde el promedio (>=70 = solido, >=85 = excel).
export function hayAreaSolida(porArea: readonly FichaPorAreaItem[]): boolean {
  return porArea.some((a) => (a.promedio ?? 0) >= UMBRAL_SOLIDO)
}

export function cuentaAreasSolidasOExcelentes(porArea: readonly FichaPorAreaItem[]): number {
  return porArea.reduce((acc, a) => ((a.promedio ?? 0) >= UMBRAL_SOLIDO ? acc + 1 : acc), 0)
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
