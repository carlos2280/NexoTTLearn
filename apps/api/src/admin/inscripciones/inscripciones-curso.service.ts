import { ConflictException, Injectable, NotFoundException } from "@nestjs/common"
import type {
  InscripcionDeleteAdminResponse,
  InscripcionDiagnosticoListResponse,
  ListarInscripcionesCursoQuery,
} from "@nexott-learn/shared-types"
import { Prisma } from "@prisma/client"
import { PrismaService } from "../../common/prisma/prisma.service"
import {
  INSCRIPCION_DIAGNOSTICO_SELECT,
  mapInscripcionDiagnostico,
} from "./inscripciones-curso.mapper"
import {
  ENTIDAD_TIPO_INSCRIPCION,
  ERROR_CURSO_NO_ENCONTRADO,
  ERROR_INSCRIPCION_NO_ENCONTRADA,
  ERROR_INSCRIPCION_NO_PERTENECE_AL_CURSO,
  ERROR_INSCRIPCION_YA_NO_ACTIVA,
} from "./inscripciones-curso.types"

@Injectable()
export class InscripcionesCursoService {
  constructor(private readonly prisma: PrismaService) {}

  async listarPorCurso(
    cursoId: string,
    query: ListarInscripcionesCursoQuery,
  ): Promise<InscripcionDiagnosticoListResponse> {
    const curso = await this.prisma.curso.findUnique({
      where: { id: cursoId },
      select: { id: true, _count: { select: { cursoAreas: true } } },
    })
    if (!curso) {
      throw new NotFoundException(ERROR_CURSO_NO_ENCONTRADO)
    }
    const areasTotales = curso._count.cursoAreas

    const where: Prisma.InscripcionWhereInput = {
      cursoId,
      estado: "ACTIVA",
      ...filtroBusqueda(query.q),
    }

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.inscripcion.findMany({
        where,
        select: INSCRIPCION_DIAGNOSTICO_SELECT,
        orderBy: [{ inscritaAt: "desc" }, { id: "asc" }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.inscripcion.count({ where }),
    ])

    const items = rows
      .map((row) => mapInscripcionDiagnostico({ row, areasTotales }))
      .filter((item) => filtroEstadoInvitado(item, query))

    return { items, total, page: query.page, pageSize: query.pageSize }
  }

  async quitarDelCurso(
    cursoId: string,
    inscripcionId: string,
    actorId: string,
  ): Promise<InscripcionDeleteAdminResponse> {
    const inscripcion = await this.prisma.inscripcion.findUnique({
      where: { id: inscripcionId },
      select: { id: true, cursoId: true, estado: true },
    })
    if (!inscripcion) {
      throw new NotFoundException(ERROR_INSCRIPCION_NO_ENCONTRADA)
    }
    if (inscripcion.cursoId !== cursoId) {
      throw new NotFoundException(ERROR_INSCRIPCION_NO_PERTENECE_AL_CURSO)
    }
    if (inscripcion.estado !== "ACTIVA") {
      throw new ConflictException(ERROR_INSCRIPCION_YA_NO_ACTIVA)
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.inscripcion.update({
        where: { id: inscripcionId },
        data: { estado: "ABANDONADA", abandonadaAt: new Date() },
      })

      await tx.logActividad.create({
        data: {
          actorId,
          tipoAccion: "CURSO_ACTUALIZADO",
          entidadTipo: ENTIDAD_TIPO_INSCRIPCION,
          entidadId: inscripcionId,
          valorAntes: { estado: "ACTIVA" },
          valorDespues: { estado: "ABANDONADA" },
        },
      })
    })

    return { tipo: "ELIMINADA", id: inscripcionId }
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

function filtroEstadoInvitado(
  item: { readonly estadoInvitado: string; readonly evaluacion: { readonly completa: boolean } },
  query: ListarInscripcionesCursoQuery,
): boolean {
  if (query.estadoInvitado && item.estadoInvitado !== query.estadoInvitado) {
    return false
  }
  if (query.tieneEvaluacion === "si" && !item.evaluacion.completa) {
    return false
  }
  if (query.tieneEvaluacion === "no" && item.evaluacion.completa) {
    return false
  }
  return true
}
