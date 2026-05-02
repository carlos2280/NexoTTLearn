import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { MfaChallengeService } from "./mfa-challenge.service"

describe("MfaChallengeService", () => {
  let service: MfaChallengeService

  beforeEach(() => {
    vi.useFakeTimers()
    service = new MfaChallengeService()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe("crear", () => {
    it("genera un id unico (base64url, ~43 chars)", () => {
      const id = service.crear("usuario-1")
      expect(id).toMatch(/^[A-Za-z0-9_-]+$/)
      expect(id.length).toBeGreaterThan(40)
    })

    it("dos llamadas seguidas generan ids distintos", () => {
      const a = service.crear("usuario-1")
      const b = service.crear("usuario-1")
      expect(a).not.toBe(b)
    })
  })

  describe("obtener", () => {
    it("devuelve el challenge antes de expirar", () => {
      const id = service.crear("usuario-1")
      const challenge = service.obtener(id)
      expect(challenge).not.toBeNull()
      expect(challenge?.usuarioId).toBe("usuario-1")
      expect(challenge?.intentos).toBe(0)
    })

    it("devuelve null para id inexistente", () => {
      expect(service.obtener("not-a-real-id")).toBeNull()
    })

    it("devuelve null tras expirar (TTL 5min)", () => {
      const id = service.crear("usuario-1")
      vi.advanceTimersByTime(5 * 60_000 + 1)
      expect(service.obtener(id)).toBeNull()
    })

    it("sigue valido a 4:59min, expirado a 5:00min", () => {
      const id = service.crear("usuario-1")
      vi.advanceTimersByTime(5 * 60_000 - 1000)
      expect(service.obtener(id)).not.toBeNull()
      vi.advanceTimersByTime(2000)
      expect(service.obtener(id)).toBeNull()
    })
  })

  describe("registrarIntentoFallido", () => {
    it("incrementa intentos y devuelve true mientras quedan", () => {
      const id = service.crear("usuario-1")
      expect(service.registrarIntentoFallido(id)).toBe(true)
      expect(service.obtener(id)?.intentos).toBe(1)

      expect(service.registrarIntentoFallido(id)).toBe(true)
      expect(service.registrarIntentoFallido(id)).toBe(true)
      expect(service.registrarIntentoFallido(id)).toBe(true)
      expect(service.obtener(id)?.intentos).toBe(4)
    })

    it("al 5to intento devuelve false e invalida el challenge", () => {
      const id = service.crear("usuario-1")
      // 4 intentos previos sin invalidar
      for (let i = 0; i < 4; i++) {
        expect(service.registrarIntentoFallido(id)).toBe(true)
      }
      // El 5to invalida
      expect(service.registrarIntentoFallido(id)).toBe(false)
      // Ya no se puede recuperar
      expect(service.obtener(id)).toBeNull()
    })

    it("devuelve false si el challenge no existe", () => {
      expect(service.registrarIntentoFallido("no-existe")).toBe(false)
    })

    it("devuelve false si el challenge expiro", () => {
      const id = service.crear("usuario-1")
      vi.advanceTimersByTime(5 * 60_000 + 1)
      expect(service.registrarIntentoFallido(id)).toBe(false)
    })
  })

  describe("invalidar (single-use)", () => {
    it("borra el challenge y obtener devuelve null", () => {
      const id = service.crear("usuario-1")
      service.invalidar(id)
      expect(service.obtener(id)).toBeNull()
    })

    it("invalidar id inexistente no lanza error", () => {
      expect(() => service.invalidar("no-existe")).not.toThrow()
    })
  })

  describe("aislamiento entre usuarios", () => {
    it("challenges de usuarios distintos son independientes", () => {
      const idA = service.crear("usuario-A")
      const idB = service.crear("usuario-B")

      service.registrarIntentoFallido(idA)
      service.registrarIntentoFallido(idA)

      expect(service.obtener(idA)?.intentos).toBe(2)
      expect(service.obtener(idB)?.intentos).toBe(0)
    })
  })
})
