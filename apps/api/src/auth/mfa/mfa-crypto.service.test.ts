import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { MfaCryptoService } from "./mfa-crypto.service"

const VALID_KEY = "x".repeat(32)
const SHORT_KEY = "x".repeat(31)

describe("MfaCryptoService", () => {
  let service: MfaCryptoService
  let originalEnv: string | undefined

  beforeEach(() => {
    originalEnv = process.env.MFA_ENCRYPTION_KEY
    process.env.MFA_ENCRYPTION_KEY = VALID_KEY
    service = new MfaCryptoService()
    service.onModuleInit()
  })

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.MFA_ENCRYPTION_KEY
    } else {
      process.env.MFA_ENCRYPTION_KEY = originalEnv
    }
  })

  describe("onModuleInit", () => {
    it("falla si MFA_ENCRYPTION_KEY no esta definida", () => {
      delete process.env.MFA_ENCRYPTION_KEY
      const fresh = new MfaCryptoService()
      expect(() => fresh.onModuleInit()).toThrow(/MFA_ENCRYPTION_KEY/)
    })

    it("falla si la clave tiene menos de 32 caracteres", () => {
      process.env.MFA_ENCRYPTION_KEY = SHORT_KEY
      const fresh = new MfaCryptoService()
      expect(() => fresh.onModuleInit()).toThrow(/al menos 32/)
    })

    it("acepta exactamente 32 caracteres", () => {
      process.env.MFA_ENCRYPTION_KEY = VALID_KEY
      const fresh = new MfaCryptoService()
      expect(() => fresh.onModuleInit()).not.toThrow()
    })
  })

  describe("encrypt / decrypt round-trip", () => {
    it("recupera el plaintext exacto", () => {
      const plaintext = "JBSWY3DPEHPK3PXP"
      const cipher = service.encrypt(plaintext)
      expect(service.decrypt(cipher)).toBe(plaintext)
    })

    it("genera ciphertext distinto para el mismo plaintext (IV aleatorio)", () => {
      const plaintext = "secret-value-123"
      const c1 = service.encrypt(plaintext)
      const c2 = service.encrypt(plaintext)
      expect(c1).not.toBe(c2)
      // pero ambos descifran al mismo valor
      expect(service.decrypt(c1)).toBe(plaintext)
      expect(service.decrypt(c2)).toBe(plaintext)
    })

    it("soporta strings vacios", () => {
      const cipher = service.encrypt("")
      expect(service.decrypt(cipher)).toBe("")
    })

    it("soporta caracteres unicode", () => {
      const plaintext = "contraseña con ñ y emoji 🔐"
      const cipher = service.encrypt(plaintext)
      expect(service.decrypt(cipher)).toBe(plaintext)
    })
  })

  describe("decrypt — proteccion ante manipulacion", () => {
    it("falla si el ciphertext fue alterado (auth tag verification)", () => {
      const cipher = service.encrypt("valor-original")
      // Flip un bit en la mitad del payload base64 (afecta ciphertext, no IV)
      const buffer = Buffer.from(cipher, "base64")
      const idx = buffer.length - 5
      buffer[idx] = (buffer[idx] ?? 0) ^ 0xff
      const tampered = buffer.toString("base64")
      expect(() => service.decrypt(tampered)).toThrow()
    })

    it("falla si la clave es distinta", () => {
      const cipher = service.encrypt("valor")
      // Re-init con clave distinta
      process.env.MFA_ENCRYPTION_KEY = "y".repeat(32)
      const otra = new MfaCryptoService()
      otra.onModuleInit()
      expect(() => otra.decrypt(cipher)).toThrow()
    })
  })
})
