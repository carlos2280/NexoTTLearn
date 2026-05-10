import { Injectable, type OnModuleDestroy } from "@nestjs/common"

// =============================================================================
// CACHE EN MEMORIA · uploads de Excel parseados
// PR 3b · MVP single-instance Railway. Los uploads viven 15 min en memoria
// del proceso. Migrar a Redis cuando escalemos a multi-instance.
// =============================================================================

const TTL_MS = 15 * 60 * 1000
const SWEEP_INTERVAL_MS = 5 * 60 * 1000

export interface CacheEntryFila {
  readonly email: string
  readonly nombre: string
  readonly notas: ReadonlyArray<{ readonly areaId: string; readonly valor: number | null }>
  readonly estado: "ok" | "warning" | "error"
  readonly mensajes: readonly string[]
}

interface CacheEntry {
  readonly cursoId: string
  readonly filas: readonly CacheEntryFila[]
  readonly expiresAt: number
}

@Injectable()
export class ExcelUploadCacheService implements OnModuleDestroy {
  private readonly entries = new Map<string, CacheEntry>()
  private readonly sweeper: NodeJS.Timeout

  constructor() {
    this.sweeper = setInterval(() => this.sweep(), SWEEP_INTERVAL_MS)
    // unref evita que el timer mantenga vivo el proceso al cerrar.
    this.sweeper.unref?.()
  }

  onModuleDestroy(): void {
    clearInterval(this.sweeper)
    this.entries.clear()
  }

  set(uploadId: string, cursoId: string, filas: readonly CacheEntryFila[]): void {
    this.entries.set(uploadId, {
      cursoId,
      filas,
      expiresAt: Date.now() + TTL_MS,
    })
  }

  // Devuelve la entry solo si no expiro y pertenece al cursoId indicado.
  // Si expiro, la borra. Si no pertenece al curso, NO la borra (otro curso
  // podria querer su propio upload con el mismo id, aunque la probabilidad es 0).
  get(uploadId: string, cursoId: string): CacheEntry | null {
    const entry = this.entries.get(uploadId)
    if (!entry) {
      return null
    }
    if (entry.expiresAt < Date.now()) {
      this.entries.delete(uploadId)
      return null
    }
    if (entry.cursoId !== cursoId) {
      return null
    }
    return entry
  }

  delete(uploadId: string): void {
    this.entries.delete(uploadId)
  }

  // Solo para tests: tamano actual del cache.
  size(): number {
    return this.entries.size
  }

  private sweep(): void {
    const now = Date.now()
    for (const [id, entry] of this.entries) {
      if (entry.expiresAt < now) {
        this.entries.delete(id)
      }
    }
  }
}
