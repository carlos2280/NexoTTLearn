import { describe, expect, it } from "vitest"
import { detectVideoProvider } from "./detect-video-provider"

describe("detectVideoProvider", () => {
  it("retorna interno con id null para string vacio", () => {
    expect(detectVideoProvider("")).toEqual({ proveedor: "interno", videoId: null })
  })

  it("retorna interno con id null para URL malformada", () => {
    expect(detectVideoProvider("no-es-una-url")).toEqual({
      proveedor: "interno",
      videoId: null,
    })
  })

  it("retorna interno para URL absoluta no reconocida", () => {
    expect(detectVideoProvider("https://example.com/clase.mp4")).toEqual({
      proveedor: "interno",
      videoId: null,
    })
  })

  it("detecta youtube watch?v=ID", () => {
    expect(detectVideoProvider("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toEqual({
      proveedor: "youtube",
      videoId: "dQw4w9WgXcQ",
    })
  })

  it("detecta youtube short youtu.be/ID", () => {
    expect(detectVideoProvider("https://youtu.be/abcDEF12345")).toEqual({
      proveedor: "youtube",
      videoId: "abcDEF12345",
    })
  })

  it("detecta youtube embed/ID", () => {
    expect(detectVideoProvider("https://www.youtube.com/embed/abcDEF_-345")).toEqual({
      proveedor: "youtube",
      videoId: "abcDEF_-345",
    })
  })

  it("ignora padding en la URL (espacios)", () => {
    expect(detectVideoProvider("  https://youtu.be/abcDEF12345  ")).toEqual({
      proveedor: "youtube",
      videoId: "abcDEF12345",
    })
  })

  it("detecta youtube como proveedor aun si el id es invalido", () => {
    // host valido pero id corto -> proveedor youtube, videoId null. La preview
    // mostrara mensaje de "URL no valida" en lugar de cargar el iframe.
    expect(detectVideoProvider("https://youtu.be/abc")).toEqual({
      proveedor: "youtube",
      videoId: null,
    })
  })

  it("detecta vimeo.com/ID", () => {
    expect(detectVideoProvider("https://vimeo.com/123456789")).toEqual({
      proveedor: "vimeo",
      videoId: "123456789",
    })
  })

  it("detecta vimeo player.vimeo.com/video/ID", () => {
    expect(detectVideoProvider("https://player.vimeo.com/video/76543210")).toEqual({
      proveedor: "vimeo",
      videoId: "76543210",
    })
  })

  it("vimeo con id no numerico cae como vimeo+null", () => {
    expect(detectVideoProvider("https://vimeo.com/usuario")).toEqual({
      proveedor: "vimeo",
      videoId: null,
    })
  })

  it("acepta youtube.com sin www", () => {
    expect(detectVideoProvider("https://youtube.com/watch?v=zZZzzZZzZZz")).toEqual({
      proveedor: "youtube",
      videoId: "zZZzzZZzZZz",
    })
  })
})
