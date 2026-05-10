import { Injectable, NotFoundException } from "@nestjs/common"
import {
  BloqueDetalleResponse,
  BloqueResponse,
  ListarBloquesQuery,
  Paginated,
} from "@nexott-learn/shared-types"
import { Prisma } from "@prisma/client"
import { apiErrorCodes } from "../../common/errors/api-error.codes"
import { buildPaginatedResponse } from "../../common/http/paginated"
import { PrismaService } from "../../common/prisma/prisma.service"

/**
 * Listado — excluye `contenido` (JSONB voluminoso, estructura segun `tipo`).
 * D-CAT-9: `contenido` solo en detalle.
 */
const SELECT_BLOQUE_FIELDS = {
  id: true,
  seccionId: true,
  orden: true,
  tipo: true,
  esEvaluable: true,
  skillQueMideId: true,
  estado: true,
  version: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.BloqueSelect

const SELECT_BLOQUE_DETALLE_FIELDS = {
  ...SELECT_BLOQUE_FIELDS,
  contenido: true,
} as const satisfies Prisma.BloqueSelect

type BloqueRow = Prisma.BloqueGetPayload<{ select: typeof SELECT_BLOQUE_FIELDS }>
type BloqueDetalleRow = Prisma.BloqueGetPayload<{ select: typeof SELECT_BLOQUE_DETALLE_FIELDS }>

function toBloqueResponse(row: BloqueRow): BloqueResponse {
  return {
    id: row.id,
    seccionId: row.seccionId,
    orden: row.orden,
    tipo: row.tipo,
    esEvaluable: row.esEvaluable,
    skillQueMideId: row.skillQueMideId,
    estado: row.estado,
    version: row.version,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

function toBloqueDetalleResponse(row: BloqueDetalleRow): BloqueDetalleResponse {
  return {
    ...toBloqueResponse(row),
    // El JSONB de Prisma viene tipado como JsonValue. Lo exponemos como
    // Record<string, unknown>; la forma concreta del contenido depende del
    // tipo del bloque y se validara cuando se mute en P3.
    contenido: (row.contenido ?? {}) as Record<string, unknown>,
  }
}

@Injectable()
export class BloquesService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(query: ListarBloquesQuery): Promise<Paginated<BloqueResponse>> {
    const { page, pageSize, seccionId, tipo, estado } = query
    const where: Prisma.BloqueWhereInput = {
      ...(seccionId ? { seccionId } : {}),
      ...(tipo ? { tipo } : {}),
      ...(estado ? { estado } : {}),
    }

    const [filas, total] = await this.prisma.$transaction([
      this.prisma.bloque.findMany({
        where,
        select: SELECT_BLOQUE_FIELDS,
        orderBy: [{ seccionId: "asc" }, { orden: "asc" }],
        take: pageSize,
        skip: (page - 1) * pageSize,
      }),
      this.prisma.bloque.count({ where }),
    ])

    return buildPaginatedResponse(filas.map(toBloqueResponse), total, page, pageSize)
  }

  async obtenerPorIdOrThrow(id: string): Promise<BloqueDetalleResponse> {
    const fila = await this.prisma.bloque.findUnique({
      where: { id },
      select: SELECT_BLOQUE_DETALLE_FIELDS,
    })
    if (!fila) {
      throw new NotFoundException({
        code: apiErrorCodes.bloqueNoEncontrado,
        message: "Bloque no encontrado.",
      })
    }
    return toBloqueDetalleResponse(fila)
  }
}
