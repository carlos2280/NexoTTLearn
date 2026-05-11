import { ConflictException, Injectable, NotFoundException } from "@nestjs/common"
import {
  ActualizarAreaInput,
  AreaResponse,
  CrearAreaInput,
  ListarAreasQuery,
  Paginated,
} from "@nexott-learn/shared-types"
import { AccionAuditoria, Prisma } from "@prisma/client"
import { AuditLogService } from "../../common/audit/audit-log.service"
import { ContextoHttpAuditoria } from "../../common/audit/audit-log.types"
import { apiErrorCodes } from "../../common/errors/api-error.codes"
import { buildPaginatedResponse, resolvePaginacion } from "../../common/http/paginated"
import { PrismaService } from "../../common/prisma/prisma.service"

const SELECT_AREA_FIELDS = {
  id: true,
  nombre: true,
  descripcion: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.AreaSelect

type AreaRow = Prisma.AreaGetPayload<{ select: typeof SELECT_AREA_FIELDS }>

function toAreaResponse(row: AreaRow): AreaResponse {
  return {
    id: row.id,
    nombre: row.nombre,
    descripcion: row.descripcion,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

function esViolacionUniqueNombre(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002" &&
    Array.isArray(error.meta?.target) &&
    (error.meta.target as readonly string[]).some((c) => c === "nombre" || c === "areas_nombre_key")
  )
}

@Injectable()
export class AreasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async listar(query: ListarAreasQuery): Promise<Paginated<AreaResponse>> {
    const { q } = query
    const { skip, take, page, pageSize } = resolvePaginacion(query)
    const where: Prisma.AreaWhereInput = q ? { nombre: { contains: q, mode: "insensitive" } } : {}

    const [filas, total] = await this.prisma.$transaction([
      this.prisma.area.findMany({
        where,
        select: SELECT_AREA_FIELDS,
        orderBy: { nombre: "asc" },
        take,
        skip,
      }),
      this.prisma.area.count({ where }),
    ])

    return buildPaginatedResponse(filas.map(toAreaResponse), total, page, pageSize)
  }

  async obtenerPorIdOrThrow(id: string): Promise<AreaResponse> {
    const fila = await this.prisma.area.findUnique({
      where: { id },
      select: SELECT_AREA_FIELDS,
    })
    if (!fila) {
      throw new NotFoundException({
        code: apiErrorCodes.areaNoEncontrada,
        message: "Area no encontrada.",
      })
    }
    return toAreaResponse(fila)
  }

  async crear(
    input: CrearAreaInput,
    adminUsuarioId: string,
    contexto: ContextoHttpAuditoria = {},
  ): Promise<AreaResponse> {
    try {
      const fila = await this.prisma.area.create({
        data: {
          nombre: input.nombre,
          descripcion: input.descripcion,
        },
        select: SELECT_AREA_FIELDS,
      })
      await this.auditLog.record({
        usuarioId: adminUsuarioId,
        accion: AccionAuditoria.AREA_CREADA,
        exito: true,
        recursoTipo: "area",
        recursoId: fila.id,
        ...contexto,
      })
      return toAreaResponse(fila)
    } catch (error) {
      if (esViolacionUniqueNombre(error)) {
        throw new ConflictException({
          code: apiErrorCodes.conflictAreaNombreDuplicado,
          message: "Ya existe un area con ese nombre.",
        })
      }
      throw error
    }
  }

  async actualizar(
    id: string,
    input: ActualizarAreaInput,
    adminUsuarioId: string,
    contexto: ContextoHttpAuditoria = {},
  ): Promise<AreaResponse> {
    const actual = await this.prisma.area.findUnique({
      where: { id },
      select: SELECT_AREA_FIELDS,
    })
    if (!actual) {
      throw new NotFoundException({
        code: apiErrorCodes.areaNoEncontrada,
        message: "Area no encontrada.",
      })
    }

    const data: Prisma.AreaUpdateInput = {}
    if (input.nombre !== undefined) {
      data.nombre = input.nombre
    }
    if (input.descripcion !== undefined) {
      data.descripcion = input.descripcion
    }

    try {
      const fila = await this.prisma.area.update({
        where: { id },
        data,
        select: SELECT_AREA_FIELDS,
      })

      await this.auditLog.record({
        usuarioId: adminUsuarioId,
        accion: AccionAuditoria.AREA_ACTUALIZADA,
        exito: true,
        recursoTipo: "area",
        recursoId: id,
        ...contexto,
      })
      return toAreaResponse(fila)
    } catch (error) {
      if (esViolacionUniqueNombre(error)) {
        throw new ConflictException({
          code: apiErrorCodes.conflictAreaNombreDuplicado,
          message: "Ya existe un area con ese nombre.",
        })
      }
      throw error
    }
  }

  async eliminar(
    id: string,
    adminUsuarioId: string,
    contexto: ContextoHttpAuditoria = {},
  ): Promise<void> {
    const area = await this.prisma.area.findUnique({
      where: { id },
      select: { id: true },
    })
    if (!area) {
      throw new NotFoundException({
        code: apiErrorCodes.areaNoEncontrada,
        message: "Area no encontrada.",
      })
    }
    const skillsCount = await this.prisma.skill.count({ where: { areaId: id } })
    if (skillsCount > 0) {
      throw new ConflictException({
        code: apiErrorCodes.conflictAreaConSkills,
        message: "No se puede eliminar el area: tiene skills asociadas.",
        details: { skillsCount },
      })
    }
    await this.prisma.area.delete({ where: { id } })
    await this.auditLog.record({
      usuarioId: adminUsuarioId,
      accion: AccionAuditoria.AREA_ELIMINADA,
      exito: true,
      recursoTipo: "area",
      recursoId: id,
      ...contexto,
    })
  }
}
