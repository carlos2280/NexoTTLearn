import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common"
import type {
  AsignacionDeleteResponse,
  AsignacionesInscripcionResponse,
  CambiarTipoAsignacionInput,
  ReemplazarAsignacionesInput,
  TipoAsignacion,
} from "@nexott-learn/shared-types"
import type { Prisma } from "@prisma/client"
import { PrismaService } from "../../common/prisma/prisma.service"
import {
  CURSO_AREA_ASIGN_SELECT,
  INSCRIPCION_ASIGN_SELECT,
  MODULO_ASIGN_SELECT,
  mapConfirmadas,
} from "./asignaciones.mapper"
import { calcularSugerencias } from "./asignaciones.sugerencias"
import {
  ENTIDAD_TIPO_ASIGNACION,
  ERROR_ASIGNACION_NO_ENCONTRADA,
  ERROR_INSCRIPCION_LIBRE_INMUTABLE,
  ERROR_INSCRIPCION_NO_ACTIVA,
  ERROR_INSCRIPCION_NO_ENCONTRADA,
  ERROR_MODULOS_DUPLICADOS,
  ERROR_MODULO_NO_PERTENECE_AL_CURSO,
} from "./asignaciones.types"

@Injectable()
export class AsignacionesInscripcionService {
  constructor(private readonly prisma: PrismaService) {}

  async obtener(inscripcionId: string): Promise<AsignacionesInscripcionResponse> {
    const inscripcion = await this.cargarInscripcion(inscripcionId)
    const [cursoAreas, modulos, curso] = await Promise.all([
      this.prisma.cursoArea.findMany({
        where: { cursoId: inscripcion.cursoId },
        select: CURSO_AREA_ASIGN_SELECT,
        orderBy: [{ orden: "asc" }],
      }),
      this.prisma.modulo.findMany({
        where: { cursoId: inscripcion.cursoId, archivadoAt: null },
        select: MODULO_ASIGN_SELECT,
        orderBy: [{ orden: "asc" }],
      }),
      this.prisma.curso.findUniqueOrThrow({
        where: { id: inscripcion.cursoId },
        select: { umbralBrechaNoCumple: true },
      }),
    ])
    const calc = calcularSugerencias({
      inscripcion: inscripcion.row,
      cursoAreas,
      modulos,
      umbralBrechaNoCumple: curso.umbralBrechaNoCumple,
    })
    return {
      inscripcionId: inscripcion.id,
      cursoId: inscripcion.cursoId,
      tieneEvaluacion: calc.tieneEvaluacion,
      sugerencias: calc.sugerencias,
      confirmadas: mapConfirmadas(inscripcion.row.asignaciones),
    }
  }

  async reemplazar(
    inscripcionId: string,
    input: ReemplazarAsignacionesInput,
    actorId: string,
  ): Promise<AsignacionesInscripcionResponse> {
    const inscripcion = await this.cargarInscripcion(inscripcionId)
    validarSinDuplicados(input.asignaciones.map((a) => a.moduloId))
    validarTipoLibre(
      inscripcion.row.tipo,
      input.asignaciones.map((a) => a.tipo),
    )
    await this.validarModulosPerteneceAlCurso(
      inscripcion.cursoId,
      input.asignaciones.map((a) => a.moduloId),
    )

    const previos = inscripcion.row.asignaciones
    await this.prisma.$transaction(async (tx) => {
      await tx.asignacion.deleteMany({ where: { inscripcionId } })
      if (input.asignaciones.length > 0) {
        await tx.asignacion.createMany({
          data: input.asignaciones.map((a) => ({
            inscripcionId,
            moduloId: a.moduloId,
            tipo: a.tipo,
          })),
        })
      }
      await tx.logActividad.create({
        data: {
          actorId,
          tipoAccion: "MODULOS_ASIGNADOS",
          entidadTipo: ENTIDAD_TIPO_ASIGNACION,
          entidadId: inscripcionId,
          valorAntes: {
            asignaciones: previos.map((p) => ({ moduloId: p.moduloId, tipo: p.tipo })),
          },
          valorDespues: { asignaciones: input.asignaciones },
        },
      })
    })

    return this.obtener(inscripcionId)
  }

  async cambiarTipo(
    inscripcionId: string,
    moduloId: string,
    input: CambiarTipoAsignacionInput,
    actorId: string,
  ): Promise<AsignacionesInscripcionResponse> {
    const inscripcion = await this.cargarInscripcion(inscripcionId)
    validarTipoLibre(inscripcion.row.tipo, [input.tipo])
    const existente = inscripcion.row.asignaciones.find((a) => a.moduloId === moduloId)
    if (!existente) {
      throw new NotFoundException(ERROR_ASIGNACION_NO_ENCONTRADA)
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.asignacion.update({
        // biome-ignore lint/style/useNamingConvention: nombre del where compuesto generado por Prisma a partir de @@unique([inscripcionId, moduloId])
        where: { inscripcionId_moduloId: { inscripcionId, moduloId } },
        data: { tipo: input.tipo, modificadaAt: new Date() },
      })
      await tx.logActividad.create({
        data: {
          actorId,
          tipoAccion: "MODULOS_ASIGNADOS",
          entidadTipo: ENTIDAD_TIPO_ASIGNACION,
          entidadId: inscripcionId,
          valorAntes: { moduloId, tipo: existente.tipo },
          valorDespues: { moduloId, tipo: input.tipo },
        },
      })
    })

    return this.obtener(inscripcionId)
  }

  async eliminar(
    inscripcionId: string,
    moduloId: string,
    actorId: string,
  ): Promise<AsignacionDeleteResponse> {
    const inscripcion = await this.cargarInscripcion(inscripcionId)
    const existente = inscripcion.row.asignaciones.find((a) => a.moduloId === moduloId)
    if (!existente) {
      throw new NotFoundException(ERROR_ASIGNACION_NO_ENCONTRADA)
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.asignacion.delete({
        // biome-ignore lint/style/useNamingConvention: nombre del where compuesto generado por Prisma a partir de @@unique([inscripcionId, moduloId])
        where: { inscripcionId_moduloId: { inscripcionId, moduloId } },
      })
      await tx.logActividad.create({
        data: {
          actorId,
          tipoAccion: "MODULOS_ASIGNADOS",
          entidadTipo: ENTIDAD_TIPO_ASIGNACION,
          entidadId: inscripcionId,
          valorAntes: { moduloId, tipo: existente.tipo },
          valorDespues: { moduloId, tipo: null },
        },
      })
    })
    return { tipo: "ELIMINADA", inscripcionId, moduloId }
  }

  private async cargarInscripcion(inscripcionId: string) {
    const row = await this.prisma.inscripcion.findUnique({
      where: { id: inscripcionId },
      select: { ...INSCRIPCION_ASIGN_SELECT, cursoId: true, estado: true },
    })
    if (!row) {
      throw new NotFoundException(ERROR_INSCRIPCION_NO_ENCONTRADA)
    }
    if (row.estado !== "ACTIVA") {
      throw new ConflictException(ERROR_INSCRIPCION_NO_ACTIVA)
    }
    return { id: row.id, cursoId: row.cursoId, row }
  }

  private async validarModulosPerteneceAlCurso(
    cursoId: string,
    moduloIds: readonly string[],
  ): Promise<void> {
    if (moduloIds.length === 0) {
      return
    }
    const where: Prisma.ModuloWhereInput = { cursoId, id: { in: [...moduloIds] } }
    const count = await this.prisma.modulo.count({ where })
    if (count !== new Set(moduloIds).size) {
      throw new BadRequestException(ERROR_MODULO_NO_PERTENECE_AL_CURSO)
    }
  }
}

function validarSinDuplicados(moduloIds: readonly string[]): void {
  if (new Set(moduloIds).size !== moduloIds.length) {
    throw new BadRequestException(ERROR_MODULOS_DUPLICADOS)
  }
}

function validarTipoLibre(
  tipoInscripcion: "SOLICITUD" | "LIBRE",
  tipos: readonly TipoAsignacion[],
): void {
  if (tipoInscripcion !== "LIBRE") {
    return
  }
  if (tipos.some((t) => t !== "OPCIONAL")) {
    throw new BadRequestException(ERROR_INSCRIPCION_LIBRE_INMUTABLE)
  }
}
