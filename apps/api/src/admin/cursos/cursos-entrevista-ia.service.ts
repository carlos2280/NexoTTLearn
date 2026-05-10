import { ConflictException, Injectable, NotFoundException } from "@nestjs/common"
import type {
  ActualizarEntrevistaIAAdminInput,
  EntrevistaIADeleteAdminResponse,
  EntrevistaIADetalleAdmin,
  UpsertEntrevistaIAAdminInput,
} from "@nexott-learn/shared-types"
import { Prisma } from "@prisma/client"
import { PrismaService } from "../../common/prisma/prisma.service"
import {
  ENTREVISTA_IA_DETALLE_SELECT,
  type EntrevistaIADetalleRow,
  mapEntrevistaIADetalle,
  snapshotEntrevistaIA,
} from "./cursos.mapper"
import {
  ENTIDAD_TIPO,
  ENTIDAD_TIPO_ENTREVISTA_IA,
  ERROR_CURSO_NO_ENCONTRADO,
  ERROR_EI_CURSO_CERRADO,
  ERROR_EI_DELETE_CON_SESIONES,
  ERROR_EI_DELETE_NO_BORRADOR,
  ERROR_ENTREVISTA_IA_NO_ENCONTRADA,
} from "./cursos.types"

@Injectable()
export class CursosEntrevistaIAService {
  constructor(private readonly prisma: PrismaService) {}

  // ──────────────────────────────────────────────────────────────────
  // LECTURA
  // ──────────────────────────────────────────────────────────────────

  async obtener(cursoId: string): Promise<EntrevistaIADetalleAdmin> {
    await this.requireCurso(cursoId)
    const row = await this.requireEntrevista(cursoId)
    return mapEntrevistaIADetalle(row)
  }

  // ──────────────────────────────────────────────────────────────────
  // PUT (upsert) · escritura completa de la config
  // ──────────────────────────────────────────────────────────────────

  async upsert(
    cursoId: string,
    input: UpsertEntrevistaIAAdminInput,
    actorId: string,
  ): Promise<EntrevistaIADetalleAdmin> {
    const curso = await this.requireCurso(cursoId)
    if (curso.estado === "CERRADO") {
      throw new ConflictException(ERROR_EI_CURSO_CERRADO)
    }

    const existente = await this.prisma.entrevistaIAConfig.findUnique({
      where: { cursoId },
      select: ENTREVISTA_IA_DETALLE_SELECT,
    })

    const data = {
      perfilCliente: input.perfilCliente.trim(),
      contextoNegocio: input.contextoNegocio.trim(),
      umbralAprobacion: input.umbralAprobacion,
      numeroPreguntas: input.numeroPreguntas,
      modo: input.modo,
      maxIntentos: input.maxIntentos,
    }

    const nuevoId = await this.prisma.$transaction(async (tx) => {
      let resultado: EntrevistaIADetalleRow

      if (existente) {
        resultado = await tx.entrevistaIAConfig.update({
          where: { cursoId },
          data,
          select: ENTREVISTA_IA_DETALLE_SELECT,
        })
      } else {
        resultado = await tx.entrevistaIAConfig.create({
          data: { cursoId, ...data },
          select: ENTREVISTA_IA_DETALLE_SELECT,
        })
      }

      await tx.logActividad.create({
        data: {
          actorId,
          tipoAccion: "CURSO_ACTUALIZADO",
          entidadTipo: ENTIDAD_TIPO_ENTREVISTA_IA,
          entidadId: resultado.id,
          valorAntes: existente ? snapshotEntrevistaIA(existente) : Prisma.JsonNull,
          valorDespues: snapshotEntrevistaIA(resultado),
        },
      })

      return resultado.id
    })

    return this.obtenerPorId(nuevoId)
  }

  // ──────────────────────────────────────────────────────────────────
  // PATCH · actualización parcial
  // ──────────────────────────────────────────────────────────────────

  async actualizar(
    cursoId: string,
    input: ActualizarEntrevistaIAAdminInput,
    actorId: string,
  ): Promise<EntrevistaIADetalleAdmin> {
    const curso = await this.requireCurso(cursoId)
    if (curso.estado === "CERRADO") {
      throw new ConflictException(ERROR_EI_CURSO_CERRADO)
    }
    const previo = await this.requireEntrevista(cursoId)

    const data: Prisma.EntrevistaIAConfigUpdateInput = {}
    if (input.perfilCliente !== undefined) {
      data.perfilCliente = input.perfilCliente.trim()
    }
    if (input.contextoNegocio !== undefined) {
      data.contextoNegocio = input.contextoNegocio.trim()
    }
    if (input.umbralAprobacion !== undefined) {
      data.umbralAprobacion = input.umbralAprobacion
    }
    if (input.numeroPreguntas !== undefined) {
      data.numeroPreguntas = input.numeroPreguntas
    }
    if (input.modo !== undefined) {
      data.modo = input.modo
    }
    if (input.maxIntentos !== undefined) {
      data.maxIntentos = input.maxIntentos
    }

    const nuevoId = await this.prisma.$transaction(async (tx) => {
      const actualizado = await tx.entrevistaIAConfig.update({
        where: { cursoId },
        data,
        select: ENTREVISTA_IA_DETALLE_SELECT,
      })

      await tx.logActividad.create({
        data: {
          actorId,
          tipoAccion: "CURSO_ACTUALIZADO",
          entidadTipo: ENTIDAD_TIPO_ENTREVISTA_IA,
          entidadId: actualizado.id,
          valorAntes: snapshotEntrevistaIA(previo),
          valorDespues: snapshotEntrevistaIA(actualizado),
        },
      })

      return actualizado.id
    })

    return this.obtenerPorId(nuevoId)
  }

  // ──────────────────────────────────────────────────────────────────
  // DELETE
  // ──────────────────────────────────────────────────────────────────

  async eliminar(cursoId: string, actorId: string): Promise<EntrevistaIADeleteAdminResponse> {
    const curso = await this.requireCurso(cursoId)
    if (curso.estado !== "BORRADOR") {
      throw new ConflictException(ERROR_EI_DELETE_NO_BORRADOR)
    }
    const previo = await this.requireEntrevista(cursoId)

    const totalSesiones = await this.prisma.entrevistaIASesion.count({
      where: { configId: previo.id },
    })
    if (totalSesiones > 0) {
      throw new ConflictException(ERROR_EI_DELETE_CON_SESIONES)
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.entrevistaIAConfig.delete({ where: { id: previo.id } })

      await tx.logActividad.create({
        data: {
          actorId,
          tipoAccion: "CURSO_ACTUALIZADO",
          entidadTipo: ENTIDAD_TIPO_ENTREVISTA_IA,
          entidadId: previo.id,
          valorAntes: snapshotEntrevistaIA(previo),
          valorDespues: Prisma.JsonNull,
        },
      })

      // MAESTRO §9.7 + constraint SQL `curso_pesos_nivel_curso_suman_100`:
      // pesoAreas + pesoProyectoTransversal + pesoEntrevistaIA debe sumar 100
      // SIEMPRE (a nivel persistencia). Al desactivar entrevista, transferimos
      // su peso a pesoAreas para conservar el invariante. Si ya era 0 no
      // logueamos para no inflar el log con no-ops.
      const cursoPesos = await tx.curso.findUniqueOrThrow({
        where: { id: cursoId },
        select: { pesoAreas: true, pesoEntrevistaIA: true },
      })
      const pesoEntrevistaPrevio = Number(cursoPesos.pesoEntrevistaIA.toString())
      if (pesoEntrevistaPrevio !== 0) {
        const pesoAreasPrevio = Number(cursoPesos.pesoAreas.toString())
        const pesoAreasNuevo = Number((pesoAreasPrevio + pesoEntrevistaPrevio).toFixed(2))
        await tx.curso.update({
          where: { id: cursoId },
          data: { pesoAreas: pesoAreasNuevo, pesoEntrevistaIA: 0 },
        })
        await tx.logActividad.create({
          data: {
            actorId,
            tipoAccion: "CURSO_ACTUALIZADO",
            entidadTipo: ENTIDAD_TIPO,
            entidadId: cursoId,
            valorAntes: { pesoAreas: pesoAreasPrevio, pesoEntrevistaIA: pesoEntrevistaPrevio },
            valorDespues: { pesoAreas: pesoAreasNuevo, pesoEntrevistaIA: 0 },
          },
        })
      }
    })

    return { tipo: "ELIMINADO", id: previo.id }
  }

  // ──────────────────────────────────────────────────────────────────
  // Helpers privados
  // ──────────────────────────────────────────────────────────────────

  private async obtenerPorId(id: string): Promise<EntrevistaIADetalleAdmin> {
    const row = await this.prisma.entrevistaIAConfig.findUniqueOrThrow({
      where: { id },
      select: ENTREVISTA_IA_DETALLE_SELECT,
    })
    return mapEntrevistaIADetalle(row)
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

  private async requireEntrevista(cursoId: string): Promise<EntrevistaIADetalleRow> {
    const row = await this.prisma.entrevistaIAConfig.findUnique({
      where: { cursoId },
      select: ENTREVISTA_IA_DETALLE_SELECT,
    })
    if (!row) {
      throw new NotFoundException(ERROR_ENTREVISTA_IA_NO_ENCONTRADA)
    }
    return row
  }
}
