import { randomBytes } from "node:crypto"
import { Injectable, Logger } from "@nestjs/common"

interface Challenge {
  readonly id: string
  readonly usuarioId: string
  readonly expiraEn: number
  intentos: number
}

const TTL_MS = 5 * 60 * 1000 // 5 minutos
const MAX_INTENTOS = 5
const CLEANUP_INTERVAL_MS = 60 * 1000 // 1 minuto

/**
 * MfaChallengeService — Gestor de challenges MFA temporales.
 *
 * Almacenamiento en memoria con TTL. Un challenge se crea tras login exitoso
 * (paso 1) cuando el usuario tiene MFA habilitado. Es single-use: tras un
 * verify exitoso se invalida. Tras 5 intentos fallidos se invalida.
 *
 * Para multi-instancia en produccion, este store debe migrar a Redis. La API
 * de este servicio esta disenada para ser drop-in compatible con un backend
 * Redis (todos los metodos son async-friendly).
 */
@Injectable()
export class MfaChallengeService {
  private readonly logger = new Logger(MfaChallengeService.name)
  private readonly store = new Map<string, Challenge>()
  private readonly cleanupTimer: NodeJS.Timeout

  constructor() {
    this.cleanupTimer = setInterval(() => this.purgarExpirados(), CLEANUP_INTERVAL_MS)
    this.cleanupTimer.unref()
  }

  crear(usuarioId: string): string {
    const id = randomBytes(32).toString("base64url")
    this.store.set(id, {
      id,
      usuarioId,
      expiraEn: Date.now() + TTL_MS,
      intentos: 0,
    })
    return id
  }

  obtener(id: string): Challenge | null {
    const challenge = this.store.get(id)
    if (!challenge) {
      return null
    }
    if (challenge.expiraEn < Date.now()) {
      this.store.delete(id)
      return null
    }
    return challenge
  }

  /** Registra intento fallido. Devuelve true si quedan intentos, false si se invalido. */
  registrarIntentoFallido(id: string): boolean {
    const challenge = this.obtener(id)
    if (!challenge) {
      return false
    }
    challenge.intentos += 1
    if (challenge.intentos >= MAX_INTENTOS) {
      this.store.delete(id)
      return false
    }
    return true
  }

  invalidar(id: string): void {
    this.store.delete(id)
  }

  private purgarExpirados(): void {
    const ahora = Date.now()
    let purgados = 0
    for (const [id, challenge] of this.store.entries()) {
      if (challenge.expiraEn < ahora) {
        this.store.delete(id)
        purgados += 1
      }
    }
    if (purgados > 0) {
      this.logger.debug(`Purgados ${purgados} challenges expirados`)
    }
  }
}
