import { Injectable, NotFoundException } from "@nestjs/common"
import { ListarModulosQuery, ModuloResponse, Paginated } from "@nexott-learn/shared-types"
import { Prisma } from "@prisma/client"
import { apiErrorCodes } from "../../common/errors/api-error.codes"
import { buildPaginatedResponse } from "../../common/http/paginated"
import { PrismaService } from "../../common/prisma/prisma.service"

const SELECT_MODULO_FIELDS = {
  id: true,
  titulo: true,
  descripcion: true,
  estado: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.ModuloSelect

type ModuloRow = Prisma.ModuloGetPayload<{ select: typeof SELECT_MODULO_FIELDS }>

function toModuloResponse(row: ModuloRow): ModuloResponse {
  return {
    id: row.id,
    titulo: row.titulo,
    descripcion: row.descripcion,
    estado: row.estado,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

@Injectable()
export class ModulosService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(query: ListarModulosQuery): Promise<Paginated<ModuloResponse>> {
    const { page, pageSize, estado, q } = query
    // D-CAT-4: soft-delete excluido siempre del listado en P2.
    const where: Prisma.ModuloWhereInput = {
      deletedAt: null,
      ...(estado ? { estado } : {}),
      ...(q ? { titulo: { contains: q, mode: "insensitive" } } : {}),
    }

    const [filas, total] = await this.prisma.$transaction([
      this.prisma.modulo.findMany({
        where,
        select: SELECT_MODULO_FIELDS,
        orderBy: { titulo: "asc" },
        take: pageSize,
        skip: (page - 1) * pageSize,
      }),
      this.prisma.modulo.count({ where }),
    ])

    return buildPaginatedResponse(filas.map(toModuloResponse), total, page, pageSize)
  }

  async obtenerPorIdOrThrow(id: string): Promise<ModuloResponse> {
    // D-CAT-4: soft-deleted devuelven 404 igual que inexistentes.
    const fila = await this.prisma.modulo.findFirst({
      where: { id, deletedAt: null },
      select: SELECT_MODULO_FIELDS,
    })
    if (!fila) {
      throw new NotFoundException({
        code: apiErrorCodes.moduloNoEncontrado,
        message: "Modulo no encontrado.",
      })
    }
    return toModuloResponse(fila)
  }
}
