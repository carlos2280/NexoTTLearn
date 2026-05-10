import { ConfigService } from "@nestjs/config"
import { describe, expect, it } from "vitest"
import { CifradoService } from "./cifrado.service"

const KEY_HEX_VALIDA = "a".repeat(64)
const KEY_HEX_INVALIDA = "a".repeat(62)

function buildService(hexKey: string = KEY_HEX_VALIDA): CifradoService {
  const config = {
    get: (clave: string): string => {
      if (clave === "SECRETS_ENCRYPTION_KEY") {
        return hexKey
      }
      throw new Error(`clave inesperada: ${clave}`)
    },
  } as unknown as ConfigService<Record<string, unknown>, true>
  return new CifradoService(config)
}

describe("CifradoService", () => {
  it("round-trip: desencriptar(encriptar(x)) === x", () => {
    const service = buildService()
    const plaintext = "JBSWY3DPEHPK3PXP" // formato base32 estilo otplib secret
    const cifrado = service.encriptar(plaintext)
    expect(service.desencriptar(cifrado)).toBe(plaintext)
  })

  it("dos cifrados del mismo plaintext producen ciphertexts distintos (IV unico)", () => {
    const service = buildService()
    const plaintext = "secret-mfa-en-base32"
    const a = service.encriptar(plaintext)
    const b = service.encriptar(plaintext)
    expect(a).not.toBe(b)
    expect(service.desencriptar(a)).toBe(plaintext)
    expect(service.desencriptar(b)).toBe(plaintext)
  })

  it("tampering del tag de autenticacion lanza error", () => {
    const service = buildService()
    const cifrado = service.encriptar("plain")
    const buf = Buffer.from(cifrado, "base64")
    // Voltear el ultimo byte (parte del tag, los 16 finales)
    const idx = buf.length - 1
    const original = buf[idx] ?? 0
    buf[idx] = original ^ 0x01
    const corrupto = buf.toString("base64")
    expect(() => service.desencriptar(corrupto)).toThrow()
  })

  it("tampering del ciphertext lanza error", () => {
    const service = buildService()
    const cifrado = service.encriptar("plain-mas-largo-que-1-byte")
    const buf = Buffer.from(cifrado, "base64")
    // Voltear un byte intermedio (12..buf.length-16 = ciphertext)
    const idxIntermedio = 12 + 2
    const original = buf[idxIntermedio] ?? 0
    buf[idxIntermedio] = original ^ 0x01
    const corrupto = buf.toString("base64")
    expect(() => service.desencriptar(corrupto)).toThrow()
  })

  it("payload cifrado mas corto que iv+tag (28 bytes) lanza error", () => {
    const service = buildService()
    const corto = Buffer.alloc(20).toString("base64")
    expect(() => service.desencriptar(corto)).toThrow(/longitud insuficiente/)
  })

  it("clave de longitud invalida en el constructor lanza error", () => {
    expect(() => buildService(KEY_HEX_INVALIDA)).toThrow(/SECRETS_ENCRYPTION_KEY/)
  })
})
