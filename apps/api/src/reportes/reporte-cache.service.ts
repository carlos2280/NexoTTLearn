import { createHash } from "node:crypto"
import { Injectable } from "@nestjs/common"
import { type Prisma, TipoReporteCache } from "@prisma/client"
import { PrismaService } from "../common/prisma/prisma.service"

const FRESCURA_MS = 24 * 60 * 60 * 1000 // 24h — D-S11-C2

/**
 * `ReporteCacheService` — D-S11-C1, D-S11-C2.
 *
 * Cache batch via tabla `reporte_cache` con lookup O(1) por `scope_hash`. La
 * estrategia es lazy revalidate-on-miss:
 *   - `obtener` devuelve el `payload` si la entrada existe y `generadaAt`
 *     esta dentro de `FRESCURA_MS` (24h). Si esta vencida o no existe,
 *     devuelve `null` y el caller recalcula.
 *   - `guardar` hace UPSERT por `scope_hash` (Prisma `upsert`).
 *
 * El hash se calcula sobre el JSON canonico del scope (keys ordenadas
 * recursivamente) para asegurar que el orden de los parametros no produce
 * scopes distintos.
 */
@Injectable()
export class ReporteCacheService {
  constructor(private readonly prisma: PrismaService) {}

  calcularScopeHash(scope: Record<string, unknown>): string {
    const canonical = canonicalize(scope)
    return createHash("sha256").update(canonical).digest("hex")
  }

  async obtener<T>(
    tipo: TipoReporteCache,
    scope: Record<string, unknown>,
  ): Promise<{ payload: T; frescura: Date; scopeHash: string } | null> {
    const scopeHash = this.calcularScopeHash(scope)
    const fila = await this.prisma.reporteCache.findUnique({
      where: { scopeHash },
      select: { tipo: true, payload: true, generadaAt: true },
    })
    if (!fila || fila.tipo !== tipo) {
      return null
    }
    const vencida = Date.now() - fila.generadaAt.getTime() > FRESCURA_MS
    if (vencida) {
      return null
    }
    return {
      payload: fila.payload as T,
      frescura: fila.generadaAt,
      scopeHash,
    }
  }

  async guardar(
    tipo: TipoReporteCache,
    scope: Record<string, unknown>,
    payload: unknown,
  ): Promise<{ frescura: Date; scopeHash: string }> {
    const scopeHash = this.calcularScopeHash(scope)
    const ahora = new Date()
    await this.prisma.reporteCache.upsert({
      where: { scopeHash },
      create: {
        tipo,
        scopeHash,
        scope: scope as Prisma.InputJsonValue,
        payload: payload as Prisma.InputJsonValue,
        generadaAt: ahora,
      },
      update: {
        tipo,
        scope: scope as Prisma.InputJsonValue,
        payload: payload as Prisma.InputJsonValue,
        generadaAt: ahora,
      },
    })
    return { frescura: ahora, scopeHash }
  }

  /**
   * Devuelve los `scope_hash` mas consultados en los ultimos 30 dias para un
   * endpoint dado (lookup en `consultas_logs.endpoint`). Lo usa el cron
   * nocturno para identificar que reportes precalentar. Limitado a `limite`
   * filas (default 50). Las filas se ordenan por count desc.
   */
  async listarTopScopesActivos(
    endpoint: string,
    limite: number,
  ): Promise<{ scopeHash: string; queryParams: Record<string, unknown> }[]> {
    const fechaCorte = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const filas = await this.prisma.consultaLog.findMany({
      where: { endpoint, fecha: { gte: fechaCorte } },
      select: { queryParams: true },
      orderBy: { fecha: "desc" },
      take: limite,
    })
    const vistos = new Set<string>()
    const resultado: { scopeHash: string; queryParams: Record<string, unknown> }[] = []
    for (const fila of filas) {
      const params = isRecord(fila.queryParams) ? fila.queryParams : {}
      const hash = this.calcularScopeHash(params)
      if (!vistos.has(hash)) {
        vistos.add(hash)
        resultado.push({ scopeHash: hash, queryParams: params })
      }
    }
    return resultado
  }
}

function canonicalize(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value)
  }
  if (Array.isArray(value)) {
    return `[${value.map((v) => canonicalize(v)).join(",")}]`
  }
  const keys = Object.keys(value as Record<string, unknown>).sort()
  const parts = keys.map((k) => {
    const child = (value as Record<string, unknown>)[k]
    return `${JSON.stringify(k)}:${canonicalize(child)}`
  })
  return `{${parts.join(",")}}`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}
