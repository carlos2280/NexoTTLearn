import { describe, expect, it } from "vitest"
import { computePreviewState } from "./bloque-video"
import { detectVideoProvider } from "./detect-video-provider"

function preview(url: string, proveedor: "youtube" | "vimeo" | "interno") {
  return computePreviewState(url, proveedor, detectVideoProvider(url))
}

describe("computePreviewState", () => {
  it("empty cuando la URL esta vacia", () => {
    expect(preview("", "youtube")).toEqual({ kind: "empty" })
  })

  it("interno renderiza la URL tal cual cuando el proveedor es interno", () => {
    expect(preview("https://cdn.foo/clase.mp4", "interno")).toEqual({
      kind: "interno",
      url: "https://cdn.foo/clase.mp4",
    })
  })

  it("youtube valido devuelve youtube + videoId", () => {
    expect(preview("https://www.youtube.com/watch?v=dQw4w9WgXcQ", "youtube")).toEqual({
      kind: "youtube",
      videoId: "dQw4w9WgXcQ",
    })
  })

  it("vimeo valido devuelve vimeo + videoId", () => {
    expect(preview("https://vimeo.com/76543210", "vimeo")).toEqual({
      kind: "vimeo",
      videoId: "76543210",
    })
  })

  it("mismatch cuando URL es youtube pero proveedor es vimeo", () => {
    expect(preview("https://youtu.be/abcDEF12345", "vimeo")).toEqual({ kind: "mismatch" })
  })

  it("mismatch cuando URL no es del proveedor (interno-like + youtube)", () => {
    expect(preview("https://example.com/clase.mp4", "youtube")).toEqual({ kind: "mismatch" })
  })

  it("invalid cuando proveedor youtube pero id corto", () => {
    expect(preview("https://youtu.be/abc", "youtube")).toEqual({ kind: "invalid" })
  })
})
