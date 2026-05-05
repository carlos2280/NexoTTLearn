// Constantes del feature de cursos del admin.
// Centralizadas aqui para que sean ajustables sin tocar la logica del service.

import type { CursoAdminItem } from "@nexott-learn/shared-types"

// Paleta de colores del icono de la card. Mantener sincronizado con
// el enum iconColorSchema en packages/shared-types/src/admin-cursos.ts.
// El orden importa: el mapeo titulo -> color es deterministico (hash modulo).
export const ICON_COLORS: readonly CursoAdminItem["iconColor"][] = [
  "indigo",
  "emerald",
  "violet",
  "amber",
  "rose",
  "cyan",
] as const

// Maximo de caracteres del campo iconInitials del componente <NxlCourseCardAdmin>.
// El componente acepta 1-3, elegimos 2 por consistencia visual.
export const ICON_INITIALS_MAX = 2

// Regex de separacion en blancos. Definido a nivel modulo para no recrear el
// objeto RegExp en cada llamada del mapper (regla performance/useTopLevelRegex).
export const PALABRAS_REGEX = /\s+/

// Codigo de error Prisma para violacion de constraint unique. Mapea a HTTP 409.
// Ref: https://www.prisma.io/docs/reference/api-reference/error-reference#p2002
export const PRISMA_ERROR_UNIQUE_CONSTRAINT = "P2002"

// Mensajes de error en espanol (regla del proyecto: textos al usuario en ES).
export const ERROR_CURSO_NO_ENCONTRADO = "Curso no encontrado"
export const ERROR_SLUG_DUPLICADO = "Ya existe un curso con ese slug"
export const ERROR_CURSO_DESHABILITADO =
  "No se pueden modificar los pesos de un curso deshabilitado"
