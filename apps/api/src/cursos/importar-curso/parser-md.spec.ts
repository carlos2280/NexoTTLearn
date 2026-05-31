import type { BloqueImportado, ImportarCursoInput } from "@nexott-learn/shared-types"
import { describe, expect, it } from "vitest"
import { ParserCursoMdError, parsearCursoMd } from "./parser-md"

const FRONTMATTER_VALIDO = `---
curso:
  titulo: "Curso de Prueba"
  cliente: "NTT Data Iberia"
  fechaInicio: "2026-06-15"
  fechaDeadline: "2026-09-15"
---`

function md(...partes: readonly string[]): string {
  return [FRONTMATTER_VALIDO, "", ...partes].join("\n")
}

function primerBloque(out: ImportarCursoInput): BloqueImportado {
  const modulo = out.modulos[0]
  expect(modulo).toBeDefined()
  const seccion = modulo?.secciones[0]
  expect(seccion).toBeDefined()
  const bloque = seccion?.bloques[0]
  expect(bloque).toBeDefined()
  return bloque as BloqueImportado
}

describe("parsearCursoMd", () => {
  describe("estructura del documento", () => {
    it("parsea un curso mínimo válido con un PARRAFO", () => {
      const out = parsearCursoMd(
        md(
          "# Módulo 1: Bienvenida",
          "> Presentación.",
          "",
          "## Sección 1.1: Hola",
          "",
          "::: parrafo",
          "Hola **mundo**.",
          ":::",
        ),
      )
      expect(out.curso.titulo).toBe("Curso de Prueba")
      expect(out.modulos).toHaveLength(1)
      const m = out.modulos[0]!
      expect(m.titulo).toBe("Bienvenida")
      expect(m.descripcion).toBe("Presentación.")
      expect(m.secciones).toHaveLength(1)
      expect(m.secciones[0]!.titulo).toBe("Hola")
      const bloque = primerBloque(out)
      expect(bloque.tipo).toBe("PARRAFO")
      if (bloque.tipo === "PARRAFO") {
        expect(bloque.contenido.html).toContain("<strong>mundo</strong>")
        expect(bloque.contenido.textoPlano).toContain("mundo")
        expect(bloque.contenido.tiempoLecturaMin).toBeGreaterThanOrEqual(1)
      }
    })

    it("acepta títulos sin el prefijo numerado", () => {
      const out = parsearCursoMd(md("# Bienvenida", "## Hola", "::: parrafo", "Texto", ":::"))
      expect(out.modulos[0]!.titulo).toBe("Bienvenida")
      expect(out.modulos[0]!.secciones[0]!.titulo).toBe("Hola")
    })

    it("rechaza documento sin módulos", () => {
      expect(() => parsearCursoMd(FRONTMATTER_VALIDO)).toThrow(/no contiene módulos/u)
    })

    it("rechaza sección fuera de un módulo", () => {
      expect(() => parsearCursoMd(md("## Sección huérfana", "::: parrafo", "x", ":::"))).toThrow(
        /fuera de un módulo/u,
      )
    })

    it("rechaza fence sin cerrar", () => {
      expect(() =>
        parsearCursoMd(md("# Módulo 1: A", "## Sección 1.1: B", "::: parrafo", "sin cerrar")),
      ).toThrow(/abierto sin cerrar/u)
    })

    it("rechaza tipo de fence desconocido", () => {
      expect(() => parsearCursoMd(md("# M", "## S", "::: inexistente", "x", ":::"))).toThrow(
        /Tipo de bloque desconocido/u,
      )
    })
  })

  describe("frontmatter del curso", () => {
    it("rechaza fecha mal formada", () => {
      const malFrontmatter = `---
curso:
  titulo: "X"
  cliente: "Y"
  fechaInicio: "15-06-2026"
  fechaDeadline: "2026-09-15"
---
# M
## S
::: parrafo
texto
:::`
      expect(() => parsearCursoMd(malFrontmatter)).toThrow(/Validación final fallida/u)
    })

    it("rechaza si falta `curso` en frontmatter", () => {
      const sinCurso = `---
otro: cosa
---
# M
## S
::: parrafo
x
:::`
      expect(() => parsearCursoMd(sinCurso)).toThrow(/Validación final fallida/u)
    })
  })

  describe("bloque TIP", () => {
    it("usa variante info por defecto y convierte md a html", () => {
      const out = parsearCursoMd(md("# M", "## S", "::: tip", "**Persiste**.", ":::"))
      const bloque = primerBloque(out)
      expect(bloque.tipo).toBe("TIP")
      if (bloque.tipo === "TIP") {
        expect(bloque.contenido.variante).toBe("info")
        expect(bloque.contenido.html).toContain("<strong>Persiste</strong>")
      }
    })

    it("acepta variante=warning desde params del fence", () => {
      const out = parsearCursoMd(md("# M", "## S", "::: tip variante=warning", "Ojo.", ":::"))
      const bloque = primerBloque(out)
      if (bloque.tipo === "TIP") {
        expect(bloque.contenido.variante).toBe("warning")
      }
    })

    it("rechaza variante inválida", () => {
      expect(() => parsearCursoMd(md("# M", "## S", "::: tip variante=rojo", "x", ":::"))).toThrow(
        /Validación final fallida/u,
      )
    })
  })

  describe("bloque QUIZ", () => {
    it("parsea quiz con array de preguntas OPCION_UNICA", () => {
      const out = parsearCursoMd(
        md(
          "# M",
          "## S",
          "::: quiz notaMinima=70 intentosMax=3",
          "- enunciado: ¿1+1?",
          "  tipo: OPCION_UNICA",
          "  opciones:",
          '    - { texto: "2", correcta: true }',
          '    - { texto: "3", correcta: false }',
          "  explicacion: trivial",
          ":::",
        ),
      )
      const bloque = primerBloque(out)
      expect(bloque.tipo).toBe("QUIZ")
      if (bloque.tipo === "QUIZ") {
        expect(bloque.contenido.notaMinima).toBe(70)
        expect(bloque.contenido.intentosMax).toBe(3)
        expect(bloque.contenido.preguntas).toHaveLength(1)
        const p = bloque.contenido.preguntas[0]!
        expect(p.tipo).toBe("OPCION_UNICA")
        expect(p.enunciado).toBe("¿1+1?")
        if (p.tipo === "OPCION_UNICA") {
          expect(p.opciones).toHaveLength(2)
          expect(p.opciones[0]!.esCorrecta).toBe(true)
          expect(p.opciones[1]!.esCorrecta).toBe(false)
        }
      }
    })

    it("acepta pregunta VERDADERO_FALSO", () => {
      const out = parsearCursoMd(
        md(
          "# M",
          "## S",
          "::: quiz",
          "- enunciado: ¿React usa Virtual DOM?",
          "  tipo: VERDADERO_FALSO",
          "  correcta: true",
          ":::",
        ),
      )
      const bloque = primerBloque(out)
      if (bloque.tipo === "QUIZ") {
        const p = bloque.contenido.preguntas[0]!
        if (p.tipo === "VERDADERO_FALSO") {
          expect(p.correcta).toBe(true)
        }
      }
    })

    it("rechaza OPCION_UNICA sin opción correcta", () => {
      expect(() =>
        parsearCursoMd(
          md(
            "# M",
            "## S",
            "::: quiz",
            "- enunciado: ¿1+1?",
            "  tipo: OPCION_UNICA",
            "  opciones:",
            '    - { texto: "2", correcta: false }',
            '    - { texto: "3", correcta: false }',
            ":::",
          ),
        ),
      ).toThrow(/exactamente una opción/u)
    })
  })

  describe("bloque CODIGO (reto + tests)", () => {
    it("parsea un reto completo con tests", () => {
      const out = parsearCursoMd(
        md(
          "# M",
          "## S",
          "::: codigo",
          "lenguaje: javascript",
          "enunciado: Suma dos números.",
          "esqueleto: |",
          "  function sumar(a, b) {",
          "    // tu código",
          "  }",
          "solucion: |",
          "  function sumar(a, b) { return a + b }",
          "tests:",
          '  - { descripcion: "básico", entrada: "2 3", esperada: "5", visible: true }',
          '  - { descripcion: "oculto", entrada: "9 1", esperada: "10", visible: false }',
          ":::",
        ),
      )
      const bloque = primerBloque(out)
      expect(bloque.tipo).toBe("CODIGO")
      if (bloque.tipo === "CODIGO") {
        expect(bloque.contenidoReto.lenguaje).toBe("javascript")
        expect(bloque.contenidoReto.enunciado).toContain("Suma")
        expect(bloque.contenidoReto.esqueletoInicial).toContain("function sumar")
        expect(bloque.solucionReferencia).toContain("a + b")
        expect(bloque.tests).toHaveLength(2)
        expect(bloque.tests[0]!.salidaEsperada).toBe("5")
        expect(bloque.tests[1]!.visible).toBe(false)
      }
    })

    it("rechaza bloque codigo sin tests", () => {
      expect(() =>
        parsearCursoMd(
          md(
            "# M",
            "## S",
            "::: codigo",
            "lenguaje: javascript",
            "enunciado: x",
            "tests: []",
            ":::",
          ),
        ),
      ).toThrow(/Validación final fallida/u)
    })
  })

  describe("otros bloques", () => {
    it("parsea CODIGO_ILUSTRATIVO", () => {
      const out = parsearCursoMd(
        md(
          "# M",
          "## S",
          "::: codigo_ilustrativo",
          "lenguaje: typescript",
          "descripcion: Definición de tipo",
          "codigo: |",
          "  type X = { id: string }",
          ":::",
        ),
      )
      const bloque = primerBloque(out)
      if (bloque.tipo === "CODIGO_ILUSTRATIVO") {
        expect(bloque.contenido.lenguaje).toBe("typescript")
        expect(bloque.contenido.codigo).toContain("type X")
        expect(bloque.contenido.descripcion).toBe("Definición de tipo")
      }
    })

    it("parsea RECURSO con subtipo enlace y abrirNuevaPestana por defecto", () => {
      const out = parsearCursoMd(
        md(
          "# M",
          "## S",
          "::: recurso",
          "subtipo: enlace",
          "titulo: Docs React",
          'url: "https://react.dev"',
          "descripcion: Empieza por Learn React.",
          ":::",
        ),
      )
      const bloque = primerBloque(out)
      if (bloque.tipo === "RECURSO") {
        expect(bloque.contenido.subtipo).toBe("enlace")
        expect(bloque.contenido.url).toBe("https://react.dev")
        expect(bloque.contenido.abrirNuevaPestana).toBe(true)
      }
    })

    it("parsea VIDEO", () => {
      const out = parsearCursoMd(
        md(
          "# M",
          "## S",
          "::: video",
          "proveedor: youtube",
          'url: "https://youtube.com/watch?v=abc"',
          "marcarAlPorcentaje: 85",
          "notas: Mira hasta el min 12.",
          ":::",
        ),
      )
      const bloque = primerBloque(out)
      if (bloque.tipo === "VIDEO") {
        expect(bloque.contenido.proveedor).toBe("youtube")
        expect(bloque.contenido.marcarAlPorcentaje).toBe(85)
      }
    })
  })

  describe("ParserCursoMdError", () => {
    it("se lanza con instancia correcta para quiz inválido", () => {
      expect(() =>
        parsearCursoMd(
          md(
            "# Módulo 1: Bienvenida",
            "## Sección 1.1: Quiz roto",
            "::: quiz",
            "- enunciado: ¿1+1?",
            "  tipo: OPCION_UNICA",
            "  opciones:",
            '    - { texto: "2", correcta: false }',
            '    - { texto: "3", correcta: false }',
            ":::",
          ),
        ),
      ).toThrow(ParserCursoMdError)
    })
  })
})
