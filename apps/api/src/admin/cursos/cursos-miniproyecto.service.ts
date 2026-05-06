import { ConflictException, Injectable, NotFoundException } from "@nestjs/common"
import type {
  ActualizarMiniProyectoAdminInput,
  AjustarPesosMiniProyectoInput,
  AjustarUmbralMiniProyectoInput,
  MiniProyectoDeleteAdminResponse,
  MiniProyectoDetalleAdmin,
  UpsertMiniProyectoAdminInput,
} from "@nexott-learn/shared-types"
import { Prisma } from "@prisma/client"
import { PrismaService } from "../../common/prisma/prisma.service"
import {
  MINIPROYECTO_DETALLE_SELECT,
  type MiniProyectoDetalleRow,
  mapMiniProyectoDetalle,
  snapshotMiniProyecto,
} from "./cursos.mapper"
import { ENTIDAD_TIPO } from "./cursos.types"

const ENTIDAD_TIPO_MINI = "MiniProyecto"

const ERROR_MODULO_NO_ENCONTRADO = "Modulo no encontrado"
const ERROR_MINI_NO_ENCONTRADO = "MiniProyecto no encontrado"
const ERROR_CURSO_CERRADO = "No se puede modificar el mini proyecto en un curso CERRADO"
const ERROR_DELETE_NO_BORRADOR =
  "Solo se puede eliminar el mini proyecto en cursos en estado BORRADOR"
const ERROR_DELETE_CON_ENTREGAS =
  "No se puede eliminar el mini proyecto porque tiene entregas registradas"

@Injectable()
export class CursosMiniProyectoService {
  constructor(private readonly prisma: PrismaService) {}

  // ──────────────────────────────────────────────────────────────────
  // LECTURA
  // ──────────────────────────────────────────────────────────────────

  async obtener(cursoId: string, moduloId: string): Promise<MiniProyectoDetalleAdmin> {
    await this.requireModulo(cursoId, moduloId)
    const row = await this.requireMiniProyecto(moduloId)
    return mapMiniProyectoDetalle(row)
  }

  // ──────────────────────────────────────────────────────────────────
  // PUT (upsert)
  // ──────────────────────────────────────────────────────────────────

  async upsert(
    cursoId: string,
    moduloId: string,
    input: UpsertMiniProyectoAdminInput,
    actorId: string,
  ): Promise<MiniProyectoDetalleAdmin> {
    const modulo = await this.requireModulo(cursoId, moduloId)
    if (modulo.curso.estado === "CERRADO") {
      throw new ConflictException(ERROR_CURSO_CERRADO)
    }

    const existente = await this.prisma.miniProyecto.findUnique({
      where: { moduloId },
      select: MINIPROYECTO_DETALLE_SELECT,
    })

    const nuevoId = await this.prisma.$transaction(async (tx) => {
      let resultado: MiniProyectoDetalleRow

      if (existente) {
        resultado = await tx.miniProyecto.update({
          where: { moduloId },
          data: {
            titulo: input.titulo.trim(),
            enunciado: input.enunciado.trim(),
          },
          select: MINIPROYECTO_DETALLE_SELECT,
        })
      } else {
        resultado = await tx.miniProyecto.create({
          data: {
            moduloId,
            titulo: input.titulo.trim(),
            enunciado: input.enunciado.trim(),
          },
          select: MINIPROYECTO_DETALLE_SELECT,
        })
        // Activar flag en el módulo si no estaba activo
        if (!modulo.miniProyectoActivo) {
          await tx.modulo.update({
            where: { id: moduloId },
            data: { miniProyectoActivo: true },
          })
        }
      }

      await tx.logActividad.create({
        data: {
          actorId,
          tipoAccion: "CURSO_ACTUALIZADO",
          entidadTipo: ENTIDAD_TIPO_MINI,
          entidadId: resultado.id,
          valorAntes: existente ? snapshotMiniProyecto(existente) : Prisma.JsonNull,
          valorDespues: snapshotMiniProyecto(resultado),
        },
      })

      return resultado.id
    })

    return this.obtenerPorId(nuevoId)
  }

  // ──────────────────────────────────────────────────────────────────
  // PATCH
  // ──────────────────────────────────────────────────────────────────

  async actualizar(
    cursoId: string,
    moduloId: string,
    input: ActualizarMiniProyectoAdminInput,
    actorId: string,
  ): Promise<MiniProyectoDetalleAdmin> {
    const modulo = await this.requireModulo(cursoId, moduloId)
    if (modulo.curso.estado === "CERRADO") {
      throw new ConflictException(ERROR_CURSO_CERRADO)
    }
    const previo = await this.requireMiniProyecto(moduloId)

    const data: Prisma.MiniProyectoUpdateInput = {}
    if (input.titulo !== undefined) {
      data.titulo = input.titulo.trim()
    }
    if (input.enunciado !== undefined) {
      data.enunciado = input.enunciado.trim()
    }

    const nuevoId = await this.prisma.$transaction(async (tx) => {
      const actualizado = await tx.miniProyecto.update({
        where: { moduloId },
        data,
        select: MINIPROYECTO_DETALLE_SELECT,
      })

      await tx.logActividad.create({
        data: {
          actorId,
          tipoAccion: "CURSO_ACTUALIZADO",
          entidadTipo: ENTIDAD_TIPO_MINI,
          entidadId: actualizado.id,
          valorAntes: snapshotMiniProyecto(previo),
          valorDespues: snapshotMiniProyecto(actualizado),
        },
      })

      return actualizado.id
    })

    return this.obtenerPorId(nuevoId)
  }

  // ──────────────────────────────────────────────────────────────────
  // DELETE
  // ──────────────────────────────────────────────────────────────────

  async eliminar(
    cursoId: string,
    moduloId: string,
    actorId: string,
  ): Promise<MiniProyectoDeleteAdminResponse> {
    const modulo = await this.requireModulo(cursoId, moduloId)
    if (modulo.curso.estado !== "BORRADOR") {
      throw new ConflictException(ERROR_DELETE_NO_BORRADOR)
    }
    const previo = await this.requireMiniProyecto(moduloId)

    const totalEntregas = await this.prisma.entregaProyecto.count({
      where: { miniProyectoId: previo.id },
    })
    if (totalEntregas > 0) {
      throw new ConflictException(ERROR_DELETE_CON_ENTREGAS)
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.miniProyecto.delete({ where: { id: previo.id } })
      await tx.modulo.update({
        where: { id: moduloId },
        data: { miniProyectoActivo: false, umbralMiniOverride: null },
      })

      await tx.logActividad.create({
        data: {
          actorId,
          tipoAccion: "CURSO_ACTUALIZADO",
          entidadTipo: ENTIDAD_TIPO_MINI,
          entidadId: previo.id,
          valorAntes: snapshotMiniProyecto(previo),
          valorDespues: Prisma.JsonNull,
        },
      })
    })

    return { tipo: "ELIMINADO", id: previo.id }
  }

  // ──────────────────────────────────────────────────────────────────
  // POST /pesos · ajustar pesos de las 3 capas
  // ──────────────────────────────────────────────────────────────────

  async ajustarPesos(
    cursoId: string,
    moduloId: string,
    input: AjustarPesosMiniProyectoInput,
    actorId: string,
  ): Promise<MiniProyectoDetalleAdmin> {
    const modulo = await this.requireModulo(cursoId, moduloId)
    if (modulo.curso.estado === "CERRADO") {
      throw new ConflictException(ERROR_CURSO_CERRADO)
    }
    const previo = await this.requireMiniProyecto(moduloId)
    const cursoActivo = modulo.curso.estado === "ACTIVO"

    const nuevoId = await this.prisma.$transaction(async (tx) => {
      const actualizado = await tx.miniProyecto.update({
        where: { moduloId },
        data: {
          pesoCapa1: input.pesoCapa1,
          pesoCapa2: input.pesoCapa2,
          pesoCapa3: input.pesoCapa3,
        },
        select: MINIPROYECTO_DETALLE_SELECT,
      })

      await tx.logActividad.create({
        data: {
          actorId,
          tipoAccion: "CURSO_ACTUALIZADO",
          entidadTipo: ENTIDAD_TIPO_MINI,
          entidadId: actualizado.id,
          valorAntes: snapshotMiniProyecto(previo),
          valorDespues: snapshotMiniProyecto(actualizado),
        },
      })

      if (cursoActivo) {
        await tx.logActividad.create({
          data: {
            actorId,
            tipoAccion: "CURSO_PESOS_RECALCULO_PENDIENTE",
            entidadTipo: ENTIDAD_TIPO,
            entidadId: modulo.cursoId,
            valorAntes: snapshotMiniProyecto(previo),
            valorDespues: snapshotMiniProyecto(actualizado),
          },
        })
      }

      return actualizado.id
    })

    return this.obtenerPorId(nuevoId)
  }

  // ──────────────────────────────────────────────────────────────────
  // POST /umbral · ajustar override de umbral del módulo
  // ──────────────────────────────────────────────────────────────────

  async ajustarUmbral(
    cursoId: string,
    moduloId: string,
    input: AjustarUmbralMiniProyectoInput,
    actorId: string,
  ): Promise<MiniProyectoDetalleAdmin> {
    const modulo = await this.requireModulo(cursoId, moduloId)
    if (modulo.curso.estado === "CERRADO") {
      throw new ConflictException(ERROR_CURSO_CERRADO)
    }
    const previo = await this.requireMiniProyecto(moduloId)

    const nuevoId = await this.prisma.$transaction(async (tx) => {
      await tx.modulo.update({
        where: { id: moduloId },
        data: { umbralMiniOverride: input.umbralMiniOverride },
      })

      const actualizado = await tx.miniProyecto.findUniqueOrThrow({
        where: { moduloId },
        select: MINIPROYECTO_DETALLE_SELECT,
      })

      await tx.logActividad.create({
        data: {
          actorId,
          tipoAccion: "CURSO_ACTUALIZADO",
          entidadTipo: ENTIDAD_TIPO_MINI,
          entidadId: actualizado.id,
          valorAntes: snapshotMiniProyecto(previo),
          valorDespues: snapshotMiniProyecto(actualizado),
        },
      })

      return actualizado.id
    })

    return this.obtenerPorId(nuevoId)
  }

  // ──────────────────────────────────────────────────────────────────
  // Helpers privados
  // ──────────────────────────────────────────────────────────────────

  private async obtenerPorId(id: string): Promise<MiniProyectoDetalleAdmin> {
    const row = await this.prisma.miniProyecto.findUniqueOrThrow({
      where: { id },
      select: MINIPROYECTO_DETALLE_SELECT,
    })
    return mapMiniProyectoDetalle(row)
  }

  private async requireModulo(cursoId: string, moduloId: string) {
    const modulo = await this.prisma.modulo.findUnique({
      where: { id: moduloId },
      select: {
        id: true,
        cursoId: true,
        miniProyectoActivo: true,
        umbralMiniOverride: true,
        archivadoAt: true,
        curso: { select: { id: true, estado: true } },
      },
    })
    if (!modulo || modulo.cursoId !== cursoId || modulo.archivadoAt !== null) {
      throw new NotFoundException(ERROR_MODULO_NO_ENCONTRADO)
    }
    return modulo
  }

  private async requireMiniProyecto(moduloId: string): Promise<MiniProyectoDetalleRow> {
    const row = await this.prisma.miniProyecto.findUnique({
      where: { moduloId },
      select: MINIPROYECTO_DETALLE_SELECT,
    })
    if (!row) {
      throw new NotFoundException(ERROR_MINI_NO_ENCONTRADO)
    }
    return row
  }
}
