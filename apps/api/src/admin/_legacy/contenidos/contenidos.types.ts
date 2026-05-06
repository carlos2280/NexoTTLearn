// Constantes y mensajes del feature de contenidos del admin.
// Centralizados aqui para que sean ajustables sin tocar la logica del service.

export const ERROR_CURSO_NO_ENCONTRADO = "Curso no encontrado"
export const ERROR_MODULO_NO_ENCONTRADO = "Modulo no encontrado"
export const ERROR_SECCION_NO_ENCONTRADA = "Seccion no encontrada"
export const ERROR_CONTENIDO_NO_ENCONTRADO = "Contenido no encontrado"

// Mensajes de reorden
export const ERROR_REORDER_IDS_DESFASE =
  "La lista de ordenes no coincide con los contenidos de la seccion"
export const ERROR_REORDER_ID_DUPLICADO = "Hay ids duplicados en la lista de ordenes"
export const ERROR_REORDER_ID_AJENO = "Uno o mas ids no pertenecen a la seccion indicada"

// Mensaje del PATCH cuando intentan cambiar el tipo (tipo es inmutable).
export const ERROR_TIPO_INMUTABLE = "No se permite cambiar el tipo de un contenido existente"

// Conflict al eliminar contenido con entregas asociadas. La logica del front
// debe sugerir archivar en lugar de eliminar.
export function buildErrorContenidoConEntregas(n: number): string {
  return `No se puede eliminar: el contenido tiene ${n} entregas. Archivalo en su lugar.`
}
