import { Prisma } from "@prisma/client"

/**
 * Select Prisma reutilizable para devolver el shape estable de `IntentoBloque`
 * a traves de los endpoints. Mantiene los campos sensibles y evita filtrar
 * `respuestas` en listados (D-S7-D2 omite el body del intento en respuestas).
 */
export const SELECT_INTENTO_FIELDS = {
  id: true,
  bloqueId: true,
  skillId: true,
  cursoId: true,
  colaboradorId: true,
  nota: true,
  esMejorIntento: true,
  versionBloque: true,
  estaInvalidado: true,
  fecha: true,
  preguntasFalladas: true,
} as const satisfies Prisma.IntentoBloqueSelect

export type IntentoSeleccionado = Prisma.IntentoBloqueGetPayload<{
  select: typeof SELECT_INTENTO_FIELDS
}>

/**
 * Select del mejor-intento: incluye ademas `respuestas` (el body guardado) para
 * la vista de revision del bloque (P13, hoy solo QUIZ). Acceso admin-o-dueño
 * (@Roles ADMIN/PARTICIPANTE + `asegurarAccesoColaborador`): el alumno ve lo
 * suyo y un admin puede verlo para moderar. Para QUIZ son las opciones elegidas,
 * NO la clave de correccion (esa vive en `Bloque.contenido`). Los listados
 * siguen con `SELECT_INTENTO_FIELDS` sin `respuestas` (D-S7-D2).
 */
export const SELECT_INTENTO_FIELDS_CON_RESPUESTAS = {
  ...SELECT_INTENTO_FIELDS,
  respuestas: true,
} as const satisfies Prisma.IntentoBloqueSelect

/**
 * Resultado interno del calculo de un intento QUIZ (D-S7-C2). El service
 * normaliza la nota a `Prisma.Decimal` antes de persistir.
 *
 * `preguntasFalladasIds` (B-extra.2 punto 4): ids de las preguntas que no
 * se acertaron. Para `CODIGO_PREGUNTAS` se devuelve siempre array vacio.
 */
export interface CalculoQuizResultado {
  readonly nota: number
  readonly puntosObtenidos: number
  readonly puntosTotales: number
  readonly preguntasFalladasIds: readonly string[]
}
