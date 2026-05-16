import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from "@nestjs/common"
import {
  ActualizarClienteInput,
  ClienteDetalleResponse,
  ClienteResponse,
  CrearClienteInput,
  ListarClientesQuery,
  Paginated,
} from "@nexott-learn/shared-types"
import { AccionAuditoria, Prisma } from "@prisma/client"
import { AuditLogService } from "../../common/audit/audit-log.service"
import { ContextoHttpAuditoria } from "../../common/audit/audit-log.types"
import { apiErrorCodes } from "../../common/errors/api-error.codes"
import { buildPaginatedResponse, resolvePaginacion } from "../../common/http/paginated"
import { PrismaService } from "../../common/prisma/prisma.service"

const SELECT_CLIENTE_FIELDS = {
  id: true,
  nombre: true,
  activo: true,
  fechaCreacion: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.ClienteSelect

const SELECT_CLIENTE_DETALLE_FIELDS = {
  ...SELECT_CLIENTE_FIELDS,
  datosContacto: true,
} as const satisfies Prisma.ClienteSelect

type ClienteRow = Prisma.ClienteGetPayload<{ select: typeof SELECT_CLIENTE_FIELDS }>
type ClienteDetalleRow = Prisma.ClienteGetPayload<{ select: typeof SELECT_CLIENTE_DETALLE_FIELDS }>

function toClienteResponse(row: ClienteRow): ClienteResponse {
  return {
    id: row.id,
    nombre: row.nombre,
    activo: row.activo,
    fechaCreacion: row.fechaCreacion.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

function toClienteDetalleResponse(row: ClienteDetalleRow): ClienteDetalleResponse {
  return {
    ...toClienteResponse(row),
    datosContacto:
      row.datosContacto === null || row.datosContacto === undefined
        ? null
        : (row.datosContacto as Record<string, unknown>),
  }
}

interface CambiosCliente {
  readonly cambiaNombre: boolean
  readonly cambiaActivo: boolean
  readonly cambiaContacto: boolean
}

function construirUpdateCliente(
  input: ActualizarClienteInput,
  cambios: CambiosCliente,
): { readonly data: Prisma.ClienteUpdateInput; readonly camposCambiados: readonly string[] } {
  const camposCambiados: string[] = []
  const data: Prisma.ClienteUpdateInput = {}
  if (cambios.cambiaNombre) {
    data.nombre = input.nombre
    camposCambiados.push("nombre")
  }
  if (cambios.cambiaActivo) {
    data.activo = input.activo
    camposCambiados.push("activo")
  }
  if (cambios.cambiaContacto) {
    data.datosContacto =
      input.datosContacto === null
        ? Prisma.JsonNull
        : (input.datosContacto as Prisma.InputJsonObject)
    camposCambiados.push("datosContacto")
  }
  return { data, camposCambiados }
}

function esViolacionUniqueNombre(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002" &&
    Array.isArray(error.meta?.target) &&
    (error.meta.target as readonly string[]).some(
      (c) => c === "nombre" || c === "clientes_nombre_key",
    )
  )
}

@Injectable()
export class ClientesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async listar(query: ListarClientesQuery): Promise<Paginated<ClienteResponse>> {
    const { activo, q } = query
    const { skip, take, page, pageSize } = resolvePaginacion(query)
    const where: Prisma.ClienteWhereInput = {
      deletedAt: null,
      ...(activo !== undefined ? { activo } : {}),
      ...(q ? { nombre: { contains: q, mode: "insensitive" } } : {}),
    }

    const [filas, total] = await this.prisma.$transaction([
      this.prisma.cliente.findMany({
        where,
        select: SELECT_CLIENTE_FIELDS,
        orderBy: { nombre: "asc" },
        take,
        skip,
      }),
      this.prisma.cliente.count({ where }),
    ])

    return buildPaginatedResponse(filas.map(toClienteResponse), total, page, pageSize)
  }

  async obtenerPorIdOrThrow(id: string): Promise<ClienteDetalleResponse> {
    const fila = await this.prisma.cliente.findFirst({
      where: { id, deletedAt: null },
      select: SELECT_CLIENTE_DETALLE_FIELDS,
    })
    if (!fila) {
      throw new NotFoundException({
        code: apiErrorCodes.clienteNoEncontrado,
        message: "Cliente no encontrado.",
      })
    }
    return toClienteDetalleResponse(fila)
  }

  async crear(
    input: CrearClienteInput,
    adminUsuarioId: string,
    contexto: ContextoHttpAuditoria = {},
  ): Promise<ClienteDetalleResponse> {
    try {
      const fila = await this.prisma.cliente.create({
        data: {
          nombre: input.nombre,
          datosContacto: input.datosContacto as Prisma.InputJsonValue | undefined,
        },
        select: SELECT_CLIENTE_DETALLE_FIELDS,
      })
      await this.auditLog.record({
        usuarioId: adminUsuarioId,
        accion: AccionAuditoria.CLIENTE_CREADO,
        exito: true,
        recursoTipo: "cliente",
        recursoId: fila.id,
        ...contexto,
      })
      return toClienteDetalleResponse(fila)
    } catch (error) {
      if (esViolacionUniqueNombre(error)) {
        throw new ConflictException({
          code: apiErrorCodes.conflictClienteNombreDuplicado,
          message: "Ya existe un cliente con ese nombre.",
        })
      }
      throw error
    }
  }

  async actualizar(
    id: string,
    input: ActualizarClienteInput,
    motivo: string | undefined,
    adminUsuarioId: string,
    contexto: ContextoHttpAuditoria = {},
  ): Promise<ClienteDetalleResponse> {
    const actual = await this.prisma.cliente.findFirst({
      where: { id, deletedAt: null },
      select: SELECT_CLIENTE_FIELDS,
    })
    if (!actual) {
      throw new NotFoundException({
        code: apiErrorCodes.clienteNoEncontrado,
        message: "Cliente no encontrado.",
      })
    }

    const cambiaNombre = input.nombre !== undefined && input.nombre !== actual.nombre
    const cambiaActivo = input.activo !== undefined && input.activo !== actual.activo
    const cambiaContacto = input.datosContacto !== undefined
    if ((cambiaNombre || cambiaActivo) && (motivo === undefined || motivo.length === 0)) {
      throw new HttpException(
        {
          code: apiErrorCodes.motivoRequerido,
          message: "Se requiere X-Motivo para cambiar nombre o activo del cliente.",
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      )
    }

    const { data, camposCambiados } = construirUpdateCliente(input, {
      cambiaNombre,
      cambiaActivo,
      cambiaContacto,
    })
    if (camposCambiados.length === 0) {
      // No-op: devolvemos el detalle actual sin auditar.
      return this.obtenerPorIdOrThrow(id)
    }

    try {
      const fila = await this.prisma.cliente.update({
        where: { id },
        data,
        select: SELECT_CLIENTE_DETALLE_FIELDS,
      })
      const metadata: Record<string, Prisma.InputJsonValue> = { camposCambiados }
      if ((cambiaNombre || cambiaActivo) && motivo) {
        metadata.motivo = motivo
      }
      await this.auditLog.record({
        usuarioId: adminUsuarioId,
        accion: AccionAuditoria.CLIENTE_ACTUALIZADO,
        exito: true,
        recursoTipo: "cliente",
        recursoId: id,
        metadata,
        ...contexto,
      })
      return toClienteDetalleResponse(fila)
    } catch (error) {
      if (esViolacionUniqueNombre(error)) {
        throw new ConflictException({
          code: apiErrorCodes.conflictClienteNombreDuplicado,
          message: "Ya existe un cliente con ese nombre.",
        })
      }
      throw error
    }
  }

  async eliminar(
    id: string,
    motivo: string,
    adminUsuarioId: string,
    contexto: ContextoHttpAuditoria = {},
  ): Promise<void> {
    const actual = await this.prisma.cliente.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    })
    if (!actual) {
      throw new NotFoundException({
        code: apiErrorCodes.clienteNoEncontrado,
        message: "Cliente no encontrado.",
      })
    }
    const totalCursos = await this.prisma.curso.count({ where: { clienteId: id } })
    if (totalCursos > 0) {
      throw new ConflictException({
        code: apiErrorCodes.conflictClienteConCursos,
        message: "No se puede eliminar el cliente: tiene cursos asociados.",
        details: { totalCursos },
      })
    }

    await this.prisma.cliente.update({
      where: { id },
      data: { deletedAt: new Date(), activo: false },
      select: { id: true },
    })
    await this.auditLog.record({
      usuarioId: adminUsuarioId,
      accion: AccionAuditoria.CLIENTE_ELIMINADO,
      exito: true,
      recursoTipo: "cliente",
      recursoId: id,
      metadata: { motivo },
      ...contexto,
    })
  }
}
