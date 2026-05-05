// Constantes y mensajes del feature de secciones del admin.
// Centralizados aqui para que sean ajustables sin tocar la logica del service.

// Codigo Prisma: violacion de unique constraint. Mapea a HTTP 409.
export const PRISMA_ERROR_UNIQUE_CONSTRAINT = "P2002"

// Mensajes de error en espanol (regla del proyecto: textos al usuario en ES,
// sin tildes para evitar problemas de encoding en algunos terminales).
export const ERROR_CURSO_NO_ENCONTRADO = "Curso no encontrado"
export const ERROR_MODULO_NO_ENCONTRADO = "Modulo no encontrado"
export const ERROR_SECCION_NO_ENCONTRADA = "Seccion no encontrada"
export const ERROR_REORDER_IDS_DESFASE = "La lista de ids no coincide con las secciones del modulo"
