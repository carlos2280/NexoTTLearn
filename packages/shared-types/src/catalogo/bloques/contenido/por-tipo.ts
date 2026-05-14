import type { z } from "zod"
import {
  contenidoCodigoPreguntasSchema,
  contenidoCodigoTestsSchema,
  contenidoQuizSchema,
} from "../../../intentos-bloque"
import type { TipoBloque } from "../listar-bloques.schema"
import { contenidoCodigoIlustrativoSchema } from "./codigo-ilustrativo.schema"
import { contenidoParrafoSchema } from "./parrafo.schema"
import { contenidoRecursoSchema } from "./recurso.schema"
import { contenidoTipSchema } from "./tip.schema"
import { contenidoVideoSchema } from "./video.schema"

/**
 * Mapa unico de tipo de bloque a schema Zod de su `contenido` (jsonb).
 *
 * El `satisfies Record<TipoBloque, z.ZodTypeAny>` fuerza al compilador a
 * gritar cuando se agregue un nuevo `TipoBloque` al enum y se olvide
 * registrar su schema aqui. Esto es la unica fuente de verdad para validar
 * `Bloque.contenido` en TODA la app (editor, backend, motor de correccion).
 *
 * Los tres bloques evaluables (QUIZ, CODIGO_PREGUNTAS, CODIGO_TESTS)
 * tienen sus schemas en `intentos-bloque/` por motivos historicos: el
 * motor de autocorreccion los consume desde alli. Se reusan sin cambios.
 */
export const contenidoBloquePorTipo = {
  // biome-ignore lint/style/useNamingConvention: clave es valor de enum Prisma `TipoBloque`.
  PARRAFO: contenidoParrafoSchema,
  // biome-ignore lint/style/useNamingConvention: clave es valor de enum Prisma `TipoBloque`.
  TIP: contenidoTipSchema,
  // biome-ignore lint/style/useNamingConvention: clave es valor de enum Prisma `TipoBloque`.
  CODIGO_ILUSTRATIVO: contenidoCodigoIlustrativoSchema,
  // biome-ignore lint/style/useNamingConvention: clave es valor de enum Prisma `TipoBloque`.
  VIDEO: contenidoVideoSchema,
  // biome-ignore lint/style/useNamingConvention: clave es valor de enum Prisma `TipoBloque`.
  RECURSO: contenidoRecursoSchema,
  // biome-ignore lint/style/useNamingConvention: clave es valor de enum Prisma `TipoBloque`.
  QUIZ: contenidoQuizSchema,
  // biome-ignore lint/style/useNamingConvention: clave es valor de enum Prisma `TipoBloque`.
  CODIGO_PREGUNTAS: contenidoCodigoPreguntasSchema,
  // biome-ignore lint/style/useNamingConvention: clave es valor de enum Prisma `TipoBloque`.
  CODIGO_TESTS: contenidoCodigoTestsSchema,
} as const satisfies Record<TipoBloque, z.ZodTypeAny>

/**
 * Devuelve el schema Zod del contenido para un tipo de bloque concreto.
 * Util cuando el llamante ya tiene el `tipo` en mano y necesita el schema
 * para pasarlo a un pipe Nest, a un helper de tests, o para inferir tipos.
 */
export function schemaContenidoBloquePorTipo(tipo: TipoBloque) {
  return contenidoBloquePorTipo[tipo]
}

/**
 * Valida un `contenido` arbitrario contra el schema correspondiente al
 * `tipo` indicado. Wrapper sobre `safeParse` que centraliza la seleccion
 * del schema. Defensa en profundidad: el editor valida, el backend valida,
 * el motor de autocorreccion valida — siempre por esta funcion.
 */
export function validarContenidoBloque(
  tipo: TipoBloque,
  contenido: unknown,
): z.SafeParseReturnType<unknown, unknown> {
  return contenidoBloquePorTipo[tipo].safeParse(contenido)
}
