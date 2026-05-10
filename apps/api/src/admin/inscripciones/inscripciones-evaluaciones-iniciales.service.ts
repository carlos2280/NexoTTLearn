import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common"
import type {
  ActualizarEvaluacionInicialAdminInput,
  EvaluacionInicialDeleteAdminResponse,
  EvaluacionInicialDetalleAdmin,
  EvaluacionInicialListAdminResponse,
  UpsertEvaluacionInicialAdminInput,
} from "@nexott-learn/shared-types"
import { Prisma } from "@prisma/client"
import { PrismaService } from "../../common/prisma/prisma.service"
import {
  EVALUACION_INICIAL_DETALLE_SELECT,
  type EvaluacionInicialDetalleRow,
  mapEvaluacionInicialDetalle,
  snapshotEvaluacionInicial,
} from "./inscripciones-evaluaciones-iniciales.mapper"
import {
  ENTIDAD_TIPO_EVALUACION_INICIAL,
  ERROR_AREA_NO_PERTENECE_AL_CURSO,
  ERROR_CURSO_CERRADO_EVAL,
  ERROR_EVALUACION_INICIAL_NO_ENCONTRADA,
  ERROR_INSCRIPCION_LIBRE,
  ERROR_INSCRIPCION_NO_ACTIVA,
  ERROR_INSCRIPCION_NO_ENCONTRADA,
} from "./inscripciones-evaluaciones-iniciales.types"

const INSCRIPCION_REQUIRE_SELECT = {
  id: true,
  cursoId: true,
  estado: true,
  tipo: true,
  curso: {
    select: { id: true, estado: true },
  },
} satisfies Prisma.InscripcionSelect

type InscripcionRequerida = Prisma.InscripcionGetPayload<{
  select: typeof INSCRIPCION_REQUIRE_SELECT
}>

@Injectable()
export class InscripcionesEvaluacionesInicialesService {
  constructor(private readonly prisma: PrismaService) {}

  // ──────────────────────────────────────────────────────────────────
  // LECTURA · listado por inscripcion (todas las areas con captura)
  // ──────────────────────────────────────────────────────────────────

  async listar(inscripcionId: string): Promise<EvaluacionInicialListAdminResponse> {
    await this.requireInscripcion(inscripcionId)
    const rows = await this.prisma.evaluacionInicial.findMany({
      where: { inscripcionId },
      select: EVALUACION_INICIAL_DETALLE_SELECT,
      orderBy: { capturadaAt: "asc" },
    })
    return { items: rows.map(mapEvaluacionInicialDetalle) }
  }

  // ──────────────────────────────────────────────────────────────────
  // LECTURA · una captura por (inscripcion, area)
  // ──────────────────────────────────────────────────────────────────

  async obtener(inscripcionId: string, areaId: string): Promise<EvaluacionInicialDetalleAdmin> {
    await this.requireInscripcion(inscripcionId)
    const row = await this.requireEvaluacion(inscripcionId, areaId)
    return mapEvaluacionInicialDetalle(row)
  }

  // ──────────────────────────────────────────────────────────────────
  // PUT · upsert. Crea si no existe, actualiza si existe.
  // ──────────────────────────────────────────────────────────────────

  async upsert(
    inscripcionId: string,
    areaId: string,
    input: UpsertEvaluacionInicialAdminInput,
    actorId: string,
  ): Promise<EvaluacionInicialDetalleAdmin> {
    const inscripcion = await this.requireInscripcion(inscripcionId)
    this.requireMutable(inscripcion)
    await this.requireAreaDelCurso(inscripcion.cursoId, areaId)

    const existente = await this.prisma.evaluacionInicial.findUnique({
      // biome-ignore lint/style/useNamingConvention: nombre del where compuesto generado por Prisma a partir de @@unique([inscripcionId, areaId])
      where: { inscripcionId_areaId: { inscripcionId, areaId } },
      select: EVALUACION_INICIAL_DETALLE_SELECT,
    })

    const observaciones = normalizarObservaciones(input.observaciones)

    const nuevoId = await this.prisma.$transaction(async (tx) => {
      let resultado: EvaluacionInicialDetalleRow

      if (existente) {
        resultado = await tx.evaluacionInicial.update({
          // biome-ignore lint/style/useNamingConvention: nombre del where compuesto generado por Prisma a partir de @@unique([inscripcionId, areaId])
          where: { inscripcionId_areaId: { inscripcionId, areaId } },
          data: {
            puntaje: input.puntaje,
            observaciones,
            capturadaPorId: actorId,
          },
          select: EVALUACION_INICIAL_DETALLE_SELECT,
        })
      } else {
        resultado = await tx.evaluacionInicial.create({
          data: {
            inscripcionId,
            areaId,
            puntaje: input.puntaje,
            observaciones,
            capturadaPorId: actorId,
          },
          select: EVALUACION_INICIAL_DETALLE_SELECT,
        })
      }

      await tx.logActividad.create({
        data: {
          actorId,
          tipoAccion: "CURSO_ACTUALIZADO",
          entidadTipo: ENTIDAD_TIPO_EVALUACION_INICIAL,
          entidadId: resultado.id,
          valorAntes: existente ? snapshotEvaluacionInicial(existente) : Prisma.JsonNull,
          valorDespues: snapshotEvaluacionInicial(resultado),
        },
      })

      return resultado.id
    })

    return this.obtenerPorId(nuevoId)
  }

  // ──────────────────────────────────────────────────────────────────
  // PATCH · actualizacion parcial
  // ──────────────────────────────────────────────────────────────────

  async actualizar(
    inscripcionId: string,
    areaId: string,
    input: ActualizarEvaluacionInicialAdminInput,
    actorId: string,
  ): Promise<EvaluacionInicialDetalleAdmin> {
    const inscripcion = await this.requireInscripcion(inscripcionId)
    this.requireMutable(inscripcion)
    const previo = await this.requireEvaluacion(inscripcionId, areaId)

    const data: Prisma.EvaluacionInicialUpdateInput = {}
    if (input.puntaje !== undefined) {
      data.puntaje = input.puntaje
    }
    if (input.observaciones !== undefined) {
      data.observaciones = normalizarObservaciones(input.observaciones)
    }

    const nuevoId = await this.prisma.$transaction(async (tx) => {
      const actualizado = await tx.evaluacionInicial.update({
        // biome-ignore lint/style/useNamingConvention: nombre del where compuesto generado por Prisma a partir de @@unique([inscripcionId, areaId])
        where: { inscripcionId_areaId: { inscripcionId, areaId } },
        data,
        select: EVALUACION_INICIAL_DETALLE_SELECT,
      })

      await tx.logActividad.create({
        data: {
          actorId,
          tipoAccion: "CURSO_ACTUALIZADO",
          entidadTipo: ENTIDAD_TIPO_EVALUACION_INICIAL,
          entidadId: actualizado.id,
          valorAntes: snapshotEvaluacionInicial(previo),
          valorDespues: snapshotEvaluacionInicial(actualizado),
        },
      })

      return actualizado.id
    })

    return this.obtenerPorId(nuevoId)
  }

  // ──────────────────────────────────────────────────────────────────
  // DELETE
  // MAESTRO §7.5 · la evaluacion inicial NO participa del calculo de
  // notas del curso (es input para sugerir asignaciones), por lo que
  // no se exige ausencia de "entregas" para borrarla.
  // ──────────────────────────────────────────────────────────────────

  async eliminar(
    inscripcionId: string,
    areaId: string,
    actorId: string,
  ): Promise<EvaluacionInicialDeleteAdminResponse> {
    const inscripcion = await this.requireInscripcion(inscripcionId)
    this.requireMutable(inscripcion)
    const previo = await this.requireEvaluacion(inscripcionId, areaId)

    await this.prisma.$transaction(async (tx) => {
      await tx.evaluacionInicial.delete({ where: { id: previo.id } })

      await tx.logActividad.create({
        data: {
          actorId,
          tipoAccion: "CURSO_ACTUALIZADO",
          entidadTipo: ENTIDAD_TIPO_EVALUACION_INICIAL,
          entidadId: previo.id,
          valorAntes: snapshotEvaluacionInicial(previo),
          valorDespues: Prisma.JsonNull,
        },
      })
    })

    return { tipo: "ELIMINADO", id: previo.id }
  }

  // ──────────────────────────────────────────────────────────────────
  // Helpers privados
  // ──────────────────────────────────────────────────────────────────

  private async obtenerPorId(id: string): Promise<EvaluacionInicialDetalleAdmin> {
    const row = await this.prisma.evaluacionInicial.findUniqueOrThrow({
      where: { id },
      select: EVALUACION_INICIAL_DETALLE_SELECT,
    })
    return mapEvaluacionInicialDetalle(row)
  }

  private async requireInscripcion(inscripcionId: string): Promise<InscripcionRequerida> {
    const inscripcion = await this.prisma.inscripcion.findUnique({
      where: { id: inscripcionId },
      select: INSCRIPCION_REQUIRE_SELECT,
    })
    if (!inscripcion) {
      throw new NotFoundException(ERROR_INSCRIPCION_NO_ENCONTRADA)
    }
    return inscripcion
  }

  private requireMutable(inscripcion: InscripcionRequerida): void {
    if (inscripcion.curso.estado === "CERRADO") {
      throw new ConflictException(ERROR_CURSO_CERRADO_EVAL)
    }
    if (inscripcion.estado !== "ACTIVA") {
      throw new ConflictException(ERROR_INSCRIPCION_NO_ACTIVA)
    }
    if (inscripcion.tipo === "LIBRE") {
      throw new ConflictException(ERROR_INSCRIPCION_LIBRE)
    }
  }

  private async requireAreaDelCurso(cursoId: string, areaId: string): Promise<void> {
    const cursoArea = await this.prisma.cursoArea.findUnique({
      // biome-ignore lint/style/useNamingConvention: nombre del where compuesto generado por Prisma a partir de @@unique([cursoId, areaId])
      where: { cursoId_areaId: { cursoId, areaId } },
      select: { id: true },
    })
    if (!cursoArea) {
      throw new BadRequestException(ERROR_AREA_NO_PERTENECE_AL_CURSO)
    }
  }

  private async requireEvaluacion(
    inscripcionId: string,
    areaId: string,
  ): Promise<EvaluacionInicialDetalleRow> {
    const row = await this.prisma.evaluacionInicial.findUnique({
      // biome-ignore lint/style/useNamingConvention: nombre del where compuesto generado por Prisma a partir de @@unique([inscripcionId, areaId])
      where: { inscripcionId_areaId: { inscripcionId, areaId } },
      select: EVALUACION_INICIAL_DETALLE_SELECT,
    })
    if (!row) {
      throw new NotFoundException(ERROR_EVALUACION_INICIAL_NO_ENCONTRADA)
    }
    return row
  }
}

function normalizarObservaciones(observaciones: string | null | undefined): string | null {
  if (observaciones === undefined || observaciones === null) {
    return null
  }
  const trimmed = observaciones.trim()
  return trimmed.length === 0 ? null : trimmed
}
