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
  readonly pesoCapaTests: number
  readonly pesoCapaCualitativa: number
  readonly pesoCapaComprension: number
  readonly capaTestsActiva: boolean
  readonly capaCualitativaActiva: boolean
  readonly capaComprensionActiva: boolean
  readonly skillsQueMideIds: readonly string[]
}

/** Baseline por defecto para un curso que aún no tiene transversal. */
export const FORM_TRANSVERSAL_DEFECTO: FormTransversal = {
  activo: false,
  descripcion: "",
  umbralAprobacion: 70,
  pesoCapaTests: 40,
  pesoCapaCualitativa: 40,
  pesoCapaComprension: 20,
  capaTestsActiva: true,
  capaCualitativaActiva: true,
  capaComprensionActiva: true,
  skillsQueMideIds: [],
}

/** Mapea la respuesta del GET admin al baseline del formulario (edición). */
export function baselineDesdeRespuesta(resp: TransversalResponse): FormTransversal {
  return {
    activo: true,
    descripcion: resp.descripcion,
    umbralAprobacion: resp.umbralAprobacion,
    pesoCapaTests: resp.pesosCapas.tests,
    pesoCapaCualitativa: resp.pesosCapas.cualitativa,
    pesoCapaComprension: resp.pesosCapas.comprension,
    capaTestsActiva: resp.capasActivas.tests,
    capaCualitativaActiva: resp.capasActivas.cualitativa,
    capaComprensionActiva: resp.capasActivas.comprension,
    skillsQueMideIds: resp.skillsQueMide.map((s) => s.skillId),
  }
}

/** La suma de pesos debe ser 100 y el brief no puede ir vacío al activar. */
export function esFormValido(form: FormTransversal): boolean {
  if (!form.activo) {
    return true
  }
  const suma = form.pesoCapaTests + form.pesoCapaCualitativa + form.pesoCapaComprension
  const sumaOk = Math.round(suma * 100) === 10000
  const briefOk = form.descripcion.trim().length > 0
  return sumaOk && briefOk
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
    form.pesoCapaTests !== base.pesoCapaTests ||
    form.pesoCapaCualitativa !== base.pesoCapaCualitativa ||
    form.pesoCapaComprension !== base.pesoCapaComprension ||
    form.capaTestsActiva !== base.capaTestsActiva ||
    form.capaCualitativaActiva !== base.capaCualitativaActiva ||
    form.capaComprensionActiva !== base.capaComprensionActiva ||
    !mismasSkills(form.skillsQueMideIds, base.skillsQueMideIds)
  )
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
  return {
    activo: true,
    descripcion: form.descripcion,
    umbralAprobacion: form.umbralAprobacion,
    pesoCapaTests: form.pesoCapaTests,
    pesoCapaCualitativa: form.pesoCapaCualitativa,
    pesoCapaComprension: form.pesoCapaComprension,
    capaTestsActiva: form.capaTestsActiva,
    capaCualitativaActiva: form.capaCualitativaActiva,
    capaComprensionActiva: form.capaComprensionActiva,
    skillsQueMideIds: [...form.skillsQueMideIds],
  }
}
