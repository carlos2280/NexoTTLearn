// GET /participante/catalogo  · vitrina de cursos libres.
// GET /participante/catalogo/:slug · ficha de curso libre.
// POST /participante/catalogo/:slug/inscribirme · auto-inscripcion.
//
// Doc canonico: DOCUMENTOS/doc/v2/3-pantallas/participante/catalogo/

import { Injectable, NotFoundException } from "@nestjs/common"
import type {
  CatalogoFichaResponse,
  CatalogoInscribirmeResponse,
  CatalogoVitrinaQuery,
  CatalogoVitrinaResponse,
} from "@nexott-learn/shared-types"
import { PrismaService } from "../../common/prisma/prisma.service"
import { cargarFicha } from "./catalogo.ficha.query"
import { construirFichaResponse } from "./catalogo.ficha.selector"
import { CatalogoInscribirService } from "./catalogo.inscribir.service"
import { cargarVitrina } from "./catalogo.vitrina.query"
import { construirVitrinaResponse } from "./catalogo.vitrina.selector"

@Injectable()
export class CatalogoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inscribirService: CatalogoInscribirService,
  ) {}

  async obtenerVitrina(
    participanteId: string,
    query: CatalogoVitrinaQuery,
  ): Promise<CatalogoVitrinaResponse> {
    const data = await cargarVitrina(this.prisma, participanteId, query)
    return construirVitrinaResponse(data)
  }

  async obtenerFicha(participanteId: string, slug: string): Promise<CatalogoFichaResponse> {
    const row = await cargarFicha(this.prisma, participanteId, slug)
    if (!row) {
      throw new NotFoundException(`Curso no disponible en el catalogo: ${slug}`)
    }
    return construirFichaResponse(row)
  }

  inscribirse(participanteId: string, slug: string): Promise<CatalogoInscribirmeResponse> {
    return this.inscribirService.inscribirseEnCurso(participanteId, slug)
  }
}
