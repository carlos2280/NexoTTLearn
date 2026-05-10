// Constantes y mensajes del feature de modulos del admin.
// Centralizados aqui para que sean ajustables sin tocar la logica del service.

// Codigos de error Prisma. Mapean a HTTP 409/400.
// Ref: https://www.prisma.io/docs/reference/api-reference/error-reference
export const PRISMA_ERROR_UNIQUE_CONSTRAINT = "P2002"
export const PRISMA_ERROR_FK_CONSTRAINT = "P2003"

// Mensajes de error en espanol (regla del proyecto: textos al usuario en ES,
// sin tildes para evitar problemas de encoding en algunos terminales).
export const ERROR_CURSO_NO_ENCONTRADO = "Curso no encontrado"
export const ERROR_MODULO_NO_ENCONTRADO = "Modulo no encontrado"
export const ERROR_MODULO_ORIGEN_NO_ENCONTRADO = "Modulo origen no encontrado"
export const ERROR_AREA_NO_ENCONTRADA = "Area de competencia no encontrada"
export const ERROR_SLUG_DUPLICADO = "Ya existe un modulo con ese slug en este curso"
export const ERROR_REORDER_IDS_DESFASE = "La lista de ids no coincide con los modulos del curso"

// Sufijo de titulo al clonar. Lo deja claro en la lista del admin sin
// requerir un campo unique extra.
export const CLONE_SUFFIX = " (copia)"
