import { type TipoBloque, validarContenidoBloque } from "@nexott-learn/shared-types"
import { describe, expect, it } from "vitest"
import { type ContextoContenidoDefecto, contenidoPorDefecto } from "./contenido-por-defecto"

/**
 * El contenido por defecto de cada tipo creable desde el modal debe validar
 * contra su contrato del backend; si no, la creación falla al enviar. Esta
 * suite es la red que evita el bug de "tipo en el modal sin default válido"
 * (p. ej. DIAGRAMA caía en `{}` y el backend lo rechazaba).
 */
const CONTEXTO_POR_TIPO: Partial<Record<TipoBloque, ContextoContenidoDefecto>> = {
  // biome-ignore lint/style/useNamingConvention: clave del enum TipoBloque de Prisma.
  CODIGO_TESTS: { codigoPreguntasHermanoId: "00000000-0000-4000-8000-000000000001" },
  // biome-ignore lint/style/useNamingConvention: clave del enum TipoBloque de Prisma.
  SQL_TESTS: { sqlEjercicioHermanoId: "00000000-0000-4000-8000-000000000002" },
}

const TIPOS_CREABLES: readonly TipoBloque[] = [
  "PARRAFO",
  "TIP",
  "VIDEO",
  "RECURSO",
  "QUIZ",
  "CODIGO_ILUSTRATIVO",
  "CODIGO_PREGUNTAS",
  "CODIGO_TESTS",
  "DIAGRAMA",
  "SQL_EJERCICIO",
  "SQL_TESTS",
  "GIT_EJERCICIO",
]

describe("contenidoPorDefecto", () => {
  it.each(TIPOS_CREABLES)("el default de %s valida contra su contrato", (tipo) => {
    const contenido = contenidoPorDefecto(tipo, CONTEXTO_POR_TIPO[tipo])
    const resultado = validarContenidoBloque(tipo, contenido)
    expect(resultado.success).toBe(true)
  })

  it("DIAGRAMA arranca con lienzo vacío y altText no vacío (a11y)", () => {
    const contenido = contenidoPorDefecto("DIAGRAMA") as {
      elements: unknown[]
      altText: string
    }
    expect(contenido.elements).toEqual([])
    expect(contenido.altText.length).toBeGreaterThan(0)
  })
})
