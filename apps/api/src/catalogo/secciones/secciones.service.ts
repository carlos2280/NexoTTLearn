import { Injectable, NotFoundException } from "@nestjs/common"
import { ListarSeccionesQuery, Paginated, SeccionResponse } from "@nexott-learn/shared-types"
import { Prisma } from "@prisma/client"
import { apiErrorCodes } from "../../common/errors/api-error.codes"
import { buildPaginatedResponse } from "../../common/http/paginated"
import { PrismaService } from "../../common/prisma/prisma.service"

const SELECT_SECCION_FIELDS = {
  id: true,
  moduloId: true,
  titulo: true,
  orden: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.SeccionSelect

type SeccionRow = Prisma.SeccionGetPayload<{ select: typeof SELECT_SECCION_FIELDS }>

function toSeccionResponse(row: SeccionRow): SeccionResponse {
  return {
    id: row.id,
    moduloId: row.moduloId,
    titulo: row.titulo,
    orden: row.orden,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

@Injectable()
export class SeccionesService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(query: ListarSeccionesQuery): Promise<Paginated<SeccionResponse>> {
    const { page, pageSize, moduloId } = query
    const where: Prisma.SeccionWhereInput = moduloId ? { moduloId } : {}

    const [filas, total] = await this.prisma.$transaction([
      this.prisma.seccion.findMany({
        where,
        select: SELECT_SECCION_FIELDS,
        orderBy: [{ moduloId: "asc" }, { orden: "asc" }],
        take: pageSize,
        skip: (page - 1) * pageSize,
      }),
      this.prisma.seccion.count({ where }),
    ])

    return buildPaginatedResponse(filas.map(toSeccionResponse), total, page, pageSize)
  }

  async obtenerPorIdOrThrow(id: string): Promise<SeccionResponse> {
    const fila = await this.prisma.seccion.findUnique({
      where: { id },
      select: SELECT_SECCION_FIELDS,
    })
    if (!fila) {
      throw new NotFoundException({
        code: apiErrorCodes.seccionNoEncontrada,
        message: "Seccion no encontrada.",
      })
    }
    return toSeccionResponse(fila)
  }
}
