import { Injectable, NotFoundException } from "@nestjs/common"
import {
  ClienteDetalleResponse,
  ClienteResponse,
  ListarClientesQuery,
  Paginated,
} from "@nexott-learn/shared-types"
import { Prisma } from "@prisma/client"
import { apiErrorCodes } from "../../common/errors/api-error.codes"
import { buildPaginatedResponse } from "../../common/http/paginated"
import { PrismaService } from "../../common/prisma/prisma.service"

/**
 * Listado — D-CAT-9: excluye `datosContacto` (JSONB libre).
 */
const SELECT_CLIENTE_FIELDS = {
  id: true,
  nombre: true,
  activo: true,
  fechaCreacion: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.ClienteSelect

const SELECT_CLIENTE_DETALLE_FIELDS = {
  ...SELECT_CLIENTE_FIELDS,
  datosContacto: true,
} as const satisfies Prisma.ClienteSelect

type ClienteRow = Prisma.ClienteGetPayload<{ select: typeof SELECT_CLIENTE_FIELDS }>
type ClienteDetalleRow = Prisma.ClienteGetPayload<{ select: typeof SELECT_CLIENTE_DETALLE_FIELDS }>

function toClienteResponse(row: ClienteRow): ClienteResponse {
  return {
    id: row.id,
    nombre: row.nombre,
    activo: row.activo,
    fechaCreacion: row.fechaCreacion.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

function toClienteDetalleResponse(row: ClienteDetalleRow): ClienteDetalleResponse {
  return {
    ...toClienteResponse(row),
    datosContacto:
      row.datosContacto === null || row.datosContacto === undefined
        ? null
        : (row.datosContacto as Record<string, unknown>),
  }
}

@Injectable()
export class ClientesService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(query: ListarClientesQuery): Promise<Paginated<ClienteResponse>> {
    const { page, pageSize, activo, q } = query
    // D-CAT-4: soft-delete (`deletedAt`) excluido siempre.
    const where: Prisma.ClienteWhereInput = {
      deletedAt: null,
      ...(activo !== undefined ? { activo } : {}),
      ...(q ? { nombre: { contains: q, mode: "insensitive" } } : {}),
    }

    const [filas, total] = await this.prisma.$transaction([
      this.prisma.cliente.findMany({
        where,
        select: SELECT_CLIENTE_FIELDS,
        orderBy: { nombre: "asc" },
        take: pageSize,
        skip: (page - 1) * pageSize,
      }),
      this.prisma.cliente.count({ where }),
    ])

    return buildPaginatedResponse(filas.map(toClienteResponse), total, page, pageSize)
  }

  async obtenerPorIdOrThrow(id: string): Promise<ClienteDetalleResponse> {
    // D-CAT-4: soft-deleted devuelven 404 igual que inexistentes.
    const fila = await this.prisma.cliente.findFirst({
      where: { id, deletedAt: null },
      select: SELECT_CLIENTE_DETALLE_FIELDS,
    })
    if (!fila) {
      throw new NotFoundException({
        code: apiErrorCodes.clienteNoEncontrado,
        message: "Cliente no encontrado.",
      })
    }
    return toClienteDetalleResponse(fila)
  }
}
