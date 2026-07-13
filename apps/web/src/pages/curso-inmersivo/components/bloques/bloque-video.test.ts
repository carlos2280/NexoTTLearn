import { describe, expect, it } from "vitest"
import { embedUrl } from "./bloque-video"

describe("embedUrl", () => {
  describe("youtube", () => {
    it("deriva el embed desde una URL watch?v= y añade rel=0", () => {
      expect(embedUrl("https://www.youtube.com/watch?v=xv0Be4QfkH0", "youtube")).toBe(
        "https://www.youtube.com/embed/xv0Be4QfkH0?rel=0",
      )
    })

    it("deriva el embed desde una URL corta youtu.be", () => {
      expect(embedUrl("https://youtu.be/xv0Be4QfkH0", "youtube")).toBe(
        "https://www.youtube.com/embed/xv0Be4QfkH0?rel=0",
      )
    })

    it("deriva el embed desde una URL /embed/ ya canónica", () => {
      expect(embedUrl("https://www.youtube.com/embed/xv0Be4QfkH0", "youtube")).toBe(
        "https://www.youtube.com/embed/xv0Be4QfkH0?rel=0",
      )
    })

    it("deriva el embed desde una URL /shorts/", () => {
      expect(embedUrl("https://www.youtube.com/shorts/xv0Be4QfkH0", "youtube")).toBe(
        "https://www.youtube.com/embed/xv0Be4QfkH0?rel=0",
      )
    })

    it("devuelve null si no hay ID derivable", () => {
      expect(embedUrl("https://www.youtube.com/", "youtube")).toBeNull()
    })
  })

  it("deriva el embed de vimeo", () => {
    expect(embedUrl("https://vimeo.com/123456789", "vimeo")).toBe(
      "https://player.vimeo.com/video/123456789",
    )
  })

  it("deriva el embed de loom", () => {
    expect(embedUrl("https://www.loom.com/share/abc123def456", "loom")).toBe(
      "https://www.loom.com/embed/abc123def456",
    )
  })

  it("devuelve null para el proveedor 'otro' (cae al <video> nativo)", () => {
    expect(embedUrl("https://cdn.ejemplo.com/video.mp4", "otro")).toBeNull()
  })

  it("devuelve null ante una URL inválida", () => {
    expect(embedUrl("no-es-una-url", "youtube")).toBeNull()
  })
})
