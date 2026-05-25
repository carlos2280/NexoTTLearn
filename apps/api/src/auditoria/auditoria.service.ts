import { Injectable } from "@nestjs/common"
import type { AuditoriaResumen, ListarAuditoriaQuery } from "@nexott-learn/shared-types"
import type { AccionAuditoria, Prisma } from "@prisma/client"
import { Paginated, buildPaginatedResponse, resolvePaginacion } from "../common/http/paginated"
import { PrismaService } from "../common/prisma/prisma.service"

/**
 * `AuditoriaService` — Slice 12 P12 (D-S12-A1..A9).
 *
 * Lectura admin paginada de `activity_logs`. Lookup LEFT join con Usuario para
 * `actorEmail` y Colaborador para `actorNombre`. Eventos de sistema/cron con
 * `usuarioId = null` resuelven los campos del actor a `null` sin romper la
 * proyeccion.
 *
 * Reglas duras:
 *   - Identidad SIEMPRE de sesion (resuelto en el controller). El service
 *     trabaja con filtros ya validados por Zod.
 *   - Selects explicitos (OWASP A09): el visor expone solo lo que el admin
 *     necesita para forensia (sin `requestId` para no inflar payloads).
 *   - Las lecturas NO se auditan (D-CAT-3). El callsite de la exportacion SI
 *     audita con `AccionAuditoria.AUDITORIA_EXPORTADA`.
 */
@Injectable()
export class AuditoriaService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(query: ListarAuditoriaQuery): Promise<Paginated<AuditoriaResumen>> {
    const { page, pageSize, skip, take } = resolvePaginacion(query)
    const where = construirWhere(query)

    const [filas, total] = await this.prisma.$transaction([
      this.prisma.activityLog.findMany({
        where,
        select: selectAuditoriaResumen,
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      this.prisma.activityLog.count({ where }),
    ])

    return buildPaginatedResponse(filas.map(toAuditoriaResumen), total, page, pageSize)
  }

  /**
   * Lista TODAS las filas que matchean el filtro (sin paginacion).
   * Solo lo invoca la exportacion CSV. El controller hace `count` antes para
   * validar el tope defensivo `> 50000` (D-S12-A5) y rechazar con
   * `filtroDemasiadoAmplio`.
   */
  listarTodas(query: Omit<ListarAuditoriaQuery, "page" | "pageSize">): Promise<AuditoriaResumen[]> {
    const where = construirWhere(query)
    return this.prisma.activityLog
      .findMany({
        where,
        select: selectAuditoriaResumen,
        orderBy: { createdAt: "desc" },
      })
      .then((filas) => filas.map(toAuditoriaResumen))
  }

  contar(query: Omit<ListarAuditoriaQuery, "page" | "pageSize">): Promise<number> {
    return this.prisma.activityLog.count({ where: construirWhere(query) })
  }
}

const selectAuditoriaResumen = {
  id: true,
  usuarioId: true,
  accion: true,
  exito: true,
  recursoTipo: true,
  recursoId: true,
  ip: true,
  userAgent: true,
  metadata: true,
  createdAt: true,
  usuario: {
    select: {
      colaborador: { select: { email: true, nombre: true } },
    },
  },
} as const

type ActivityLogProyectado = Prisma.ActivityLogGetPayload<{ select: typeof selectAuditoriaResumen }>

function construirWhere(
  query: Omit<ListarAuditoriaQuery, "page" | "pageSize">,
): Prisma.ActivityLogWhereInput {
  const where: Prisma.ActivityLogWhereInput = {}
  if (query.actorUsuarioId) {
    where.usuarioId = query.actorUsuarioId
  }
  if (query.recursoTipo) {
    where.recursoTipo = query.recursoTipo
  }
  if (query.recursoId) {
    where.recursoId = query.recursoId
  }
  if (query.accion) {
    // El enum literal de shared-types se mantiene en sync manual con el enum
    // Prisma `AccionAuditoria` (D-S12-D1). Cast intencional: el schema Zod ya
    // valido que el string es uno de los 73 valores aceptados.
    where.accion = query.accion as AccionAuditoria
  }
  if (query.exito !== undefined) {
    where.exito = query.exito
  }
  if (query.desde || query.hasta) {
    const rango: Prisma.DateTimeFilter = {}
    if (query.desde) {
      rango.gte = new Date(query.desde)
    }
    if (query.hasta) {
      rango.lt = new Date(query.hasta)
    }
    where.createdAt = rango
  }
  return where
}

function toAuditoriaResumen(row: ActivityLogProyectado): AuditoriaResumen {
  const colaborador = row.usuario?.colaborador ?? null
  return {
    id: row.id,
    actorUsuarioId: row.usuarioId,
    actorEmail: colaborador?.email ?? null,
    actorNombre: colaborador?.nombre ?? null,
    accion: row.accion,
    recursoTipo: row.recursoTipo,
    recursoId: row.recursoId,
    exito: row.exito,
    metadata: normalizarMetadata(row.metadata),
    ip: row.ip,
    userAgent: row.userAgent,
    createdAt: row.createdAt.toISOString(),
  }
}

function normalizarMetadata(raw: Prisma.JsonValue | null): Record<string, unknown> | null {
  if (raw === null || raw === undefined) {
    return null
  }
  if (typeof raw !== "object" || Array.isArray(raw)) {
    return null
  }
  return raw as Record<string, unknown>
}
