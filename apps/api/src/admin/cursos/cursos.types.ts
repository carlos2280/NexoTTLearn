// Constantes y mensajes del feature de cursos del admin (schema v2).
// Mensajes en espanol — el frontend los muestra al usuario tal cual.

export const ENTIDAD_TIPO = "Curso"

// Codigo de error Prisma para violacion de constraint unique. Mapea a HTTP 409.
// Ref: https://www.prisma.io/docs/reference/api-reference/error-reference#p2002
export const PRISMA_ERROR_UNIQUE_CONSTRAINT = "P2002"

export const ERROR_CURSO_NO_ENCONTRADO = "Curso no encontrado"
export const ERROR_SLUG_DUPLICADO = "Ya existe un curso con ese slug"
export const ERROR_DUPLICAR_ORIGEN_NO_ENCONTRADO = "El curso origen para duplicar no existe"
export const ERROR_AREA_NO_ENCONTRADA = "Una de las areas referenciadas no existe"
export const ERROR_AREA_OBSOLETA =
  "No se pueden asignar areas en estado OBSOLETA al curso (T01·Q1.2)"
export const ERROR_AREAS_SOLO_BORRADOR =
  "Solo se pueden modificar las areas de un curso en estado BORRADOR"
export const ERROR_PUBLICAR_DESDE_CERRADO =
  "No se puede publicar un curso CERRADO; duplicalo para reutilizarlo"
export const ERROR_DESPUBLICAR_NO_ACTIVO = "Solo se puede despublicar un curso en estado ACTIVO"
export const ERROR_CERRAR_NO_ACTIVO = "Solo se puede cerrar un curso en estado ACTIVO"
export const ERROR_ELIMINAR_NO_BORRADOR = "Solo se pueden eliminar cursos en estado BORRADOR"
export const ERROR_ELIMINAR_CON_INSCRIPCIONES =
  "No se puede eliminar un curso con inscripciones; cerralo en su lugar"

// Errores de areas individuales (Iter 2)
export const ERROR_CURSO_AREA_NO_ENCONTRADA = "CursoArea no encontrada"
export const ERROR_AREA_DUPLICADA_EN_CURSO = "El area ya esta asignada a este curso"
export const ERROR_AREA_TIENE_MODULOS =
  "El area tiene modulos no archivados en este curso; reasigna o archiva primero"
export const ERROR_AREA_NUEVA_YA_EN_CURSO = "El nuevo area ya esta asignada a este curso"

// Errores de Proyecto Transversal (Iter 7)
// biome-ignore lint/nursery/noSecrets: nombre de entidad de dominio, no es un secreto
export const ENTIDAD_TIPO_PROYECTO_TRANSVERSAL = "ProyectoTransversal"
// biome-ignore lint/nursery/noSecrets: mensaje de error de dominio, no es un secreto
export const ERROR_PROYECTO_TRANSVERSAL_NO_ENCONTRADO = "ProyectoTransversal no encontrado"
export const ERROR_PT_CURSO_CERRADO =
  "No se puede modificar el proyecto transversal en un curso CERRADO"
export const ERROR_PT_DELETE_NO_BORRADOR =
  "Solo se puede eliminar el proyecto transversal en cursos en estado BORRADOR"
export const ERROR_PT_DELETE_CON_ENTREGAS =
  "No se puede eliminar el proyecto transversal porque tiene entregas registradas"

// Errores de Entrevista IA Config (Iter 7)
export const ENTIDAD_TIPO_ENTREVISTA_IA = "EntrevistaIA"
export const ERROR_ENTREVISTA_IA_NO_ENCONTRADA = "EntrevistaIA no encontrada"
export const ERROR_EI_CURSO_CERRADO = "No se puede modificar la entrevista IA en un curso CERRADO"
export const ERROR_EI_DELETE_NO_BORRADOR =
  "Solo se puede eliminar la entrevista IA en cursos en estado BORRADOR"
export const ERROR_EI_DELETE_CON_SESIONES =
  "No se puede eliminar la entrevista IA porque tiene sesiones registradas"
