import { describe, expect, it } from "vitest"
import { detectarMimeImagen } from "./deteccion-mime-imagen"

describe("detectarMimeImagen", () => {
  it("reconoce PNG por su firma completa", () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x01])
    expect(detectarMimeImagen(png)).toBe("image/png")
  })

  it("reconoce JPEG", () => {
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10])
    expect(detectarMimeImagen(jpeg)).toBe("image/jpeg")
  })

  it("reconoce GIF87a y GIF89a", () => {
    expect(detectarMimeImagen(Buffer.from("GIF87a....", "ascii"))).toBe("image/gif")
    expect(detectarMimeImagen(Buffer.from("GIF89a....", "ascii"))).toBe("image/gif")
  })

  it("reconoce WebP (RIFF....WEBP)", () => {
    const webp = Buffer.concat([
      Buffer.from("RIFF", "ascii"),
      Buffer.from([0x00, 0x00, 0x00, 0x00]),
      Buffer.from("WEBP", "ascii"),
    ])
    expect(detectarMimeImagen(webp)).toBe("image/webp")
  })

  it("devuelve null para un ejecutable renombrado (no es imagen real)", () => {
    // Un binario cualquiera (p. ej. cabecera ELF) con extensión .png no cuela.
    const elf = Buffer.from([0x7f, 0x45, 0x4c, 0x46, 0x02, 0x01, 0x01, 0x00])
    expect(detectarMimeImagen(elf)).toBeNull()
  })

  it("devuelve null para SVG (texto), que no está permitido", () => {
    expect(detectarMimeImagen(Buffer.from("<svg xmlns=", "ascii"))).toBeNull()
  })

  it("no revienta con un buffer más corto que las firmas", () => {
    expect(detectarMimeImagen(Buffer.from([0xff]))).toBeNull()
    expect(detectarMimeImagen(Buffer.alloc(0))).toBeNull()
  })
})
