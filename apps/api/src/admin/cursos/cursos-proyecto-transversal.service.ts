import { ConflictException, Injectable, NotFoundException } from "@nestjs/common"
import type {
  ActualizarProyectoTransversalAdminInput,
  AjustarPesosProyectoTransversalInput,
  AjustarUmbralProyectoTransversalInput,
  ProyectoTransversalDeleteAdminResponse,
  ProyectoTransversalDetalleAdmin,
  UpsertProyectoTransversalAdminInput,
} from "@nexott-learn/shared-types"
import { Prisma } from "@prisma/client"
import { PrismaService } from "../../common/prisma/prisma.service"
import {
  PROYECTO_TRANSVERSAL_DETALLE_SELECT,
  type ProyectoTransversalDetalleRow,
  mapProyectoTransversalDetalle,
  snapshotProyectoTransversal,
} from "./cursos.mapper"
import {
  ENTIDAD_TIPO,
  ENTIDAD_TIPO_PROYECTO_TRANSVERSAL,
  ERROR_CURSO_NO_ENCONTRADO,
  ERROR_PROYECTO_TRANSVERSAL_NO_ENCONTRADO,
  ERROR_PT_CURSO_CERRADO,
  ERROR_PT_DELETE_CON_ENTREGAS,
  ERROR_PT_DELETE_NO_BORRADOR,
} from "./cursos.types"

@Injectable()
export class CursosProyectoTransversalService {
  constructor(private readonly prisma: PrismaService) {}

  // ──────────────────────────────────────────────────────────────────
  // LECTURA
  // ──────────────────────────────────────────────────────────────────

  async obtener(cursoId: string): Promise<ProyectoTransversalDetalleAdmin> {
    await this.requireCurso(cursoId)
    const row = await this.requireProyecto(cursoId)
    return mapProyectoTransversalDetalle(row)
  }

  // ──────────────────────────────────────────────────────────────────
  // PUT (upsert)
  // ──────────────────────────────────────────────────────────────────

  async upsert(
    cursoId: string,
    input: UpsertProyectoTransversalAdminInput,
    actorId: string,
  ): Promise<ProyectoTransversalDetalleAdmin> {
    const curso = await this.requireCurso(cursoId)
    if (curso.estado === "CERRADO") {
      throw new ConflictException(ERROR_PT_CURSO_CERRADO)
    }

    const existente = await this.prisma.proyectoTransversal.findUnique({
      where: { cursoId },
      select: PROYECTO_TRANSVERSAL_DETALLE_SELECT,
    })

    const nuevoId = await this.prisma.$transaction(async (tx) => {
      let resultado: ProyectoTransversalDetalleRow

      if (existente) {
        resultado = await tx.proyectoTransversal.update({
          where: { cursoId },
          data: {
            titulo: input.titulo.trim(),
            enunciado: input.enunciado.trim(),
          },
          select: PROYECTO_TRANSVERSAL_DETALLE_SELECT,
        })
      } else {
        resultado = await tx.proyectoTransversal.create({
          data: {
            cursoId,
            titulo: input.titulo.trim(),
            enunciado: input.enunciado.trim(),
          },
          select: PROYECTO_TRANSVERSAL_DETALLE_SELECT,
        })
      }

      await tx.logActividad.create({
        data: {
          actorId,
          tipoAccion: "CURSO_ACTUALIZADO",
          entidadTipo: ENTIDAD_TIPO_PROYECTO_TRANSVERSAL,
          entidadId: resultado.id,
          valorAntes: existente ? snapshotProyectoTransversal(existente) : Prisma.JsonNull,
          valorDespues: snapshotProyectoTransversal(resultado),
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
    input: ActualizarProyectoTransversalAdminInput,
    actorId: string,
  ): Promise<ProyectoTransversalDetalleAdmin> {
    const curso = await this.requireCurso(cursoId)
    if (curso.estado === "CERRADO") {
      throw new ConflictException(ERROR_PT_CURSO_CERRADO)
    }
    const previo = await this.requireProyecto(cursoId)

    const data: Prisma.ProyectoTransversalUpdateInput = {}
    if (input.titulo !== undefined) {
      data.titulo = input.titulo.trim()
    }
    if (input.enunciado !== undefined) {
      data.enunciado = input.enunciado.trim()
    }

    const nuevoId = await this.prisma.$transaction(async (tx) => {
      const actualizado = await tx.proyectoTransversal.update({
        where: { cursoId },
        data,
        select: PROYECTO_TRANSVERSAL_DETALLE_SELECT,
      })

      await tx.logActividad.create({
        data: {
          actorId,
          tipoAccion: "CURSO_ACTUALIZADO",
          entidadTipo: ENTIDAD_TIPO_PROYECTO_TRANSVERSAL,
          entidadId: actualizado.id,
          valorAntes: snapshotProyectoTransversal(previo),
          valorDespues: snapshotProyectoTransversal(actualizado),
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
    actorId: string,
  ): Promise<ProyectoTransversalDeleteAdminResponse> {
    const curso = await this.requireCurso(cursoId)
    if (curso.estado !== "BORRADOR") {
      throw new ConflictException(ERROR_PT_DELETE_NO_BORRADOR)
    }
    const previo = await this.requireProyecto(cursoId)

    const totalEntregas = await this.prisma.entregaProyecto.count({
      where: { transversalId: previo.id },
    })
    if (totalEntregas > 0) {
      throw new ConflictException(ERROR_PT_DELETE_CON_ENTREGAS)
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.proyectoTransversal.delete({ where: { id: previo.id } })

      await tx.logActividad.create({
        data: {
          actorId,
          tipoAccion: "CURSO_ACTUALIZADO",
          entidadTipo: ENTIDAD_TIPO_PROYECTO_TRANSVERSAL,
          entidadId: previo.id,
          valorAntes: snapshotProyectoTransversal(previo),
          valorDespues: Prisma.JsonNull,
        },
      })

      // MAESTRO §9.7 + constraint SQL `curso_pesos_nivel_curso_suman_100`:
      // pesoAreas + pesoProyectoTransversal + pesoEntrevistaIA debe sumar 100
      // SIEMPRE (a nivel persistencia). Al desactivar transversal, transferimos
      // su peso a pesoAreas para conservar el invariante. Si ya era 0 no
      // logueamos para no inflar el log con no-ops.
      const cursoPesos = await tx.curso.findUniqueOrThrow({
        where: { id: cursoId },
        select: { pesoAreas: true, pesoProyectoTransversal: true },
      })
      const pesoTransversalPrevio = Number(cursoPesos.pesoProyectoTransversal.toString())
      if (pesoTransversalPrevio !== 0) {
        const pesoAreasPrevio = Number(cursoPesos.pesoAreas.toString())
        const pesoAreasNuevo = Number((pesoAreasPrevio + pesoTransversalPrevio).toFixed(2))
        await tx.curso.update({
          where: { id: cursoId },
          data: { pesoAreas: pesoAreasNuevo, pesoProyectoTransversal: 0 },
        })
        await tx.logActividad.create({
          data: {
            actorId,
            tipoAccion: "CURSO_ACTUALIZADO",
            entidadTipo: ENTIDAD_TIPO,
            entidadId: cursoId,
            valorAntes: {
              pesoAreas: pesoAreasPrevio,
              pesoProyectoTransversal: pesoTransversalPrevio,
            },
            valorDespues: { pesoAreas: pesoAreasNuevo, pesoProyectoTransversal: 0 },
          },
        })
      }
    })

    return { tipo: "ELIMINADO", id: previo.id }
  }

  // ──────────────────────────────────────────────────────────────────
  // POST /pesos · ajustar pesos de las 3 capas
  // ──────────────────────────────────────────────────────────────────

  async ajustarPesos(
    cursoId: string,
    input: AjustarPesosProyectoTransversalInput,
    actorId: string,
  ): Promise<ProyectoTransversalDetalleAdmin> {
    const curso = await this.requireCurso(cursoId)
    if (curso.estado === "CERRADO") {
      throw new ConflictException(ERROR_PT_CURSO_CERRADO)
    }
    const previo = await this.requireProyecto(cursoId)
    const cursoActivo = curso.estado === "ACTIVO"

    const nuevoId = await this.prisma.$transaction(async (tx) => {
      const actualizado = await tx.proyectoTransversal.update({
        where: { cursoId },
        data: {
          pesoCapa1: input.pesoCapa1,
          pesoCapa2: input.pesoCapa2,
          pesoCapa3: input.pesoCapa3,
        },
        select: PROYECTO_TRANSVERSAL_DETALLE_SELECT,
      })

      await tx.logActividad.create({
        data: {
          actorId,
          tipoAccion: "CURSO_ACTUALIZADO",
          entidadTipo: ENTIDAD_TIPO_PROYECTO_TRANSVERSAL,
          entidadId: actualizado.id,
          valorAntes: snapshotProyectoTransversal(previo),
          valorDespues: snapshotProyectoTransversal(actualizado),
        },
      })

      if (cursoActivo) {
        await tx.logActividad.create({
          data: {
            actorId,
            tipoAccion: "CURSO_PESOS_RECALCULO_PENDIENTE",
            entidadTipo: ENTIDAD_TIPO,
            entidadId: cursoId,
            valorAntes: snapshotProyectoTransversal(previo),
            valorDespues: snapshotProyectoTransversal(actualizado),
          },
        })
      }

      return actualizado.id
    })

    return this.obtenerPorId(nuevoId)
  }

  // ──────────────────────────────────────────────────────────────────
  // POST /umbral · ajustar umbralAprobacion del proyecto
  // ──────────────────────────────────────────────────────────────────

  async ajustarUmbral(
    cursoId: string,
    input: AjustarUmbralProyectoTransversalInput,
    actorId: string,
  ): Promise<ProyectoTransversalDetalleAdmin> {
    const curso = await this.requireCurso(cursoId)
    if (curso.estado === "CERRADO") {
      throw new ConflictException(ERROR_PT_CURSO_CERRADO)
    }
    const previo = await this.requireProyecto(cursoId)

    const nuevoId = await this.prisma.$transaction(async (tx) => {
      const actualizado = await tx.proyectoTransversal.update({
        where: { cursoId },
        data: { umbralAprobacion: input.umbralAprobacion },
        select: PROYECTO_TRANSVERSAL_DETALLE_SELECT,
      })

      await tx.logActividad.create({
        data: {
          actorId,
          tipoAccion: "CURSO_ACTUALIZADO",
          entidadTipo: ENTIDAD_TIPO_PROYECTO_TRANSVERSAL,
          entidadId: actualizado.id,
          valorAntes: snapshotProyectoTransversal(previo),
          valorDespues: snapshotProyectoTransversal(actualizado),
        },
      })

      return actualizado.id
    })

    return this.obtenerPorId(nuevoId)
  }

  // ──────────────────────────────────────────────────────────────────
  // Helpers privados
  // ──────────────────────────────────────────────────────────────────

  private async obtenerPorId(id: string): Promise<ProyectoTransversalDetalleAdmin> {
    const row = await this.prisma.proyectoTransversal.findUniqueOrThrow({
      where: { id },
      select: PROYECTO_TRANSVERSAL_DETALLE_SELECT,
    })
    return mapProyectoTransversalDetalle(row)
  }

  private async requireCurso(cursoId: string) {
    const curso = await this.prisma.curso.findUnique({
      where: { id: cursoId },
      select: { id: true, estado: true },
    })
    if (!curso) {
      throw new NotFoundException(ERROR_CURSO_NO_ENCONTRADO)
    }
    return curso
  }

  private async requireProyecto(cursoId: string): Promise<ProyectoTransversalDetalleRow> {
    const row = await this.prisma.proyectoTransversal.findUnique({
      where: { cursoId },
      select: PROYECTO_TRANSVERSAL_DETALLE_SELECT,
    })
    if (!row) {
      throw new NotFoundException(ERROR_PROYECTO_TRANSVERSAL_NO_ENCONTRADO)
    }
    return row
  }
}
