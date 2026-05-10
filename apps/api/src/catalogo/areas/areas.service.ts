import { Injectable, NotFoundException } from "@nestjs/common"
import { AreaResponse, ListarAreasQuery, Paginated } from "@nexott-learn/shared-types"
import { Prisma } from "@prisma/client"
import { apiErrorCodes } from "../../common/errors/api-error.codes"
import { buildPaginatedResponse, resolvePaginacion } from "../../common/http/paginated"
import { PrismaService } from "../../common/prisma/prisma.service"

const SELECT_AREA_FIELDS = {
  id: true,
  nombre: true,
  descripcion: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.AreaSelect

type AreaRow = Prisma.AreaGetPayload<{ select: typeof SELECT_AREA_FIELDS }>

function toAreaResponse(row: AreaRow): AreaResponse {
  return {
    id: row.id,
    nombre: row.nombre,
    descripcion: row.descripcion,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

@Injectable()
export class AreasService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(query: ListarAreasQuery): Promise<Paginated<AreaResponse>> {
    const { q } = query
    const { skip, take, page, pageSize } = resolvePaginacion(query)
    const where: Prisma.AreaWhereInput = q ? { nombre: { contains: q, mode: "insensitive" } } : {}

    const [filas, total] = await this.prisma.$transaction([
      this.prisma.area.findMany({
        where,
        select: SELECT_AREA_FIELDS,
        orderBy: { nombre: "asc" },
        take,
        skip,
      }),
      this.prisma.area.count({ where }),
    ])

    return buildPaginatedResponse(filas.map(toAreaResponse), total, page, pageSize)
  }

  async obtenerPorIdOrThrow(id: string): Promise<AreaResponse> {
    const fila = await this.prisma.area.findUnique({
      where: { id },
      select: SELECT_AREA_FIELDS,
    })
    if (!fila) {
      throw new NotFoundException({
        code: apiErrorCodes.areaNoEncontrada,
        message: "Area no encontrada.",
      })
    }
    return toAreaResponse(fila)
  }
}
