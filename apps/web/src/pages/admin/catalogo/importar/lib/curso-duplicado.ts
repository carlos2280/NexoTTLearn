import { ApiError } from "@/shared/api/api-error"
import type { CursoTituloDuplicado } from "@nexott-learn/shared-types"

const CODIGO_TITULO_DUPLICADO = "CURSO_TITULO_DUPLICADO"

function esCursoDuplicado(valor: unknown): valor is Omit<CursoTituloDuplicado, "reemplazable"> {
  if (typeof valor !== "object" || valor === null) {
    return false
  }
  const v = valor as Record<string, unknown>
  return typeof v.id === "string" && typeof v.titulo === "string" && typeof v.estado === "string"
}

/**
 * Si el error es el 409 "ya existe un curso con ese titulo", devuelve los
 * cursos existentes para pedir confirmacion. Cualquier otro error -> null y
 * la pagina lo muestra como error normal.
 */
export function cursosDuplicadosDelError(error: unknown): readonly CursoTituloDuplicado[] | null {
  if (!(error instanceof ApiError) || error.code !== CODIGO_TITULO_DUPLICADO) {
    return null
  }
  const detalles = error.details as { cursosExistentes?: unknown } | undefined
  const lista = detalles?.cursosExistentes
  if (!(Array.isArray(lista) && lista.length > 0 && lista.every(esCursoDuplicado))) {
    return null
  }
  // Sin el dato, el curso no se ofrece para reemplazar (lo seguro).
  return lista.map((c) => ({
    id: c.id,
    titulo: c.titulo,
    estado: c.estado,
    reemplazable: (c as { reemplazable?: unknown }).reemplazable === true,
  }))
}
