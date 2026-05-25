import { Injectable, Logger } from "@nestjs/common"
import { AccionAuditoria, EstadoAsignado, RolAsignacion } from "@prisma/client"
import { AuditLogService } from "../common/audit/audit-log.service"
import { PrismaService } from "../common/prisma/prisma.service"
import { PlanPersonalService } from "./plan-personal.service"

export interface RecalcularMasivoResultado {
  readonly cursoId: string
  readonly total: number
  readonly recalculadas: number
  readonly fallidas: number
  readonly duracionMs: number
}

/**
 * Service del modulo `plan-personal` — sub-dominio "recalculo batch".
 *
 * Extraido de `PlanPersonalService` (Fase 1.1 del plan de auditoria) para
 * aislar la operacion masiva que itera sobre todas las asignaciones ASIGNADO
 * activas de un curso y delega cada recalculo individual al motor existente
 * en `PlanPersonalService.recalcular`.
 *
 * Disenado para crecer: si en el futuro aparecen otros recalculos batch
 * (p.ej. por colaborador, por modulo, programados), conviven aqui sin
 * empujar mas codigo al service principal.
 */
@Injectable()
export class PlanPersonalRecalculoService {
  private readonly logger = new Logger(PlanPersonalRecalculoService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly planPersonal: PlanPersonalService,
  ) {}

  /**
   * `POST /cursos/:cursoId/planes/recalcular-masivo` (FIX-pre-S12) — ADMIN.
   * Recalcula todas las asignaciones ASIGNADO no-terminales del curso. Cada
   * recalculo va con try/catch individual (R-S10-2): un fallo aislado no
   * rompe el batch. No audit por-asignacion duplicado (cada `recalcular`
   * ya emite `PLAN_RECALCULADO`); el resumen agregado se audita con
   * `PLAN_RECALCULADO_MASIVO` (D-S12-D3).
   */
  async recalcularMasivo(
    cursoId: string,
    autorUsuarioId: string,
  ): Promise<RecalcularMasivoResultado> {
    const inicio = Date.now()
    const asignaciones = await this.prisma.asignacionCurso.findMany({
      where: {
        cursoId,
        rol: RolAsignacion.ASIGNADO,
        estadoAsignado: {
          in: [EstadoAsignado.ASIGNADO, EstadoAsignado.EN_PROGRESO, EstadoAsignado.LISTO],
        },
      },
      select: { id: true },
    })
    let recalculadas = 0
    let fallidas = 0
    for (const { id } of asignaciones) {
      try {
        await this.planPersonal.recalcular(id, autorUsuarioId, "RECALCULO_MASIVO")
        recalculadas += 1
      } catch (error) {
        fallidas += 1
        const detalle = error instanceof Error ? error.message : String(error)
        this.logger.warn(
          `recalcularMasivo | curso=${cursoId} | asignacion=${id} | fallo=${detalle}`,
        )
      }
    }
    const duracionMs = Date.now() - inicio
    await this.auditLog.record({
      usuarioId: autorUsuarioId,
      accion: AccionAuditoria.PLAN_RECALCULADO_MASIVO,
      exito: true,
      recursoTipo: "curso",
      recursoId: cursoId,
      metadata: {
        cursoId,
        total: asignaciones.length,
        recalculadas,
        fallidas,
        duracionMs,
      },
    })
    return {
      cursoId,
      total: asignaciones.length,
      recalculadas,
      fallidas,
      duracionMs,
    }
  }
}
