// GET /participante/cursos · lista de cursos del participante.
// GET /participante/cursos/:slug · vista detallada de un curso.
// Doc canonico:
//   - DOCUMENTOS/doc/v2/3-pantallas/participante/mis-cursos/lista.md
//   - DOCUMENTOS/doc/v2/3-pantallas/participante/mis-cursos/vista-curso.md

import { Injectable, NotFoundException } from "@nestjs/common"
import type {
  ParticipanteMisCursosResponse,
  ParticipanteVistaCursoResponse,
} from "@nexott-learn/shared-types"
import { PrismaService } from "../../common/prisma/prisma.service"
import { cargarInscripcionesDelParticipante } from "./mis-cursos.query"
import { construirRespuesta } from "./mis-cursos.selector"
import { cargarDataVistaCurso } from "./vista-curso.query"
import { construirVistaCurso } from "./vista-curso.selector"

@Injectable()
export class MisCursosService {
  constructor(private readonly prisma: PrismaService) {}

  async obtenerMisCursos(participanteId: string): Promise<ParticipanteMisCursosResponse> {
    const inscripciones = await cargarInscripcionesDelParticipante(this.prisma, participanteId)
    return construirRespuesta(inscripciones, new Date())
  }

  async obtenerVistaCurso(
    participanteId: string,
    slug: string,
  ): Promise<ParticipanteVistaCursoResponse> {
    const data = await cargarDataVistaCurso(this.prisma, participanteId, slug)
    if (!data) {
      throw new NotFoundException(`Curso no encontrado: ${slug}`)
    }
    return construirVistaCurso(data)
  }
}
