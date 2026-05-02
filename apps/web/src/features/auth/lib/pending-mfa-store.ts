// Estado transitorio del paso 1->2 del login con MFA. Vive solo en sessionStorage
// para que un refresh pueda recuperar el challengeId, pero al cerrar la pestana
// se limpia. El challengeId es un token de un solo uso emitido por el backend
// con TTL 5 min.
//
// SECURITY: en modo "setup" el secret y el otpauthUri estan en memoria del browser.
// Es un trade-off conocido (el usuario podria refrescar la pagina mientras escanea).
// Ya esta sobre HTTPS, ya el secret se regenera en cada nuevo intento de setup,
// y el storage se limpia al confirmar o cancelar.
import { z } from "zod"

const STORAGE_KEY = "nexott:pending-mfa"

const verifyPendingSchema = z.object({
  mode: z.literal("verify"),
  challengeId: z.string().min(1),
  emailEnmascarado: z.string().min(1),
  iniciadoEn: z.number().int().nonnegative(),
})

const setupPendingSchema = z.object({
  mode: z.literal("setup"),
  challengeId: z.string().min(1),
  emailEnmascarado: z.string().min(1),
  secret: z.string().min(1),
  otpauthUri: z.string().min(1),
  iniciadoEn: z.number().int().nonnegative(),
})

const pendingMfaSchema = z.discriminatedUnion("mode", [verifyPendingSchema, setupPendingSchema])

export type PendingMfa = z.infer<typeof pendingMfaSchema>
export type PendingMfaVerify = z.infer<typeof verifyPendingSchema>
export type PendingMfaSetup = z.infer<typeof setupPendingSchema>

const TTL_MS = 5 * 60 * 1000

type PendingMfaInput = Omit<PendingMfaVerify, "iniciadoEn"> | Omit<PendingMfaSetup, "iniciadoEn">

export const pendingMfaStore = {
  set(data: PendingMfaInput): void {
    const payload = { ...data, iniciadoEn: Date.now() } as PendingMfa
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  },

  get(): PendingMfa | null {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return null
    }
    try {
      const parsed = pendingMfaSchema.safeParse(JSON.parse(raw))
      if (!parsed.success) {
        sessionStorage.removeItem(STORAGE_KEY)
        return null
      }
      if (Date.now() - parsed.data.iniciadoEn > TTL_MS) {
        sessionStorage.removeItem(STORAGE_KEY)
        return null
      }
      return parsed.data
    } catch {
      sessionStorage.removeItem(STORAGE_KEY)
      return null
    }
  },

  clear(): void {
    sessionStorage.removeItem(STORAGE_KEY)
  },
}
