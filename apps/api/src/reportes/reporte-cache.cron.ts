import { Injectable, Logger } from "@nestjs/common"
import { Cron } from "@nestjs/schedule"
import { TipoReporteCache } from "@prisma/client"
import { ReporteCacheService } from "./reporte-cache.service"
import { ReportesService } from "./reportes.service"

const CRON_EXPRESSION_DEFAULT = "0 3 * * *"
const LIMITE_SCOPES_POR_TIPO = 50

// Las keys mapean valores del enum Prisma `TipoReporteCache`, definido en
// SCREAMING_SNAKE_CASE. Cambiar a camelCase rompe el indice por valor enum.
const ENDPOINT_POR_TIPO: Record<TipoReporteCache, string> = {
  // biome-ignore lint/style/useNamingConvention: clave es valor de enum Prisma.
  EFICACIA_PLATAFORMA: "/reportes/eficacia-plataforma",
  // biome-ignore lint/style/useNamingConvention: clave es valor de enum Prisma.
  HISTORICO_CLIENTE: "/reportes/historico-cliente",
  // biome-ignore lint/style/useNamingConvention: clave es valor de enum Prisma.
  INVENTARIO_SKILLS: "/reportes/inventario-skills",
  // biome-ignore lint/style/useNamingConvention: clave es valor de enum Prisma.
  REUTILIZACION_CATALOGO: "/reportes/reutilizacion-catalogo",
}

/**
 * `ReporteCacheCron` — D-S11-C2.
 *
 * Cron nocturno (default 03:00) que recalienta los top-N `scope_hash` mas
 * consultados en los ultimos 30 dias para cada tipo de reporte estrategico.
 * Cada `(tipo, scope)` se envuelve en try/catch para que un fallo aislado no
 * detenga el resto del recalculo.
 *
 * La expresion cron se lee de `process.env.REPORTE_CACHE_CRON` en tiempo de
 * carga del modulo (decorador `@Cron` evaluado al definir la clase).
 */
@Injectable()
export class ReporteCacheCron {
  private readonly logger = new Logger(ReporteCacheCron.name)

  constructor(
    private readonly cache: ReporteCacheService,
    private readonly reportesService: ReportesService,
  ) {}

  @Cron(process.env.REPORTE_CACHE_CRON ?? CRON_EXPRESSION_DEFAULT)
  async ejecutar(): Promise<void> {
    const inicio = Date.now()
    let recalculados = 0
    let errores = 0

    for (const tipo of Object.values(TipoReporteCache)) {
      const endpoint = ENDPOINT_POR_TIPO[tipo]
      const scopes = await this.cache.listarTopScopesActivos(endpoint, LIMITE_SCOPES_POR_TIPO)
      for (const { queryParams } of scopes) {
        try {
          await this.reportesService.recalcularYGuardarPorTipo(tipo, queryParams)
          recalculados += 1
        } catch (err) {
          errores += 1
          const detalle = err instanceof Error ? err.message : String(err)
          this.logger.error(`Recalculo fallo tipo=${tipo}: ${detalle}`)
        }
      }
    }

    const duracionMs = Date.now() - inicio
    this.logger.log(
      `reporte-cache | recalculados=${recalculados} | errores=${errores} | duracionMs=${duracionMs}`,
    )
  }
}
