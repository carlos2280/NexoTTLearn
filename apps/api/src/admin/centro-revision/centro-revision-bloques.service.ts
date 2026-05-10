import { ConflictException, Injectable, NotFoundException } from "@nestjs/common"
import type {
  AjustarEntregaBloqueAdminInput,
  EntregaBloqueDetalleAdmin,
  EntregaBloqueListAdminResponse,
  EvaluarEntregaBloqueAdminInput,
  ListarEntregasBloqueAdminQuery,
} from "@nexott-learn/shared-types"
import { Prisma } from "@prisma/client"
import { PrismaService } from "../../common/prisma/prisma.service"
import { RecalculoService } from "../recalculo/recalculo.service"
import {
  ENTREGA_BLOQUE_DETALLE_SELECT,
  ENTREGA_BLOQUE_INTENTO_SELECT,
  ENTREGA_BLOQUE_LISTADO_SELECT,
  type EntregaBloqueDetalleRow,
  mapEntregaBloqueDetalle,
  mapEntregaBloqueListItem,
  snapshotEntregaBloque,
} from "./centro-revision-bloques.mapper"
import {
  ENTIDAD_TIPO_ENTREGA_BLOQUE,
  ERROR_AJUSTAR_ESTADO_ENVIADA,
  ERROR_CURSO_CERRADO_ENTREGA,
  ERROR_ENTREGA_NO_ENCONTRADA,
  ERROR_EVALUAR_AUTOMATICA,
  ERROR_EVALUAR_ENVIADA,
  ERROR_EVALUAR_YA_EVALUADA,
  ERROR_INSCRIPCION_NO_ACTIVA_EVALUAR,
  ERROR_INSCRIPCION_NO_AJUSTABLE,
} from "./centro-revision-bloques.types"

@Injectable()
export class CentroRevisionBloquesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly recalculo: RecalculoService,
  ) {}

  // ──────────────────────────────────────────────────────────────────
  // LISTADO · cola filtrable. Por defecto solo PENDIENTE_REVISION
  // (MAESTRO §12.1 — la cola del centro de revision).
  // ──────────────────────────────────────────────────────────────────

  async listar(query: ListarEntregasBloqueAdminQuery): Promise<EntregaBloqueListAdminResponse> {
    const where: Prisma.EntregaBloqueWhereInput = {}

    if (query.estado === undefined) {
      where.estado = "PENDIENTE_REVISION"
    } else if (query.estado !== "all") {
      where.estado = query.estado
    }

    if (query.cursoId) {
      where.inscripcion = { cursoId: query.cursoId }
    }
    if (query.participanteId) {
      where.inscripcion = {
        ...(where.inscripcion as Prisma.InscripcionWhereInput),
        participanteId: query.participanteId,
      }
    }
    if (query.bloqueId) {
      where.bloqueId = query.bloqueId
    }
    if (query.moduloId) {
      where.bloque = { seccion: { moduloId: query.moduloId } }
    }

    const skip = (query.page - 1) * query.pageSize
    const take = query.pageSize

    const [items, total] = await this.prisma.$transaction([
      this.prisma.entregaBloque.findMany({
        where,
        select: ENTREGA_BLOQUE_LISTADO_SELECT,
        orderBy: [{ enviadaAt: "asc" }],
        skip,
        take,
      }),
      this.prisma.entregaBloque.count({ where }),
    ])

    return {
      items: items.map(mapEntregaBloqueListItem),
      total,
      page: query.page,
      pageSize: query.pageSize,
    }
  }

  async obtener(id: string): Promise<EntregaBloqueDetalleAdmin> {
    const entrega = await this.requireEntrega(id)

    const intentos = await this.prisma.entregaBloque.findMany({
      where: {
        inscripcionId: entrega.inscripcionId,
        bloqueId: entrega.bloqueId,
      },
      select: ENTREGA_BLOQUE_INTENTO_SELECT,
      orderBy: [{ intento: "asc" }],
    })

    return mapEntregaBloqueDetalle(entrega, intentos)
  }

  // ──────────────────────────────────────────────────────────────────
  // PATCH /:id/evaluar · PENDIENTE_REVISION → EVALUADA (sin discrepancia).
  // MAESTRO §12.3.
  // ──────────────────────────────────────────────────────────────────

  async evaluar(
    id: string,
    input: EvaluarEntregaBloqueAdminInput,
    actorId: string,
  ): Promise<EntregaBloqueDetalleAdmin> {
    const previo = await this.requireEntrega(id)
    this.requireMutableEvaluar(previo)

    const valorAntes = snapshotEntregaBloque(previo)
    const data: Prisma.EntregaBloqueUncheckedUpdateInput = {
      nota: new Prisma.Decimal(input.nota),
      estado: "EVALUADA",
      ajustadaManual: false,
      evaluadaPorId: actorId,
      evaluadaAt: new Date(),
    }
    aplicarPatchFeedback(data, input.feedback)

    await this.prisma.$transaction(async (tx) => {
      // Iter 9.9 · snapshot agregado ANTES de mutar la entrega.
      const agregadosAntes = await this.recalculo.snapshotAgregados(previo.inscripcionId, tx)

      const actualizado = await tx.entregaBloque.update({
        where: { id },
        data,
        select: SELECT_LOG,
      })

      const logPadre = await tx.logActividad.create({
        data: {
          actorId,
          tipoAccion: "ENTREGA_EVALUADA",
          entidadTipo: ENTIDAD_TIPO_ENTREGA_BLOQUE,
          entidadId: id,
          valorAntes,
          valorDespues: snapshotEntregaBloque(actualizado),
        },
        select: { id: true },
      })

      // Iter 9.9 · cadena modulo → area → curso → etiqueta. Idempotente:
      // si ningun agregado cambia, NO emite logs (A26 caso borde 1).
      await this.recalculo.recalcularInscripcionTrasEntregaBloque(
        previo.inscripcionId,
        previo.bloqueId,
        actorId,
        { agregadosAntes, causaLogId: logPadre.id },
        tx,
      )
      // TODO post-MVP · emitir notificacion ENTREGA_EVALUADA al participante
      //   (MAESTRO §T06). Sin modulo de notificaciones todavia.
    })

    return this.obtener(id)
  }

  // ──────────────────────────────────────────────────────────────────
  // PATCH /:id/ajustar · A26 · sobrescritura con motivo obligatorio.
  // Permitido desde PENDIENTE_REVISION, EVALUADA o EVALUADA_AUTOMATICAMENTE
  // (A26 paso 5 línea 49: si la entrega aún no había sido EVALUADA, marcarla).
  // ──────────────────────────────────────────────────────────────────

  async ajustar(
    id: string,
    input: AjustarEntregaBloqueAdminInput,
    actorId: string,
  ): Promise<EntregaBloqueDetalleAdmin> {
    const previo = await this.requireEntrega(id)
    this.requireMutableAjustar(previo)

    const motivo = input.motivoAjuste.trim()
    const valorAntes = snapshotEntregaBloque(previo)

    // A26 paso 5: si la entrega aun no estaba EVALUADA, el ajuste la marca.
    const transicionaAEvaluada = previo.estado !== "EVALUADA"
    const data: Prisma.EntregaBloqueUncheckedUpdateInput = {
      nota: new Prisma.Decimal(input.nota),
      estado: "EVALUADA",
      ajustadaManual: true,
    }
    if (transicionaAEvaluada) {
      data.evaluadaPorId = actorId
      data.evaluadaAt = new Date()
    }
    aplicarPatchFeedback(data, input.feedback)

    await this.prisma.$transaction(async (tx) => {
      // Iter 9.9 · snapshot agregado ANTES de mutar.
      const agregadosAntes = await this.recalculo.snapshotAgregados(previo.inscripcionId, tx)

      const actualizado = await tx.entregaBloque.update({
        where: { id },
        data,
        select: SELECT_LOG,
      })

      const valorDespues = snapshotEntregaBloque(actualizado)

      const logPadre = await tx.logActividad.create({
        data: {
          actorId,
          tipoAccion: "NOTA_AJUSTADA_MANUAL",
          entidadTipo: ENTIDAD_TIPO_ENTREGA_BLOQUE,
          entidadId: id,
          motivo,
          valorAntes,
          valorDespues: { ...(valorDespues as Record<string, unknown>), motivo },
        },
        select: { id: true },
      })

      // Iter 9.9 · A26 idempotente · si nada cambia, 0 logs RECALCULO_*.
      await this.recalculo.recalcularInscripcionTrasEntregaBloque(
        previo.inscripcionId,
        previo.bloqueId,
        actorId,
        { agregadosAntes, causaLogId: logPadre.id },
        tx,
      )
      // TODO post-MVP · si etiqueta cambia → notificacion RECALCULO_NOTA (T06).
    })

    return this.obtener(id)
  }

  // ──────────────────────────────────────────────────────────────────
  // Helpers privados
  // ──────────────────────────────────────────────────────────────────

  private async requireEntrega(id: string): Promise<EntregaBloqueDetalleRow> {
    const row = await this.prisma.entregaBloque.findUnique({
      where: { id },
      select: ENTREGA_BLOQUE_DETALLE_SELECT,
    })
    if (!row) {
      throw new NotFoundException(ERROR_ENTREGA_NO_ENCONTRADA)
    }
    return row
  }

  private requireMutableEvaluar(entrega: EntregaBloqueDetalleRow): void {
    if (entrega.inscripcion.curso.estado === "CERRADO") {
      throw new ConflictException(ERROR_CURSO_CERRADO_ENTREGA)
    }
    if (entrega.inscripcion.estado !== "ACTIVA") {
      throw new ConflictException(ERROR_INSCRIPCION_NO_ACTIVA_EVALUAR)
    }
    if (entrega.estado === "EVALUADA") {
      throw new ConflictException(ERROR_EVALUAR_YA_EVALUADA)
    }
    if (entrega.estado === "EVALUADA_AUTOMATICAMENTE") {
      throw new ConflictException(ERROR_EVALUAR_AUTOMATICA)
    }
    if (entrega.estado === "ENVIADA") {
      throw new ConflictException(ERROR_EVALUAR_ENVIADA)
    }
    // PENDIENTE_REVISION → permitido.
  }

  /**
   * R2 (CERRADO) · R3 ajuste permite ACTIVA o COMPLETADA · A26 permite
   * desde PENDIENTE_REVISION, EVALUADA y EVALUADA_AUTOMATICAMENTE
   * (A26 paso 5 línea 49). Sigue prohibido desde ENVIADA.
   */
  private requireMutableAjustar(entrega: EntregaBloqueDetalleRow): void {
    if (entrega.inscripcion.curso.estado === "CERRADO") {
      throw new ConflictException(ERROR_CURSO_CERRADO_ENTREGA)
    }
    const estadoInscripcion = entrega.inscripcion.estado
    if (estadoInscripcion !== "ACTIVA" && estadoInscripcion !== "COMPLETADA") {
      throw new ConflictException(ERROR_INSCRIPCION_NO_AJUSTABLE)
    }
    if (entrega.estado === "ENVIADA") {
      throw new ConflictException(ERROR_AJUSTAR_ESTADO_ENVIADA)
    }
    // PENDIENTE_REVISION, EVALUADA, EVALUADA_AUTOMATICAMENTE → permitido.
  }
}

const SELECT_LOG = {
  id: true,
  estado: true,
  nota: true,
  feedback: true,
  ajustadaManual: true,
  evaluadaPorId: true,
  evaluadaAt: true,
} satisfies Prisma.EntregaBloqueSelect

/**
 * Semántica PATCH para feedback (A26 retrofit C-1.1):
 * - undefined → no modifica (no asigna la propiedad).
 * - null → borra (asigna null).
 * - string → trim; vacío tras trim → null.
 */
function aplicarPatchFeedback(
  data: Prisma.EntregaBloqueUncheckedUpdateInput,
  feedback: string | null | undefined,
): void {
  if (feedback === undefined) {
    return
  }
  if (feedback === null) {
    data.feedback = null
    return
  }
  const trimmed = feedback.trim()
  data.feedback = trimmed.length === 0 ? null : trimmed
}
