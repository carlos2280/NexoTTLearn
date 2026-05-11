import type { ThrottlerStorage } from "@nestjs/throttler"

interface ThrottlerStorageRecord {
  readonly totalHits: number
  readonly timeToExpire: number
  readonly isBlocked: boolean
  readonly timeToBlockExpire: number
}

/**
 * `ThrottlerStorageFake` — backend en memoria para el ThrottlerGuard usado en
 * tests e2e. Sustituye al storage real (`ThrottlerStorageService`) que la
 * libreria registra por defecto. Expone `reset()` para limpiar buckets entre
 * suites sin esperas reales (cierra §5.69 — elimina `setTimeout(61_000)` que
 * el chat hijo de P5c introdujo como salida pragmatica).
 *
 * El override `overrideGuard(ThrottlerGuard)` NO neutraliza el decorator
 * `@Throttle({...})` a nivel handler porque ese decorator instancia su propio
 * guard. Reemplazar el storage es el unico punto que toca AMBOS caminos.
 */
export class ThrottlerStorageFake implements ThrottlerStorage {
  private readonly buckets = new Map<string, { hits: number; expiresAt: number }>()

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    _throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const now = Date.now()
    const existing = this.buckets.get(key)
    if (!existing || existing.expiresAt <= now) {
      const expiresAt = now + ttl
      this.buckets.set(key, { hits: 1, expiresAt })
      return {
        totalHits: 1,
        timeToExpire: ttl,
        isBlocked: false,
        timeToBlockExpire: 0,
      }
    }
    existing.hits += 1
    const timeToExpire = existing.expiresAt - now
    const isBlocked = existing.hits > limit
    return {
      totalHits: existing.hits,
      timeToExpire,
      isBlocked,
      timeToBlockExpire: isBlocked ? blockDuration : 0,
    }
  }

  reset(): void {
    this.buckets.clear()
  }
}
