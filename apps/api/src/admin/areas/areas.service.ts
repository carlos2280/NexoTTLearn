import { ConflictException, Injectable, NotFoundException } from "@nestjs/common"
import type {
  ActualizarAreaInput,
  AreaConContadores,
  AreaDeleteResponse,
  AreaListResponse,
  CrearAreaInput,
  ListarAreasQuery,
} from "@nexott-learn/shared-types"
import { Prisma } from "@prisma/client"
import { PrismaService } from "../../common/prisma/prisma.service"
import { AREA_SELECT, type AreaRow, mapAreaToDto, mapAreaWithCountToDto } from "./areas.mapper"

const ENTIDAD_TIPO = "Area"

// MAESTRO §4.1, §14.3 · CRUD del catálogo global de áreas. PR-04 backend.
//
// Reglas no triviales que viven aquí:
// - Estado: ACTIVA por defecto; OBSOLETA solo via DELETE soft o restauración
//   inversa. POST/PATCH NO permiten setear estado directamente (lo bloquea
//   también el DTO, doble red).
// - Soft delete preferido (§17.1): si el área tiene CursoArea o Modulo
//   referenciándola, la marcamos OBSOLETA + obsoletaAt; hard delete solo si
//   ambos contadores están en 0.
// - Cada mutación va en `prisma.$transaction([...])` con un LogActividad
//   (T02·I3) cuyo tipoAccion es AREA_CREADA/ACTUALIZADA/OBSOLETADA/ELIMINADA.
//   `valorAntes` y `valorDespues` snapshots JSON del row, `actorId` = usuario
//   de sesión.

@Injectable()
export class AreasService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(query: ListarAreasQuery): Promise<AreaListResponse> {
    const { estado = "ACTIVA", q, page, pageSize } = query

    const where: Prisma.AreaWhereInput = { estado }
    if (q) {
      // Búsqueda case-insensitive sobre nombre. INDICES.md cubre filtro por
      // estado; el LIKE por nombre es escaneo lineal aceptable en MVP (catálogo
      // típico < 50 filas).
      where.nombre = { contains: q, mode: "insensitive" }
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.area.findMany({
        where,
        orderBy: [{ orden: "asc" }, { nombre: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: AREA_SELECT,
      }),
      this.prisma.area.count({ where }),
    ])

    return {
      items: items.map(mapAreaToDto),
      total,
      page,
      pageSize,
    }
  }

  async obtenerPorId(id: string): Promise<AreaConContadores> {
    const area = await this.prisma.area.findUnique({
      where: { id },
      select: {
        ...AREA_SELECT,
        _count: { select: { cursoAreas: true, modulos: true } },
      },
    })
    if (!area) {
      throw new NotFoundException("Area no encontrada")
    }
    return mapAreaWithCountToDto(area)
  }

  async crear(input: CrearAreaInput, actorId: string): Promise<AreaConContadores> {
    const nombre = input.nombre.trim()

    const duplicado = await this.prisma.area.findUnique({
      where: { nombre },
      select: { id: true },
    })
    if (duplicado) {
      throw new ConflictException(`Ya existe un area con el nombre "${nombre}"`)
    }

    const [areaCreada] = await this.prisma.$transaction(async (tx) => {
      const area = await tx.area.create({
        data: {
          nombre,
          color: input.color,
          descripcion: input.descripcion?.trim() ?? null,
          orden: input.orden,
        },
        select: AREA_SELECT,
      })
      await tx.logActividad.create({
        data: {
          actorId,
          tipoAccion: "AREA_CREADA",
          entidadTipo: ENTIDAD_TIPO,
          entidadId: area.id,
          valorAntes: Prisma.JsonNull,
          valorDespues: snapshot(area),
        },
      })
      return [area]
    })

    return this.obtenerPorId(areaCreada.id)
  }

  async actualizar(
    id: string,
    input: ActualizarAreaInput,
    actorId: string,
  ): Promise<AreaConContadores> {
    const previo = await this.prisma.area.findUnique({
      where: { id },
      select: AREA_SELECT,
    })
    if (!previo) {
      throw new NotFoundException("Area no encontrada")
    }

    const data: Prisma.AreaUpdateInput = {}
    if (input.nombre !== undefined) {
      data.nombre = input.nombre.trim()
    }
    if (input.color !== undefined) {
      data.color = input.color
    }
    if (input.descripcion !== undefined) {
      data.descripcion = input.descripcion?.trim() ?? null
    }
    if (input.orden !== undefined) {
      data.orden = input.orden
    }

    if (typeof data.nombre === "string" && data.nombre !== previo.nombre) {
      const duplicado = await this.prisma.area.findUnique({
        where: { nombre: data.nombre },
        select: { id: true },
      })
      if (duplicado && duplicado.id !== id) {
        throw new ConflictException(`Ya existe un area con el nombre "${data.nombre}"`)
      }
    }

    const actualizado = await this.prisma.$transaction(async (tx) => {
      const area = await tx.area.update({
        where: { id },
        data,
        select: AREA_SELECT,
      })
      await tx.logActividad.create({
        data: {
          actorId,
          tipoAccion: "AREA_ACTUALIZADA",
          entidadTipo: ENTIDAD_TIPO,
          entidadId: area.id,
          valorAntes: snapshot(previo),
          valorDespues: snapshot(area),
        },
      })
      return area
    })

    return this.obtenerPorId(actualizado.id)
  }

  async eliminar(id: string, actorId: string): Promise<AreaDeleteResponse> {
    const previo = await this.prisma.area.findUnique({
      where: { id },
      select: {
        ...AREA_SELECT,
        _count: { select: { cursoAreas: true, modulos: true } },
      },
    })
    if (!previo) {
      throw new NotFoundException("Area no encontrada")
    }

    const sinReferencias = previo._count.cursoAreas === 0 && previo._count.modulos === 0

    if (sinReferencias) {
      // Hard delete (§4.1): área sin uso. El admin la creó por error o duplicada.
      await this.prisma.$transaction(async (tx) => {
        await tx.area.delete({ where: { id } })
        await tx.logActividad.create({
          data: {
            actorId,
            tipoAccion: "AREA_ELIMINADA",
            entidadTipo: ENTIDAD_TIPO,
            entidadId: id,
            valorAntes: snapshot(previo),
            valorDespues: Prisma.JsonNull,
          },
        })
      })
      return { tipo: "ELIMINADA" }
    }

    // Soft delete (§17.1, T01·Q1.2): área con cursos referenciándola → OBSOLETA.
    // Si ya estaba OBSOLETA es no-op idempotente (no rompemos contrato).
    if (previo.estado === "OBSOLETA") {
      return { tipo: "OBSOLETADA" }
    }

    await this.prisma.$transaction(async (tx) => {
      const area = await tx.area.update({
        where: { id },
        data: { estado: "OBSOLETA", obsoletaAt: new Date() },
        select: AREA_SELECT,
      })
      await tx.logActividad.create({
        data: {
          actorId,
          tipoAccion: "AREA_OBSOLETADA",
          entidadTipo: ENTIDAD_TIPO,
          entidadId: id,
          valorAntes: snapshot(previo),
          valorDespues: snapshot(area),
        },
      })
    })

    return { tipo: "OBSOLETADA" }
  }

  async restaurar(id: string, actorId: string): Promise<AreaConContadores> {
    const previo = await this.prisma.area.findUnique({
      where: { id },
      select: AREA_SELECT,
    })
    if (!previo) {
      throw new NotFoundException("Area no encontrada")
    }
    if (previo.estado !== "OBSOLETA") {
      throw new ConflictException("Solo se puede restaurar un area en estado OBSOLETA")
    }

    const restaurada = await this.prisma.$transaction(async (tx) => {
      const area = await tx.area.update({
        where: { id },
        data: { estado: "ACTIVA", obsoletaAt: null },
        select: AREA_SELECT,
      })
      // MAESTRO mapea restaurar a AREA_ACTUALIZADA con snapshot que muestra el
      // cambio de estado. No hay TipoAccionLog específico de "restaurada" para
      // áreas (sí lo hay para bloques/secciones/módulos, pero no aquí).
      await tx.logActividad.create({
        data: {
          actorId,
          tipoAccion: "AREA_ACTUALIZADA",
          entidadTipo: ENTIDAD_TIPO,
          entidadId: id,
          valorAntes: snapshot(previo),
          valorDespues: snapshot(area),
        },
      })
      return area
    })

    return this.obtenerPorId(restaurada.id)
  }
}

// Snapshot JSON-serializable del area para LogActividad. Convertimos Date a
// ISO para que `Prisma.JsonValue` lo acepte sin perder información.
function snapshot(area: AreaRow): Prisma.InputJsonValue {
  return {
    id: area.id,
    nombre: area.nombre,
    color: area.color,
    descripcion: area.descripcion,
    orden: area.orden,
    estado: area.estado,
    obsoletaAt: area.obsoletaAt ? area.obsoletaAt.toISOString() : null,
    createdAt: area.createdAt.toISOString(),
    updatedAt: area.updatedAt.toISOString(),
  }
}
