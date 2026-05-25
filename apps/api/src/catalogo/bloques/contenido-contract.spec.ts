import {
  type TipoBloque,
  contenidoBloquePorTipo,
  contenidoCodigoIlustrativoSchema,
  contenidoCodigoPreguntasSchema,
  contenidoCodigoTestsSchema,
  contenidoParrafoSchema,
  contenidoQuizSchema,
  contenidoRecursoSchema,
  contenidoTipSchema,
  contenidoVideoSchema,
  schemaContenidoBloquePorTipo,
  validarContenidoBloque,
} from "@nexott-learn/shared-types"
import { describe, expect, it } from "vitest"

/**
 * Contrato `Bloque.contenido` — un test por tipo de bloque, verificando
 * shape valido (estado inicial del editor) y shape invalido (caso del
 * seeder antiguo). Es la red de seguridad que protege a backend, editores
 * y seeder del drift de contratos.
 */

// Mapa de contenidos validos por tipo. Usamos `Map<TipoBloque, ...>` en
// lugar de `Record<TipoBloque, ...>` porque los valores del enum estan en
// UPPERCASE_SNAKE (PARRAFO, TIP, CODIGO_PREGUNTAS, ...) y como claves de
// Record disparan `useNamingConvention` de Biome. Como claves de Map son
// valores en runtime (no identificadores), no aplica esa regla.
const CONTENIDO_VALIDO_POR_TIPO = new Map<TipoBloque, Record<string, unknown>>([
  ["PARRAFO", { html: "", textoPlano: "", tiempoLecturaMin: 0 }],
  ["TIP", { variante: "info", html: "" }],
  ["CODIGO_ILUSTRATIVO", { lenguaje: "typescript", codigo: "", descripcion: "" }],
  ["VIDEO", { url: "", proveedor: "otro", marcarAlPorcentaje: 90, notas: "" }],
  [
    "RECURSO",
    {
      subtipo: "enlace",
      url: "",
      titulo: "",
      descripcion: "",
      abrirNuevaPestana: true,
    },
  ],
  [
    "QUIZ",
    {
      intentosMax: null,
      solucionVisible: "al_aprobar",
      ordenAleatorio: false,
      notaMinima: 60,
      preguntas: [
        {
          id: "p1",
          tipo: "OPCION_UNICA",
          enunciado: "?",
          pesoPunto: 1,
          opciones: [
            { id: "a", texto: "A", esCorrecta: true },
            { id: "b", texto: "B", esCorrecta: false },
          ],
        },
      ],
    },
  ],
  [
    "CODIGO_PREGUNTAS",
    {
      lenguaje: "typescript",
      enunciado: "Resuelve esto",
      esqueletoInicial: "",
      tiempoLimiteSeg: 30,
    },
  ],
  [
    "CODIGO_TESTS",
    {
      codigoPreguntasId: "00000000-0000-0000-0000-000000000001",
      tests: [{ id: "t1", descripcion: "ok", entrada: "1", salidaEsperada: "1", visible: true }],
    },
  ],
  ["DIAGRAMA", { elements: [], altText: "Diagrama vacio listo para editar" }],
])

describe("contenidoBloquePorTipo — cobertura completa de tipos", () => {
  it("registra exactamente un schema por cada TipoBloque del enum", () => {
    const tipos: readonly TipoBloque[] = [
      "PARRAFO",
      "TIP",
      "CODIGO_ILUSTRATIVO",
      "VIDEO",
      "RECURSO",
      "QUIZ",
      "CODIGO_PREGUNTAS",
      "CODIGO_TESTS",
      "DIAGRAMA",
    ]
    for (const t of tipos) {
      expect(contenidoBloquePorTipo[t]).toBeDefined()
      expect(schemaContenidoBloquePorTipo(t)).toBe(contenidoBloquePorTipo[t])
    }
    // El mapa no expone tipos extra (defensa contra TipoBloque drifteado).
    expect(Object.keys(contenidoBloquePorTipo).sort()).toEqual([...tipos].sort())
  })
})

describe("validarContenidoBloque — happy path por tipo", () => {
  it.each<[TipoBloque]>([
    ["PARRAFO"],
    ["TIP"],
    ["CODIGO_ILUSTRATIVO"],
    ["VIDEO"],
    ["RECURSO"],
    ["QUIZ"],
    ["CODIGO_PREGUNTAS"],
    ["CODIGO_TESTS"],
    ["DIAGRAMA"],
  ])("acepta el contenido valido minimo para %s", (tipo) => {
    const valido = CONTENIDO_VALIDO_POR_TIPO.get(tipo)
    expect(valido).toBeDefined()
    const result = validarContenidoBloque(tipo, valido)
    expect(result.success).toBe(true)
  })
})

describe("validarContenidoBloque — rechaza shapes obsoletos del seeder viejo", () => {
  it("PARRAFO rechaza `{ texto }` (shape pre-Fase-1)", () => {
    expect(validarContenidoBloque("PARRAFO", { texto: "hola" }).success).toBe(false)
  })

  it("TIP rechaza `{ titulo, texto }` (shape pre-Fase-1)", () => {
    expect(validarContenidoBloque("TIP", { titulo: "ojo", texto: "hola" }).success).toBe(false)
  })

  it("CODIGO_ILUSTRATIVO rechaza `{ titulo, lenguaje, codigo }` sin descripcion", () => {
    expect(
      validarContenidoBloque("CODIGO_ILUSTRATIVO", {
        titulo: "x",
        lenguaje: "ts",
        codigo: "1",
      }).success,
    ).toBe(false)
  })

  it("VIDEO rechaza `{ url, titulo, duracionSeg }` sin proveedor", () => {
    expect(
      validarContenidoBloque("VIDEO", {
        url: "http://x",
        titulo: "demo",
        duracionSeg: 120,
      }).success,
    ).toBe(false)
  })

  it("RECURSO rechaza `{ url, titulo }` sin subtipo ni abrirNuevaPestana", () => {
    expect(validarContenidoBloque("RECURSO", { url: "http://x", titulo: "x" }).success).toBe(false)
  })

  it("QUIZ rechaza shape simplificado `{ preguntas: [{ enunciado, opciones: string[], correcta: number }] }`", () => {
    const shapeViejo = {
      preguntas: [{ enunciado: "?", opciones: ["A", "B"], correcta: 0 }],
    }
    expect(validarContenidoBloque("QUIZ", shapeViejo).success).toBe(false)
  })

  it("CODIGO_PREGUNTAS rechaza `{ enunciado, plantilla, casosPrueba }` sin lenguaje", () => {
    expect(
      validarContenidoBloque("CODIGO_PREGUNTAS", {
        enunciado: "?",
        plantilla: "",
        casosPrueba: [{ entrada: "1", salida: "1" }],
      }).success,
    ).toBe(false)
  })

  it("rechaza objetos vacios (contenido aun no inicializado)", () => {
    expect(validarContenidoBloque("PARRAFO", {}).success).toBe(false)
    expect(validarContenidoBloque("QUIZ", {}).success).toBe(false)
    expect(validarContenidoBloque("VIDEO", {}).success).toBe(false)
  })
})

describe("schemas individuales — invariantes especificas", () => {
  it("PARRAFO: tiempoLecturaMin debe ser entero >= 0", () => {
    expect(
      contenidoParrafoSchema.safeParse({ html: "", textoPlano: "", tiempoLecturaMin: -1 }).success,
    ).toBe(false)
    expect(
      contenidoParrafoSchema.safeParse({ html: "", textoPlano: "", tiempoLecturaMin: 1.5 }).success,
    ).toBe(false)
    expect(
      contenidoParrafoSchema.safeParse({ html: "", textoPlano: "", tiempoLecturaMin: 999 }).success,
    ).toBe(false)
  })

  it("TIP: variante solo admite info|warning|exito (no `success` ni otros)", () => {
    expect(contenidoTipSchema.safeParse({ variante: "success", html: "" }).success).toBe(false)
    expect(contenidoTipSchema.safeParse({ variante: "exito", html: "" }).success).toBe(true)
  })

  it("VIDEO: marcarAlPorcentaje fuera de [0,100] falla", () => {
    expect(
      contenidoVideoSchema.safeParse({
        url: "",
        proveedor: "otro",
        marcarAlPorcentaje: 101,
        notas: "",
      }).success,
    ).toBe(false)
  })

  it("RECURSO: subtipo solo admite enlace|adjunto", () => {
    expect(
      contenidoRecursoSchema.safeParse({
        subtipo: "documento",
        url: "",
        titulo: "",
        descripcion: "",
        abrirNuevaPestana: true,
      }).success,
    ).toBe(false)
  })

  it("CODIGO_ILUSTRATIVO: lenguaje vacio falla", () => {
    expect(
      contenidoCodigoIlustrativoSchema.safeParse({
        lenguaje: "",
        codigo: "",
        descripcion: "",
      }).success,
    ).toBe(false)
  })

  it("QUIZ: OPCION_UNICA exige exactamente una opcion con esCorrecta=true", () => {
    const dosCorrectas = {
      intentosMax: null,
      solucionVisible: "al_aprobar",
      ordenAleatorio: false,
      notaMinima: 60,
      preguntas: [
        {
          id: "p1",
          tipo: "OPCION_UNICA",
          enunciado: "?",
          pesoPunto: 1,
          opciones: [
            { id: "a", texto: "A", esCorrecta: true },
            { id: "b", texto: "B", esCorrecta: true },
          ],
        },
      ],
    }
    expect(contenidoQuizSchema.safeParse(dosCorrectas).success).toBe(false)
  })

  it("CODIGO_PREGUNTAS: lenguaje vacio falla; cualquier string no-vacio pasa", () => {
    // El schema acepta cualquier string >= 1; la restriccion a js/ts/py solo
    // aplica al EVALUAR via sandbox (ver 16b §16b.6). Esto permite que el editor
    // ofrezca lenguajes adicionales aunque solo los 3 soportados sean
    // ejecutables.
    expect(
      contenidoCodigoPreguntasSchema.safeParse({
        lenguaje: "",
        enunciado: "?",
        esqueletoInicial: "",
        tiempoLimiteSeg: 30,
      }).success,
    ).toBe(false)
    expect(
      contenidoCodigoPreguntasSchema.safeParse({
        lenguaje: "ruby",
        enunciado: "?",
        esqueletoInicial: "",
        tiempoLimiteSeg: 30,
      }).success,
    ).toBe(true)
  })

  it("CODIGO_TESTS: tests vacio falla (min 1)", () => {
    expect(
      contenidoCodigoTestsSchema.safeParse({
        codigoPreguntasId: "00000000-0000-0000-0000-000000000001",
        tests: [],
      }).success,
    ).toBe(false)
  })
})
