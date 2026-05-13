import { Injectable, Logger } from "@nestjs/common"
import { Cron } from "@nestjs/schedule"
import { Prisma, TipoEventoNotif } from "@prisma/client"
import { PrismaService } from "../../common/prisma/prisma.service"
import { broadcastAdminsActivos, yaEmitidoHoy } from "../notificaciones.helpers"
import { NotificacionesService } from "../notificaciones.service"

const CRON_EXPRESSION_DEFAULT = "0 8 * * *"

/**
 * `CentroRevisionCron` — Slice 11.5 P11.5c (D-S11.5-C3, D-S11.5-C4).
 *
 * Cron diario (default 08:00 UTC) que cuenta los pendientes del Centro de
 * revision y si el total >= 1 emite `CENTRO_REVISION` como broadcast a admins
 * activos (helper `broadcastAdminsActivos`). Si total = 0, NO emite (R-S11.5-5).
 *
 * DE-P11.5c-1: la fuente del conteo replica los filtros de
 * `ReportesService.obtenerCentroRevision()` mediante 2 `count` directos sobre
 * Prisma. NO se importa `ReportesModule` para evitar el ciclo
 * `NotificacionesModule <-> ReportesModule` (ReportesModule -> PlanPersonalModule
 * -> NotificacionesModule). La semantica es identica: capas pendientes en
 * transversales EVALUADO + ajuste admin pendiente en entrevistas FINALIZADO.
 *
 * Idempotencia diaria por `(tipo, dia)` sin discriminante de usuario via helper
 * `yaEmitidoHoy(prisma, tipo, null, hoy)`. Si ya existe una fila del dia, NO
 * reemite (D-S11.5-C5). Best-effort: try/catch global en el handler — un fallo
 * del cron loggea `Logger.warn` y no propaga.
 */
@Injectable()
export class CentroRevisionCron {
  private readonly logger = new Logger(CentroRevisionCron.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificaciones: NotificacionesService,
  ) {}

  @Cron(process.env.CENTRO_REVISION_CRON ?? CRON_EXPRESSION_DEFAULT)
  async ejecutar(): Promise<void> {
    const inicio = Date.now()
    const hoy = new Date()

    try {
      const yaExiste = await yaEmitidoHoy(this.prisma, TipoEventoNotif.CENTRO_REVISION, null, hoy)
      if (yaExiste) {
        const duracionMs = Date.now() - inicio
        this.logger.log(`cron | centro-revision | omitido=idempotencia | duracionMs=${duracionMs}`)
        return
      }

      const [transversales, entrevistasIa] = await Promise.all([
        this.contarTransversalesPendientes(),
        this.contarEntrevistasPendientes(),
      ])
      const totalPendientes = transversales + entrevistasIa

      if (totalPendientes < 1) {
        const duracionMs = Date.now() - inicio
        this.logger.log(`cron | centro-revision | digest sin items | duracionMs=${duracionMs}`)
        return
      }

      const fechaCorte = hoy.toISOString().slice(0, 10)
      await broadcastAdminsActivos(
        this.prisma,
        this.notificaciones,
        this.logger,
        TipoEventoNotif.CENTRO_REVISION,
        {
          totalPendientes,
          porTipo: { transversales, entrevistasIa },
          fechaCorte,
        },
      )

      const duracionMs = Date.now() - inicio
      this.logger.log(
        `cron | centro-revision | total=${totalPendientes} | transv=${transversales} | entrev=${entrevistasIa} | duracionMs=${duracionMs}`,
      )
    } catch (error) {
      const detalle = error instanceof Error ? error.message : String(error)
      this.logger.warn(`cron | centro-revision | fallo | error=${detalle}`)
    }
  }

  private contarTransversalesPendientes(): Promise<number> {
    return this.prisma.intentoTransversal.count({
      where: {
        estado: "EVALUADO",
        // biome-ignore lint/style/useNamingConvention: `OR` es operador Prisma, no clave de dominio.
        OR: [{ notaCapaTests: null }, { notaCapaCualitativa: null }, { notaCapaComprension: null }],
      } satisfies Prisma.IntentoTransversalWhereInput,
    })
  }

  private contarEntrevistasPendientes(): Promise<number> {
    return this.prisma.intentoEntrevistaIA.count({
      where: {
        estado: "FINALIZADO",
        notaAjustadaAdmin: null,
      } satisfies Prisma.IntentoEntrevistaIAWhereInput,
    })
  }
}
