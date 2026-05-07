import { Injectable, NotFoundException } from "@nestjs/common"
import type {
  MatrizDiagnosticoFila,
  MatrizDiagnosticoQuery,
  MatrizDiagnosticoResponse,
} from "@nexott-learn/shared-types"
import { Prisma } from "@prisma/client"
import { PrismaService } from "../../common/prisma/prisma.service"
import {
  CURSO_AREA_DIAGNOSTICO_SELECT,
  INSCRIPCION_MATRIZ_SELECT,
  mapAreaDiagnostico,
  mapFilaMatriz,
} from "./diagnostico-matriz.mapper"
import { ERROR_CURSO_NO_ENCONTRADO } from "./diagnostico-matriz.types"

@Injectable()
export class DiagnosticoMatrizService {
  constructor(private readonly prisma: PrismaService) {}

  async obtenerMatriz(
    cursoId: string,
    query: MatrizDiagnosticoQuery,
  ): Promise<MatrizDiagnosticoResponse> {
    const curso = await this.prisma.curso.findUnique({
      where: { id: cursoId },
      select: { id: true },
    })
    if (!curso) {
      throw new NotFoundException(ERROR_CURSO_NO_ENCONTRADO)
    }

    const cursoAreas = await this.prisma.cursoArea.findMany({
      where: { cursoId },
      select: CURSO_AREA_DIAGNOSTICO_SELECT,
      orderBy: [{ orden: "asc" }, { id: "asc" }],
    })

    const where: Prisma.InscripcionWhereInput = {
      cursoId,
      estado: "ACTIVA",
      ...filtroBusqueda(query.q),
    }

    const inscripciones = await this.prisma.inscripcion.findMany({
      where,
      select: INSCRIPCION_MATRIZ_SELECT,
      orderBy: [
        { participante: { apellido: "asc" } },
        { participante: { nombre: "asc" } },
        { id: "asc" },
      ],
    })

    const filas: MatrizDiagnosticoFila[] = inscripciones
      .map((inscripcion) => mapFilaMatriz({ inscripcion, areas: cursoAreas }))
      .filter((fila) => filtroSoloSinDatos(fila, query.soloSinDatos))

    return {
      cursoId,
      areas: cursoAreas.map(mapAreaDiagnostico),
      filas,
      contadores: calcularContadores(filas, cursoAreas.length),
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

function filtroSoloSinDatos(
  fila: MatrizDiagnosticoFila,
  soloSinDatos: boolean | undefined,
): boolean {
  if (!soloSinDatos) {
    return true
  }
  return fila.cobertura.capturadas < fila.cobertura.total
}

function calcularContadores(filas: readonly MatrizDiagnosticoFila[], areasTotales: number) {
  const conDatosCompletos = filas.filter(
    (f) => areasTotales > 0 && f.cobertura.capturadas >= areasTotales,
  ).length
  const celdasCapturadas = filas.reduce((acc, f) => acc + f.cobertura.capturadas, 0)
  return {
    candidatos: filas.length,
    conDatosCompletos,
    celdasCapturadas,
    celdasTotales: filas.length * areasTotales,
  }
}
