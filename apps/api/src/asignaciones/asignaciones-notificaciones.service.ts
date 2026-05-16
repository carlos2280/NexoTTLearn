import { Injectable, Logger } from "@nestjs/common"
import { TipoEventoNotif } from "@prisma/client"
import { PrismaService } from "../common/prisma/prisma.service"
import { broadcastAdminsActivos } from "../notificaciones/notificaciones.helpers"
import { NotificacionesService } from "../notificaciones/notificaciones.service"
import { ResultadoCierre } from "../notificaciones/payload/resultado-cierre.payload"

/**
 * Sub-service de `AsignacionesService` (extraido para reducir el god service —
 * Fase 1.1 del plan de auditoria). Encapsula los 5 triggers de notificacion
 * disparados por transiciones de la asignacion (RESULTADO_CIERRE,
 * ASIGNACION_CURSO, CASO_REABIERTO, COLABORADOR_LISTO y
 * PLANES_DESACTUALIZADOS por reabrir).
 *
 * Contrato compartido en todos los metodos (D-S11.5-A*, R-S10-2, R-S11.5-2):
 *  - Identidad del destinatario derivada del recurso (NUNCA del body — A01).
 *  - `findUnique` proyectando solo los campos necesarios.
 *  - Best-effort: cualquier error se loggea y NO se propaga al admin/participante
 *    que disparo la transicion.
 *  - El caller controla el guard `!ejecucion.replay` (D-AUDIT-2) cuando
 *    corresponde — este service NO conoce idempotencia.
 */
@Injectable()
export class AsignacionesNotificacionesService {
  private readonly logger = new Logger(AsignacionesNotificacionesService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificaciones: NotificacionesService,
  ) {}

  /**
   * Trigger RESULTADO_CIERRE (D-S10-C9, §19.3.1). Tipo critico — no silenciable.
   */
  async resultadoCierre(asignacionId: string, resultado: ResultadoCierre): Promise<void> {
    try {
      const asignacion = await this.prisma.asignacionCurso.findUnique({
        where: { id: asignacionId },
        select: {
          curso: { select: { titulo: true } },
          colaborador: { select: { usuario: { select: { id: true } } } },
        },
      })
      const usuarioId = asignacion?.colaborador?.usuario?.id
      const cursoTitulo = asignacion?.curso?.titulo
      if (!(usuarioId && cursoTitulo)) {
        this.logger.warn(
          `notif | resultado-cierre omitida | asignacion=${asignacionId} | motivo=sin-usuario-o-curso`,
        )
        return
      }
      await this.notificaciones.crear({
        usuarioId,
        tipo: TipoEventoNotif.RESULTADO_CIERRE,
        payload: {
          asignacionId,
          cursoTitulo,
          resultado,
        },
      })
    } catch (error) {
      const detalle = error instanceof Error ? error.message : String(error)
      this.logger.warn(
        `notif | fallo | tipo=RESULTADO_CIERRE | asignacion=${asignacionId} | error=${detalle}`,
      )
    }
  }

  /**
   * Trigger ASIGNACION_CURSO (D-S11.5-A1, §19.3). Tipo critico — no silenciable.
   *
   * Se invoca:
   *  - en `crearAsignacionesAdmin` por cada asignacion efectivamente creada
   *    (no para las que rebotaron por P2002 race -> YA_INSCRITO).
   *  - en `autoInscribir` tras crear el row VOLUNTARIO con exito.
   */
  async asignacionCurso(asignacionId: string): Promise<void> {
    try {
      const asignacion = await this.prisma.asignacionCurso.findUnique({
        where: { id: asignacionId },
        select: {
          curso: { select: { id: true, titulo: true } },
          colaborador: { select: { usuario: { select: { id: true } } } },
        },
      })
      const usuarioId = asignacion?.colaborador?.usuario?.id
      const cursoId = asignacion?.curso?.id
      const cursoTitulo = asignacion?.curso?.titulo
      if (!(usuarioId && cursoId && cursoTitulo)) {
        this.logger.warn(
          `notif | asignacion-curso omitida | asignacion=${asignacionId} | motivo=sin-usuario-o-curso`,
        )
        return
      }
      await this.notificaciones.crear({
        usuarioId,
        tipo: TipoEventoNotif.ASIGNACION_CURSO,
        payload: {
          asignacionId,
          cursoId,
          cursoTitulo,
        },
      })
    } catch (error) {
      const detalle = error instanceof Error ? error.message : String(error)
      this.logger.warn(
        `notif | fallo | tipo=ASIGNACION_CURSO | asignacion=${asignacionId} | error=${detalle}`,
      )
    }
  }

  /**
   * Trigger CASO_REABIERTO (D-S11.5-A2, §19.3). Tipo critico — no silenciable.
   * El motivo viene del header `X-Motivo` validado por `@RequiereMotivo()` en
   * el controller y se incluye en el payload para que el colaborador entienda
   * el porque del cambio. Se invoca FUERA del `runOnce` y solo cuando
   * `!ejecucion.replay` (D-AUDIT-2 / R-S11.5-1) — el caller controla esa guarda.
   */
  async casoReabierto(asignacionId: string, motivo: string): Promise<void> {
    try {
      const asignacion = await this.prisma.asignacionCurso.findUnique({
        where: { id: asignacionId },
        select: {
          curso: { select: { id: true, titulo: true } },
          colaborador: { select: { usuario: { select: { id: true } } } },
        },
      })
      const usuarioId = asignacion?.colaborador?.usuario?.id
      const cursoId = asignacion?.curso?.id
      const cursoTitulo = asignacion?.curso?.titulo
      if (!(usuarioId && cursoId && cursoTitulo)) {
        this.logger.warn(
          `notif | caso-reabierto omitida | asignacion=${asignacionId} | motivo=sin-usuario-o-curso`,
        )
        return
      }
      await this.notificaciones.crear({
        usuarioId,
        tipo: TipoEventoNotif.CASO_REABIERTO,
        payload: {
          asignacionId,
          cursoId,
          cursoTitulo,
          motivo,
        },
      })
    } catch (error) {
      const detalle = error instanceof Error ? error.message : String(error)
      this.logger.warn(
        `notif | fallo | tipo=CASO_REABIERTO | asignacion=${asignacionId} | error=${detalle}`,
      )
    }
  }

  /**
   * Trigger COLABORADOR_LISTO (D-S11.5-B1, D88). Tipo silenciable. Broadcast a
   * TODOS los admins activos via `broadcastAdminsActivos`. Se invoca FUERA del
   * `$transaction` que cerro la transicion EN_PROGRESO -> LISTO; no necesita
   * guard !replay porque `marcarListo` no usa runOnce (la unicidad la garantiza
   * la transicion).
   */
  async colaboradorListo(asignacionId: string): Promise<void> {
    try {
      const asignacion = await this.prisma.asignacionCurso.findUnique({
        where: { id: asignacionId },
        select: {
          curso: { select: { id: true, titulo: true } },
          colaborador: { select: { id: true, nombre: true } },
        },
      })
      const cursoId = asignacion?.curso?.id
      const cursoTitulo = asignacion?.curso?.titulo
      const colaboradorId = asignacion?.colaborador?.id
      const colaboradorNombre = asignacion?.colaborador?.nombre
      if (!(cursoId && cursoTitulo && colaboradorId && colaboradorNombre)) {
        this.logger.warn(
          `notif | colaborador-listo omitida | asignacion=${asignacionId} | motivo=sin-curso-o-colaborador`,
        )
        return
      }
      await broadcastAdminsActivos(
        this.prisma,
        this.notificaciones,
        this.logger,
        TipoEventoNotif.COLABORADOR_LISTO,
        {
          asignacionId,
          cursoId,
          cursoTitulo,
          colaboradorId,
          colaboradorNombre,
        },
      )
    } catch (error) {
      const detalle = error instanceof Error ? error.message : String(error)
      this.logger.warn(
        `notif | fallo | tipo=COLABORADOR_LISTO | asignacion=${asignacionId} | error=${detalle}`,
      )
    }
  }

  /**
   * Trigger PLANES_DESACTUALIZADOS driver `reabrir_caso` (D-S11.5-B3 (b), D80,
   * §9.5). Tipo silenciable. Broadcast a TODOS los admins activos solo si
   * existen planes marcados como desactualizados para la asignacion reabierta
   * (count >= 1). Se invoca FUERA del `runOnce` y solo cuando
   * `!ejecucion.replay` (D-AUDIT-2 / R-S11.5-1) — el caller controla esa guarda.
   */
  async planesDesactualizadosPorReabrir(asignacionId: string): Promise<void> {
    try {
      const asignacion = await this.prisma.asignacionCurso.findUnique({
        where: { id: asignacionId },
        select: { cursoId: true },
      })
      if (!asignacion?.cursoId) {
        this.logger.warn(
          `notif | planes-desactualizados omitida | asignacion=${asignacionId} | motivo=sin-curso`,
        )
        return
      }
      const planesAfectados = await this.prisma.planEstudio.count({
        where: { asignacionId, estaDesactualizado: true },
      })
      if (planesAfectados < 1) {
        // No hubo planes a desactualizar (caso sin plan generado). El broadcast
        // se omite — coherente con D-S11.5-B3 ("una sola emision por evento,
        // solo si N>=1").
        return
      }
      await broadcastAdminsActivos(
        this.prisma,
        this.notificaciones,
        this.logger,
        TipoEventoNotif.PLANES_DESACTUALIZADOS,
        {
          driver: "reabrir_caso",
          cursoId: asignacion.cursoId,
          planesAfectados,
        },
      )
    } catch (error) {
      const detalle = error instanceof Error ? error.message : String(error)
      this.logger.warn(
        `notif | fallo | tipo=PLANES_DESACTUALIZADOS | asignacion=${asignacionId} | error=${detalle}`,
      )
    }
  }
}
