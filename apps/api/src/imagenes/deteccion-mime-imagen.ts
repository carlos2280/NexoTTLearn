/**
 * Detecta el MIME real de una imagen por sus *magic bytes* (firma binaria),
 * ignorando el `Content-Type` que declara el cliente. Es la defensa contra
 * subir un ejecutable renombrado a `.png`: el endpoint guarda y sirve segun el
 * contenido real, no segun lo que dice el navegador. Solo reconoce los tipos
 * de la whitelist (PNG, JPEG, WebP, GIF); cualquier otra cosa devuelve `null`.
 */
export function detectarMimeImagen(buffer: Buffer): string | null {
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png"
  }
  // JPEG: FF D8 FF
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg"
  }
  // GIF: "GIF87a" o "GIF89a"
  if (buffer.length >= 6) {
    const encabezado = buffer.toString("ascii", 0, 6)
    if (encabezado === "GIF87a" || encabezado === "GIF89a") {
      return "image/gif"
    }
  }
  // WebP: "RIFF" .... "WEBP"
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp"
  }
  return null
}
