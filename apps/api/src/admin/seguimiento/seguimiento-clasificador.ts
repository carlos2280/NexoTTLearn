// Iter 10 · D-10.3 · clasificador puro Apto / EnRuta / EnRiesgo / Completado.
//
// Reglas (canonicas, no reabrir):
//   Completado : inscripcion.estado = COMPLETADA
//   Apto       : ACTIVA + todos modulos OBLIGATORIOS con notaModulo
//                >= umbralArea + (si curso tiene transversal:
//                notaTransversal >= umbralTransversal) +
//                (si curso tiene entrevista IA: aprobada)
//   En riesgo  : ACTIVA + (etiqueta = INSUFICIENTE OR cualquier area
//                OBLIGATORIA con notaArea = null)
//   En ruta    : ACTIVA + no Apto + no En riesgo
//
// Funcion 100% pura: recibe el modelo necesario, devuelve el estado.
// Sin Prisma, sin async, sin side effects.

import type { EstadoSeguimiento } from "@nexott-learn/shared-types"

export interface ModuloAreaParaClasificador {
  /** Area a la que pertenece el modulo (necesaria para mapear umbralArea). */
  areaId: string
  /** Tipo de asignacion para esta inscripcion. Si es null el modulo no esta
   *  asignado y no entra al check "OBLIGATORIO". */
  tipoAsignacion: "OBLIGATORIO" | "RECOMENDADO" | "OPCIONAL" | null
  /** Nota agregada del modulo (0–100) o null si sin actividad. */
  notaModulo: number | null
}

export interface AreaCursoParaClasificador {
  areaId: string
  /** Umbral del area = puntajeObjetivo (CursoArea.puntajeObjetivo). */
  umbralArea: number
}

export interface InputClasificador {
  estadoInscripcion: "ACTIVA" | "COMPLETADA" | "ABANDONADA" | "CERRADO_SIN_COMPLETAR"
  etiqueta: "EXCELENCIA" | "APROBADO" | "EN_DESARROLLO" | "INSUFICIENTE" | null
  areas: readonly AreaCursoParaClasificador[]
  modulos: readonly ModuloAreaParaClasificador[]
  notasArea: ReadonlyMap<string, number>
  /** Curso tiene proyecto transversal? Si null → no aplica al check Apto. */
  transversal: { umbralAprobacion: number; ultimaNota: number | null } | null
  /** Curso tiene entrevista IA configurada? Si null → no aplica al check Apto. */
  entrevistaIA: { aprobada: boolean } | null
}

export function clasificarEstadoSeguimiento(input: InputClasificador): EstadoSeguimiento {
  if (input.estadoInscripcion === "COMPLETADA") {
    return "Completado"
  }
  if (input.estadoInscripcion !== "ACTIVA") {
    return "EnRiesgo"
  }
  if (estaEnRiesgo(input)) {
    return "EnRiesgo"
  }
  if (esApto(input)) {
    return "Apto"
  }
  return "EnRuta"
}

function estaEnRiesgo(input: InputClasificador): boolean {
  if (input.etiqueta === "INSUFICIENTE") {
    return true
  }
  // Alguna area OBLIGATORIA con notaArea = null.
  const areasObligatorias = new Set<string>()
  for (const m of input.modulos) {
    if (m.tipoAsignacion === "OBLIGATORIO") {
      areasObligatorias.add(m.areaId)
    }
  }
  for (const areaId of areasObligatorias) {
    if (!input.notasArea.has(areaId)) {
      return true
    }
  }
  return false
}

function esApto(input: InputClasificador): boolean {
  const umbralPorArea = new Map(input.areas.map((a) => [a.areaId, a.umbralArea]))
  let hayAlgunObligatorio = false
  for (const m of input.modulos) {
    if (m.tipoAsignacion !== "OBLIGATORIO") {
      continue
    }
    hayAlgunObligatorio = true
    const umbral = umbralPorArea.get(m.areaId)
    if (umbral === undefined || m.notaModulo === null || m.notaModulo < umbral) {
      return false
    }
  }
  if (!hayAlgunObligatorio) {
    return false
  }
  if (input.transversal !== null) {
    if (
      input.transversal.ultimaNota === null ||
      input.transversal.ultimaNota < input.transversal.umbralAprobacion
    ) {
      return false
    }
  }
  if (input.entrevistaIA !== null && !input.entrevistaIA.aprobada) {
    return false
  }
  return true
}
