import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common"
import {
  ActualizarSeccionInput,
  CrearSeccionInput,
  ListarSeccionesQuery,
  Paginated,
  ReordenarSeccionesInput,
  SeccionResponse,
} from "@nexott-learn/shared-types"
import { AccionAuditoria, EstadoBloque, EstadoSkill, Prisma } from "@prisma/client"
import { AuditLogService } from "../../common/audit/audit-log.service"
import { ContextoHttpAuditoria } from "../../common/audit/audit-log.types"
import { apiErrorCodes } from "../../common/errors/api-error.codes"
import { buildPaginatedResponse, resolvePaginacion } from "../../common/http/paginated"
import { PrismaService } from "../../common/prisma/prisma.service"

// Offset temporal usado en el reorder para liberar slots y no violar el unique
// compuesto `[moduloId, orden]`. Mayor que cualquier `orden` razonable (max 10k
// por la validacion Zod), por lo que no colisiona con valores existentes.
const REORDEN_OFFSET = 1_000_000

const SELECT_SECCION_FIELDS = {
  id: true,
  moduloId: true,
  titulo: true,
  orden: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.SeccionSelect

type SeccionRow = Prisma.SeccionGetPayload<{ select: typeof SELECT_SECCION_FIELDS }>

function toSeccionResponse(row: SeccionRow): SeccionResponse {
  return {
    id: row.id,
    moduloId: row.moduloId,
    titulo: row.titulo,
    orden: row.orden,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

@Injectable()
export class SeccionesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async listar(query: ListarSeccionesQuery): Promise<Paginated<SeccionResponse>> {
    const { moduloId } = query
    const { skip, take, page, pageSize } = resolvePaginacion(query)
    const where: Prisma.SeccionWhereInput = moduloId ? { moduloId } : {}

    const [filas, total] = await this.prisma.$transaction([
      this.prisma.seccion.findMany({
        where,
        select: SELECT_SECCION_FIELDS,
        orderBy: [{ moduloId: "asc" }, { orden: "asc" }],
        take,
        skip,
      }),
      this.prisma.seccion.count({ where }),
    ])

    return buildPaginatedResponse(filas.map(toSeccionResponse), total, page, pageSize)
  }

  async obtenerPorIdOrThrow(id: string): Promise<SeccionResponse> {
    const fila = await this.prisma.seccion.findUnique({
      where: { id },
      select: SELECT_SECCION_FIELDS,
    })
    if (!fila) {
      throw new NotFoundException({
        code: apiErrorCodes.seccionNoEncontrada,
        message: "Seccion no encontrada.",
      })
    }
    return toSeccionResponse(fila)
  }

  async crear(
    moduloId: string,
    input: CrearSeccionInput,
    adminUsuarioId: string,
    contexto: ContextoHttpAuditoria = {},
  ): Promise<SeccionResponse> {
    const modulo = await this.prisma.modulo.findFirst({
      where: { id: moduloId, deletedAt: null },
      select: { id: true },
    })
    if (!modulo) {
      throw new NotFoundException({
        code: apiErrorCodes.moduloNoEncontrado,
        message: "Modulo no encontrado.",
      })
    }
    if (input.skillIds && input.skillIds.length > 0) {
      await this.validarSkillsActivas(input.skillIds)
    }

    const fila = await this.prisma.$transaction(async (tx) => {
      let ordenFinal: number
      if (input.orden !== undefined) {
        const existente = await tx.seccion.findFirst({
          where: { moduloId, orden: input.orden },
          select: { id: true },
        })
        if (existente) {
          throw new ConflictException({
            code: apiErrorCodes.seccionOrdenDuplicado,
            message: "Ya existe una seccion con ese orden en el modulo.",
          })
        }
        ordenFinal = input.orden
      } else {
        const max = await tx.seccion.aggregate({
          where: { moduloId },
          _max: { orden: true },
        })
        ordenFinal = (max._max.orden ?? 0) + 1
      }

      const creada = await tx.seccion.create({
        data: { moduloId, titulo: input.titulo, orden: ordenFinal },
        select: SELECT_SECCION_FIELDS,
      })

      if (input.skillIds && input.skillIds.length > 0) {
        await tx.seccionSkill.createMany({
          data: input.skillIds.map((skillId) => ({ seccionId: creada.id, skillId })),
        })
      }

      return creada
    })

    await this.auditLog.record({
      usuarioId: adminUsuarioId,
      accion: AccionAuditoria.SECCION_CREADA,
      exito: true,
      recursoTipo: "seccion",
      recursoId: fila.id,
      metadata: { moduloId, totalSkills: input.skillIds?.length ?? 0 },
      ...contexto,
    })
    return toSeccionResponse(fila)
  }

  async actualizar(
    moduloId: string,
    seccionId: string,
    input: ActualizarSeccionInput,
    adminUsuarioId: string,
    contexto: ContextoHttpAuditoria = {},
  ): Promise<SeccionResponse> {
    const actual = await this.prisma.seccion.findFirst({
      where: { id: seccionId, moduloId },
      select: SELECT_SECCION_FIELDS,
    })
    if (!actual) {
      throw new NotFoundException({
        code: apiErrorCodes.seccionNoEncontrada,
        message: "Seccion no encontrada.",
      })
    }
    if (input.skillIds) {
      await this.validarSkillsActivas(input.skillIds)
    }

    const camposCambiados: string[] = []
    const fila = await this.prisma.$transaction(async (tx) => {
      const actualizada = await this.aplicarCambiosTitulo(
        tx,
        seccionId,
        actual,
        input,
        camposCambiados,
      )
      if (input.skillIds) {
        const diff = await this.aplicarDiffSkills(tx, seccionId, input.skillIds)
        if (diff.cambio) {
          camposCambiados.push("skillIds")
        }
      }
      return actualizada
    })

    await this.auditLog.record({
      usuarioId: adminUsuarioId,
      accion: AccionAuditoria.SECCION_ACTUALIZADA,
      exito: true,
      recursoTipo: "seccion",
      recursoId: seccionId,
      metadata: { camposCambiados },
      ...contexto,
    })
    return toSeccionResponse(fila)
  }

  private async aplicarCambiosTitulo(
    tx: Prisma.TransactionClient,
    seccionId: string,
    actual: SeccionRow,
    input: ActualizarSeccionInput,
    camposCambiados: string[],
  ): Promise<SeccionRow> {
    if (input.titulo === undefined || input.titulo === actual.titulo) {
      return actual
    }
    camposCambiados.push("titulo")
    return tx.seccion.update({
      where: { id: seccionId },
      data: { titulo: input.titulo },
      select: SELECT_SECCION_FIELDS,
    })
  }

  private async aplicarDiffSkills(
    tx: Prisma.TransactionClient,
    seccionId: string,
    skillIds: readonly string[],
  ): Promise<{ readonly cambio: boolean }> {
    const actualesRows = await tx.seccionSkill.findMany({
      where: { seccionId },
      select: { skillId: true },
    })
    const actuales = new Set(actualesRows.map((s) => s.skillId))
    const objetivo = new Set(skillIds)
    const aEliminar = [...actuales].filter((s) => !objetivo.has(s))
    const aAgregar = [...objetivo].filter((s) => !actuales.has(s))
    if (aEliminar.length > 0) {
      await tx.seccionSkill.deleteMany({
        where: { seccionId, skillId: { in: aEliminar } },
      })
    }
    if (aAgregar.length > 0) {
      await tx.seccionSkill.createMany({
        data: aAgregar.map((skillId) => ({ seccionId, skillId })),
      })
    }
    return { cambio: aEliminar.length > 0 || aAgregar.length > 0 }
  }

  private async validarSkillsActivas(skillIds: readonly string[]): Promise<void> {
    if (skillIds.length === 0) {
      return
    }
    const filas = await this.prisma.skill.findMany({
      where: { id: { in: [...skillIds] } },
      select: { id: true, estado: true },
    })
    if (filas.length !== skillIds.length) {
      throw new NotFoundException({
        code: apiErrorCodes.skillNoEncontrada,
        message: "Una o mas skills no fueron encontradas.",
      })
    }
    const inactivas = filas.filter((s) => s.estado !== EstadoSkill.ACTIVA)
    if (inactivas.length > 0) {
      throw new ConflictException({
        code: apiErrorCodes.skillNoActiva,
        message: "Una o mas skills no estan ACTIVAS.",
        details: { skillIds: inactivas.map((s) => s.id) },
      })
    }
  }

  /**
   * Reordenar secciones (D-CAT-19): se aplica en dos pasos dentro del mismo
   * `$transaction` para evitar violar el unique compuesto `[moduloId, orden]`.
   * Paso 1: bumpear todas las secciones del modulo con un offset temporal
   * (`orden + REORDEN_OFFSET`). Paso 2: aplicar los `orden` finales uno a uno.
   * Validacion previa: el set de `seccionId` del input debe coincidir
   * exactamente con el set de secciones del modulo (no faltan, no sobran).
   */
  async reordenar(
    moduloId: string,
    input: ReordenarSeccionesInput,
    adminUsuarioId: string,
    contexto: ContextoHttpAuditoria = {},
  ): Promise<void> {
    const modulo = await this.prisma.modulo.findFirst({
      where: { id: moduloId, deletedAt: null },
      select: { id: true },
    })
    if (!modulo) {
      throw new NotFoundException({
        code: apiErrorCodes.moduloNoEncontrado,
        message: "Modulo no encontrado.",
      })
    }

    await this.prisma.$transaction(async (tx) => {
      const actuales = await tx.seccion.findMany({
        where: { moduloId },
        select: { id: true },
      })
      const actualesIds = new Set(actuales.map((s) => s.id))
      const inputIds = new Set(input.orden.map((o) => o.seccionId))
      if (actualesIds.size !== inputIds.size) {
        throw new BadRequestException({
          code: apiErrorCodes.seccionOrdenInvalido,
          message: "La permutacion no cubre exactamente las secciones del modulo.",
          details: { esperado: actualesIds.size, recibido: inputIds.size },
        })
      }
      for (const id of inputIds) {
        if (!actualesIds.has(id)) {
          throw new BadRequestException({
            code: apiErrorCodes.seccionOrdenInvalido,
            message: "Algun seccionId no pertenece al modulo.",
          })
        }
      }

      // Paso 1: liberar slots con offset temporal.
      for (const s of actuales) {
        await tx.seccion.update({
          where: { id: s.id },
          data: { orden: { increment: REORDEN_OFFSET } },
          select: { id: true },
        })
      }
      // Paso 2: aplicar el orden final.
      for (const o of input.orden) {
        await tx.seccion.update({
          where: { id: o.seccionId },
          data: { orden: o.orden },
          select: { id: true },
        })
      }
    })

    await this.auditLog.record({
      usuarioId: adminUsuarioId,
      accion: AccionAuditoria.SECCION_REORDENADA,
      exito: true,
      recursoTipo: "modulo",
      recursoId: moduloId,
      metadata: { totalSecciones: input.orden.length },
      ...contexto,
    })
  }

  async eliminar(
    moduloId: string,
    seccionId: string,
    motivo: string,
    adminUsuarioId: string,
    contexto: ContextoHttpAuditoria = {},
  ): Promise<void> {
    const actual = await this.prisma.seccion.findFirst({
      where: { id: seccionId, moduloId },
      select: { id: true },
    })
    if (!actual) {
      throw new NotFoundException({
        code: apiErrorCodes.seccionNoEncontrada,
        message: "Seccion no encontrada.",
      })
    }
    const bloquesActivos = await this.prisma.bloque.count({
      where: { seccionId, estado: { not: EstadoBloque.ELIMINADO } },
    })
    if (bloquesActivos > 0) {
      throw new ConflictException({
        code: apiErrorCodes.conflictSeccionConBloquesActivos,
        message: "No se puede eliminar la seccion: tiene bloques activos.",
        details: { totalBloques: bloquesActivos },
      })
    }

    await this.prisma.$transaction(async (tx) => {
      // SeccionSkill tiene onDelete: Cascade, asi que no es necesario borrarlas
      // primero. Bloques en estado ELIMINADO permanecen por integridad
      // referencial (FK Restrict): los purgamos primero para permitir el
      // delete de la seccion, manteniendo `intentos_bloque` historicos por su
      // propia FK Restrict (en P3c no hay intentos todavia).
      await tx.bloque.deleteMany({ where: { seccionId, estado: EstadoBloque.ELIMINADO } })
      await tx.seccion.delete({ where: { id: seccionId } })
    })
    await this.auditLog.record({
      usuarioId: adminUsuarioId,
      accion: AccionAuditoria.SECCION_ELIMINADA,
      exito: true,
      recursoTipo: "seccion",
      recursoId: seccionId,
      metadata: { motivo, moduloId },
      ...contexto,
    })
  }
}
