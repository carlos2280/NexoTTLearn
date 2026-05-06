import { Injectable } from "@nestjs/common"
import type { ObtenerAreasCompetenciaResponse } from "@nexott-learn/shared-types"
import { PrismaService } from "../../common/prisma/prisma.service"
import { type AreaCompetenciaRow, mapAreaAItem } from "./areas-competencia.mapper"

@Injectable()
export class AreasCompetenciaService {
  constructor(private readonly prisma: PrismaService) {}

  async obtenerAreas(): Promise<ObtenerAreasCompetenciaResponse> {
    // Orden estable: primero por `orden` ascendente (con null al final por
    // default de Postgres) y luego alfabetico por nombre como desempate.
    const areas: readonly AreaCompetenciaRow[] = await this.prisma.areaCompetencia.findMany({
      orderBy: [{ orden: "asc" }, { nombre: "asc" }],
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        color: true,
        orden: true,
      },
    })

    return { items: areas.map(mapAreaAItem) }
  }
}
