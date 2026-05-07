import { Injectable, NotFoundException } from "@nestjs/common"
import type {
  CandidatoAsignacion,
  MatrizAsignacionesQuery,
  MatrizAsignacionesResponse,
} from "@nexott-learn/shared-types"
import { Prisma } from "@prisma/client"
import { PrismaService } from "../../common/prisma/prisma.service"
import {
  CURSO_AREA_ASIGN_SELECT,
  INSCRIPCION_ASIGN_SELECT,
  MODULO_ASIGN_SELECT,
  calcularContadores,
  mapCandidato,
  mapModulo,
} from "./asignaciones.mapper"
import { ERROR_CURSO_NO_ENCONTRADO } from "./asignaciones.types"

@Injectable()
export class AsignacionesMatrizService {
  constructor(private readonly prisma: PrismaService) {}

  async obtenerMatriz(
    cursoId: string,
    query: MatrizAsignacionesQuery,
  ): Promise<MatrizAsignacionesResponse> {
    const curso = await this.prisma.curso.findUnique({
      where: { id: cursoId },
      select: { id: true, umbralBrechaNoCumple: true },
    })
    if (!curso) {
      throw new NotFoundException(ERROR_CURSO_NO_ENCONTRADO)
    }

    const cursoAreas = await this.prisma.cursoArea.findMany({
      where: { cursoId },
      select: CURSO_AREA_ASIGN_SELECT,
      orderBy: [{ orden: "asc" }, { id: "asc" }],
    })

    const modulos = await this.prisma.modulo.findMany({
      where: { cursoId, archivadoAt: null },
      select: MODULO_ASIGN_SELECT,
      orderBy: [{ orden: "asc" }, { id: "asc" }],
    })

    const where: Prisma.InscripcionWhereInput = {
      cursoId,
      estado: "ACTIVA",
      ...filtroBusqueda(query.q),
    }

    const inscripciones = await this.prisma.inscripcion.findMany({
      where,
      select: INSCRIPCION_ASIGN_SELECT,
      orderBy: [
        { participante: { apellido: "asc" } },
        { participante: { nombre: "asc" } },
        { id: "asc" },
      ],
    })

    const candidatos: CandidatoAsignacion[] = inscripciones.map((inscripcion) =>
      mapCandidato({
        inscripcion,
        cursoAreas,
        modulos,
        umbralBrechaNoCumple: curso.umbralBrechaNoCumple,
      }),
    )

    return {
      cursoId,
      umbralBrechaNoCumple: curso.umbralBrechaNoCumple,
      areas: cursoAreas.map((ca) => ({
        id: ca.area.id,
        nombre: ca.area.nombre,
        color: ca.area.color,
        puntajeObjetivo: ca.puntajeObjetivo,
      })),
      modulos: modulos.map(mapModulo),
      candidatos,
      contadores: calcularContadores(candidatos),
    }
  }
}

function filtroBusqueda(q: string | undefined): Prisma.InscripcionWhereInput {
  if (!q) {
    return {}
  }
  return {
    participante: {
      // biome-ignore lint/style/useNamingConvention: OR es operador estandar de Prisma
      OR: [
        { nombre: { contains: q, mode: "insensitive" } },
        { apellido: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ],
    },
  }
}
