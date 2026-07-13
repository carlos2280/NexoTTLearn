import type {
  ActualizarTransversalCursoInput,
  TransversalResponse,
} from "@nexott-learn/shared-types"

/**
 * Estado del formulario de configuración del proyecto transversal. Refleja lo
 * que el admin edita: activación, brief (HTML de Tiptap), umbral, pesos por
 * capa, flags de capa activa y las skills que mide.
 */
export interface FormTransversal {
  readonly activo: boolean
  readonly descripcion: string
  readonly umbralAprobacion: number
  readonly intentosMax: number
  readonly pesoCapaTests: number
  readonly pesoCapaCualitativa: number
  readonly pesoCapaComprension: number
  readonly capaTestsActiva: boolean
  readonly capaCualitativaActiva: boolean
  readonly capaComprensionActiva: boolean
  readonly skillsQueMideIds: readonly string[]
  readonly criteriosEvaluacion: readonly string[]
}

/**
 * Pesos y flags de capa fijos: el transversal se evalúa con UNA sola capa
 * (revisión con IA = cualitativa). Tests y comprensión quedan apagadas y su
 * peso en 0. El contrato PATCH sigue exigiendo las 3 (schema de 3 capas), así
 * que enviamos estos valores fijos; la suma da 100 y el cálculo de nota (D35)
 * usa solo la capa viva. Ver `construirInputTransversal`.
 */
const CAPAS_UNA_SOLA_IA = {
  pesoCapaTests: 0,
  pesoCapaCualitativa: 100,
  pesoCapaComprension: 0,
  capaTestsActiva: false,
  capaCualitativaActiva: true,
  capaComprensionActiva: false,
} as const

/** Baseline por defecto para un curso que aún no tiene transversal. */
export const FORM_TRANSVERSAL_DEFECTO: FormTransversal = {
  activo: false,
  descripcion: "",
  umbralAprobacion: 70,
  intentosMax: 3,
  ...CAPAS_UNA_SOLA_IA,
  skillsQueMideIds: [],
  criteriosEvaluacion: [],
}

/** Mapea la respuesta del GET admin al baseline del formulario (edición). */
export function baselineDesdeRespuesta(resp: TransversalResponse): FormTransversal {
  return {
    activo: true,
    descripcion: resp.descripcion,
    umbralAprobacion: resp.umbralAprobacion,
    intentosMax: resp.intentosMax,
    pesoCapaTests: resp.pesosCapas.tests,
    pesoCapaCualitativa: resp.pesosCapas.cualitativa,
    pesoCapaComprension: resp.pesosCapas.comprension,
    capaTestsActiva: resp.capasActivas.tests,
    capaCualitativaActiva: resp.capasActivas.cualitativa,
    capaComprensionActiva: resp.capasActivas.comprension,
    skillsQueMideIds: resp.skillsQueMide.map((s) => s.skillId),
    criteriosEvaluacion: [...resp.criteriosEvaluacion],
  }
}

/**
 * Al activar, el brief no puede ir vacío. Los pesos ya no los edita el admin
 * (evaluación de una sola capa IA), así que no se validan aquí.
 */
export function esFormValido(form: FormTransversal): boolean {
  if (!form.activo) {
    return true
  }
  return form.descripcion.trim().length > 0
}

/** True si el formulario difiere del baseline cargado (habilita "Guardar"). */
export function esFormModificado(form: FormTransversal, base: FormTransversal): boolean {
  if (form.activo !== base.activo) {
    return true
  }
  if (!form.activo) {
    return false
  }
  return (
    form.descripcion !== base.descripcion ||
    form.umbralAprobacion !== base.umbralAprobacion ||
    form.intentosMax !== base.intentosMax ||
    form.pesoCapaTests !== base.pesoCapaTests ||
    form.pesoCapaCualitativa !== base.pesoCapaCualitativa ||
    form.pesoCapaComprension !== base.pesoCapaComprension ||
    form.capaTestsActiva !== base.capaTestsActiva ||
    form.capaCualitativaActiva !== base.capaCualitativaActiva ||
    form.capaComprensionActiva !== base.capaComprensionActiva ||
    !mismasSkills(form.skillsQueMideIds, base.skillsQueMideIds) ||
    !mismosCriterios(form.criteriosEvaluacion, base.criteriosEvaluacion)
  )
}

/**
 * Compara las listas "a evaluar" ignorando ítems vacíos y espacios: escribir
 * un ítem en blanco no debe marcar el form como modificado (se descarta al
 * guardar). El orden sí importa (la lista es ordenada por el admin).
 */
function mismosCriterios(a: readonly string[], b: readonly string[]): boolean {
  const na = normalizarCriterios(a)
  const nb = normalizarCriterios(b)
  return na.length === nb.length && na.every((c, i) => c === nb[i])
}

function normalizarCriterios(criterios: readonly string[]): string[] {
  return criterios.map((c) => c.trim()).filter((c) => c.length > 0)
}

function mismasSkills(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) {
    return false
  }
  const set = new Set(b)
  return a.every((id) => set.has(id))
}

/** Construye el input del PATCH según si se activa o se desactiva. */
export function construirInputTransversal(form: FormTransversal): ActualizarTransversalCursoInput {
  if (!form.activo) {
    return { activo: false }
  }
  // Normaliza SIEMPRE a una sola capa (revisión con IA). Aunque el curso
  // tenga guardado el modelo viejo de 3 capas, al guardar se colapsa a IA.
  return {
    activo: true,
    descripcion: form.descripcion,
    umbralAprobacion: form.umbralAprobacion,
    intentosMax: form.intentosMax,
    ...CAPAS_UNA_SOLA_IA,
    skillsQueMideIds: [...form.skillsQueMideIds],
    // Descarta ítems vacíos/en blanco: el contrato exige min(1) por ítem.
    criteriosEvaluacion: normalizarCriterios(form.criteriosEvaluacion),
  }
}
