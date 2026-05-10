import { Injectable, NotFoundException } from "@nestjs/common"
import { ListarSkillsQuery, Paginated, SkillResponse } from "@nexott-learn/shared-types"
import { Prisma } from "@prisma/client"
import { apiErrorCodes } from "../../common/errors/api-error.codes"
import { buildPaginatedResponse, resolvePaginacion } from "../../common/http/paginated"
import { PrismaService } from "../../common/prisma/prisma.service"

const SELECT_SKILL_FIELDS = {
  id: true,
  etiquetaVisible: true,
  areaId: true,
  estado: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.SkillSelect

type SkillRow = Prisma.SkillGetPayload<{ select: typeof SELECT_SKILL_FIELDS }>

function toSkillResponse(row: SkillRow): SkillResponse {
  return {
    id: row.id,
    etiquetaVisible: row.etiquetaVisible,
    areaId: row.areaId,
    estado: row.estado,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

@Injectable()
export class SkillsService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(query: ListarSkillsQuery): Promise<Paginated<SkillResponse>> {
    const { areaId, estado, q } = query
    const { skip, take, page, pageSize } = resolvePaginacion(query)
    const where: Prisma.SkillWhereInput = {
      ...(areaId ? { areaId } : {}),
      ...(estado ? { estado } : {}),
      ...(q ? { etiquetaVisible: { contains: q, mode: "insensitive" } } : {}),
    }

    const [filas, total] = await this.prisma.$transaction([
      this.prisma.skill.findMany({
        where,
        select: SELECT_SKILL_FIELDS,
        orderBy: { etiquetaVisible: "asc" },
        take,
        skip,
      }),
      this.prisma.skill.count({ where }),
    ])

    return buildPaginatedResponse(filas.map(toSkillResponse), total, page, pageSize)
  }

  async obtenerPorIdOrThrow(id: string): Promise<SkillResponse> {
    const fila = await this.prisma.skill.findUnique({
      where: { id },
      select: SELECT_SKILL_FIELDS,
    })
    if (!fila) {
      throw new NotFoundException({
        code: apiErrorCodes.skillNoEncontrada,
        message: "Skill no encontrada.",
      })
    }
    return toSkillResponse(fila)
  }
}
