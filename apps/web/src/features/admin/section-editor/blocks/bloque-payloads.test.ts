import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  defaultLecturaPayload,
  defaultRecursoPayload,
  defaultVideoPayload,
  jsonEquals,
  parseLecturaPayload,
  parseRecursoPayload,
  parseVideoPayload,
} from "./bloque-payloads"

let warnSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {
    // silenciamos warnings esperados en parses fallidos
  })
})

afterEach(() => {
  warnSpy.mockRestore()
})

describe("parseLecturaPayload", () => {
  it("devuelve el payload tal cual cuando es valido", () => {
    expect(parseLecturaPayload({ cuerpo: "<p>hola</p>" })).toEqual({ cuerpo: "<p>hola</p>" })
    expect(warnSpy).not.toHaveBeenCalled()
  })

  it("cae al default si raw es null", () => {
    expect(parseLecturaPayload(null)).toEqual(defaultLecturaPayload())
    expect(warnSpy).toHaveBeenCalledOnce()
  })

  it("cae al default si raw no es objeto", () => {
    expect(parseLecturaPayload("string suelto")).toEqual(defaultLecturaPayload())
  })
})

describe("parseVideoPayload", () => {
  it("acepta payload completo", () => {
    const raw = {
      url: "https://youtu.be/abc",
      proveedor: "youtube",
      duracion: 120,
      transcripcion: "...",
    }
    expect(parseVideoPayload(raw)).toEqual(raw)
  })

  it("acepta payload minimo (url + proveedor)", () => {
    expect(parseVideoPayload({ url: "", proveedor: "interno" })).toEqual({
      url: "",
      proveedor: "interno",
    })
  })

  it("cae al default si falta proveedor", () => {
    expect(parseVideoPayload({ url: "https://x" })).toEqual(defaultVideoPayload())
  })

  it("cae al default si proveedor no es del enum", () => {
    expect(parseVideoPayload({ url: "x", proveedor: "tiktok" })).toEqual(defaultVideoPayload())
  })
})

describe("parseRecursoPayload", () => {
  it("acepta link basico", () => {
    expect(parseRecursoPayload({ tipoRecurso: "link", url: "https://docs.x" })).toEqual({
      tipoRecurso: "link",
      url: "https://docs.x",
    })
  })

  it("preserva pdf/archivo (legacy) si vinieran con datos validos", () => {
    // F5.B no permite crear pdf/archivo desde la UI, pero si en BD ya hay un
    // bloque con tipoRecurso pdf, el parse debe respetarlo (la UI luego lo
    // muestra read-only).
    expect(
      parseRecursoPayload({ tipoRecurso: "pdf", url: "https://x/a.pdf", tamano: 1024 }),
    ).toMatchObject({ tipoRecurso: "pdf", url: "https://x/a.pdf", tamano: 1024 })
  })

  it("cae al default si falta tipoRecurso", () => {
    expect(parseRecursoPayload({ url: "x" })).toEqual(defaultRecursoPayload())
  })
})

describe("jsonEquals", () => {
  it("compara objetos planos por valor", () => {
    expect(jsonEquals({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true)
  })

  it("detecta cambios en cualquier campo", () => {
    expect(jsonEquals({ a: 1 }, { a: 2 })).toBe(false)
  })

  it("es sensible al orden de claves (acepta — ambos lados se construyen igual)", () => {
    // Documenta el comportamiento: en F5.B siempre construimos el draft en el
    // mismo orden de claves que el initial, asi que esto no es problema. Si en
    // el futuro el orden divergiera, habria que migrar a fast-deep-equal.
    expect(jsonEquals({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(false)
  })
})

describe("defaults", () => {
  it("default lectura tiene cuerpo vacio", () => {
    expect(defaultLecturaPayload()).toEqual({ cuerpo: "" })
  })

  it("default video es youtube + url vacia", () => {
    expect(defaultVideoPayload()).toEqual({ url: "", proveedor: "youtube" })
  })

  it("default recurso es link", () => {
    expect(defaultRecursoPayload()).toEqual({ tipoRecurso: "link", url: "" })
  })
})
