import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from "@nestjs/common"
import {
  BloqueDetalleResponse,
  BloqueResponse,
  CrearBloqueInput,
  ListarBloquesQuery,
  Paginated,
  PatchBloqueInput,
  PreviewImpactoEliminarBloque,
  ReordenarBloquesInput,
  TipoBloque,
  validarContenidoBloque,
} from "@nexott-learn/shared-types"
import { AccionAuditoria, EstadoBloque, EstadoSkill, Prisma } from "@prisma/client"
import { AuditLogService } from "../../common/audit/audit-log.service"
import { ContextoHttpAuditoria } from "../../common/audit/audit-log.types"
import { apiErrorCodes } from "../../common/errors/api-error.codes"
import { buildPaginatedResponse, resolvePaginacion } from "../../common/http/paginated"
import { PrismaService } from "../../common/prisma/prisma.service"

const REORDEN_OFFSET = 1_000_000

/**
 * Listado — excluye `contenido` (JSONB voluminoso, estructura segun `tipo`).
 * D-CAT-9: `contenido` solo en detalle.
 */
const SELECT_BLOQUE_FIELDS = {
  id: true,
  seccionId: true,
  orden: true,
  tipo: true,
  esEvaluable: true,
  skillQueMideId: true,
  estado: true,
  version: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.BloqueSelect

const SELECT_BLOQUE_DETALLE_FIELDS = {
  ...SELECT_BLOQUE_FIELDS,
  contenido: true,
} as const satisfies Prisma.BloqueSelect

type BloqueRow = Prisma.BloqueGetPayload<{ select: typeof SELECT_BLOQUE_FIELDS }>
type BloqueDetalleRow = Prisma.BloqueGetPayload<{ select: typeof SELECT_BLOQUE_DETALLE_FIELDS }>

function toBloqueResponse(row: BloqueRow): BloqueResponse {
  return {
    id: row.id,
    seccionId: row.seccionId,
    orden: row.orden,
    tipo: row.tipo,
    esEvaluable: row.esEvaluable,
    skillQueMideId: row.skillQueMideId,
    estado: row.estado,
    version: row.version,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

function toBloqueDetalleResponse(row: BloqueDetalleRow): BloqueDetalleResponse {
  return {
    ...toBloqueResponse(row),
    contenido:
      row.contenido === null || row.contenido === undefined
        ? null
        : (row.contenido as Record<string, unknown>),
  }
}

export interface EliminarBloqueResponse {
  readonly previewImpacto: PreviewImpactoEliminarBloque
}

export interface PatchBloqueResultado {
  readonly bloque: BloqueDetalleResponse
  readonly tipoEdicion: "COSMETICO" | "CAMBIA_EVALUACION"
  readonly intentosInvalidados: number
  readonly versionAnterior: number
  readonly versionNueva: number
}

@Injectable()
export class BloquesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async listar(query: ListarBloquesQuery): Promise<Paginated<BloqueResponse>> {
    const { seccionId, tipo, estado } = query
    const { skip, take, page, pageSize } = resolvePaginacion(query)
    const where: Prisma.BloqueWhereInput = {
      ...(seccionId ? { seccionId } : {}),
      ...(tipo ? { tipo } : {}),
      ...(estado ? { estado } : {}),
    }

    const [filas, total] = await this.prisma.$transaction([
      this.prisma.bloque.findMany({
        where,
        select: SELECT_BLOQUE_FIELDS,
        orderBy: [{ seccionId: "asc" }, { orden: "asc" }],
        take,
        skip,
      }),
      this.prisma.bloque.count({ where }),
    ])

    return buildPaginatedResponse(filas.map(toBloqueResponse), total, page, pageSize)
  }

  /**
   * `GET /catalogo/secciones/:seccionId/bloques` (FIX-pre-S12) — listado
   * dedicado por seccion sin paginacion. Devuelve solo bloques ACTIVOS,
   * ordenados por `orden ASC`. 404 explicito si la seccion no existe.
   * Lectura, sin audit.
   */
  async listarPorSeccion(seccionId: string): Promise<readonly BloqueResponse[]> {
    const seccion = await this.prisma.seccion.findUnique({
      where: { id: seccionId },
      select: { id: true },
    })
    if (!seccion) {
      throw new NotFoundException({
        code: apiErrorCodes.seccionNoEncontrada,
        message: "Seccion no encontrada.",
      })
    }
    const filas = await this.prisma.bloque.findMany({
      where: { seccionId, estado: EstadoBloque.ACTIVO },
      select: SELECT_BLOQUE_FIELDS,
      orderBy: { orden: "asc" },
    })
    return filas.map(toBloqueResponse)
  }

  async obtenerPorIdOrThrow(id: string): Promise<BloqueDetalleResponse> {
    const fila = await this.prisma.bloque.findUnique({
      where: { id },
      select: SELECT_BLOQUE_DETALLE_FIELDS,
    })
    if (!fila) {
      throw new NotFoundException({
        code: apiErrorCodes.bloqueNoEncontrado,
        message: "Bloque no encontrado.",
      })
    }
    return toBloqueDetalleResponse(fila)
  }

  async crear(
    seccionId: string,
    input: CrearBloqueInput,
    adminUsuarioId: string,
    contexto: ContextoHttpAuditoria = {},
  ): Promise<BloqueDetalleResponse> {
    const seccion = await this.prisma.seccion.findUnique({
      where: { id: seccionId },
      select: { id: true },
    })
    if (!seccion) {
      throw new NotFoundException({
        code: apiErrorCodes.seccionNoEncontrada,
        message: "Seccion no encontrada.",
      })
    }
    this.validarContenidoOrThrow(input.tipo, input.contenido)
    const fila = await this.prisma.$transaction(async (tx) => {
      if (input.skillQueMideId) {
        await this.validarSkillActiva(tx, input.skillQueMideId)
      }
      let ordenFinal: number
      if (input.orden !== undefined) {
        const existente = await tx.bloque.findFirst({
          where: { seccionId, orden: input.orden },
          select: { id: true },
        })
        if (existente) {
          throw new ConflictException({
            code: apiErrorCodes.bloqueOrdenDuplicado,
            message: "Ya existe un bloque con ese orden en la seccion.",
          })
        }
        ordenFinal = input.orden
      } else {
        const max = await tx.bloque.aggregate({
          where: { seccionId },
          _max: { orden: true },
        })
        ordenFinal = (max._max.orden ?? 0) + 1
      }
      return tx.bloque.create({
        data: {
          seccionId,
          tipo: input.tipo,
          esEvaluable: input.esEvaluable,
          skillQueMideId: input.skillQueMideId ?? null,
          contenido: input.contenido as Prisma.InputJsonObject,
          orden: ordenFinal,
          estado: EstadoBloque.ACTIVO,
          version: 1,
        },
        select: SELECT_BLOQUE_DETALLE_FIELDS,
      })
    })

    await this.auditLog.record({
      usuarioId: adminUsuarioId,
      accion: AccionAuditoria.BLOQUE_CREADO,
      exito: true,
      recursoTipo: "bloque",
      recursoId: fila.id,
      metadata: { seccionId, tipo: input.tipo, esEvaluable: input.esEvaluable },
      ...contexto,
    })
    return toBloqueDetalleResponse(fila)
  }

  /**
   * Valida que `contenido` cumpla el contrato Zod del `tipo` indicado.
   * Defensa en profundidad: el editor ya valida antes de mutar, pero el
   * backend NO confia en el cliente — D-CAT y 16b §16b.1 ("el contrato
   * es de los dos lados; el backend valida al guardar"). Lanza 400 con
   * detalle Zod estructurado si falla.
   */
  private validarContenidoOrThrow(tipo: TipoBloque, contenido: unknown): void {
    const result = validarContenidoBloque(tipo, contenido)
    if (!result.success) {
      throw new BadRequestException({
        code: apiErrorCodes.contenidoBloqueInvalido,
        message: `El contenido no cumple el contrato del bloque tipo ${tipo}.`,
        details: { issues: result.error.issues },
      })
    }
  }

  private async validarSkillActiva(
    tx: Prisma.TransactionClient | PrismaService,
    skillId: string,
  ): Promise<void> {
    const skill = await tx.skill.findUnique({
      where: { id: skillId },
      select: { id: true, estado: true },
    })
    if (!skill) {
      throw new NotFoundException({
        code: apiErrorCodes.skillNoEncontrada,
        message: "Skill no encontrada.",
      })
    }
    if (skill.estado !== EstadoSkill.ACTIVA) {
      throw new ConflictException({
        code: apiErrorCodes.skillNoActiva,
        message: "La skill no esta ACTIVA.",
      })
    }
  }

  /**
   * D-CAT-14: PATCH discriminado por `tipoEdicion`.
   *  - COSMETICO: solo actualiza `contenido`. NO incrementa version, NO invalida.
   *  - CAMBIA_EVALUACION: actualiza `contenido` + opcionalmente esEvaluable/
   *    skillQueMideId. Incrementa version. Invalida intentos previos (sella el
   *    contrato para cuando P7 entre y llene intentos_bloque).
   * Releemos dentro del $transaction (FIX-P3b §5.21) para que `versionAnterior`
   * y `versionNueva` reflejen el estado real al inicio de la transaccion.
   */
  async patch(
    bloqueId: string,
    input: PatchBloqueInput,
    motivo: string | undefined,
    adminUsuarioId: string,
    contexto: ContextoHttpAuditoria = {},
  ): Promise<PatchBloqueResultado> {
    const actual = await this.prisma.bloque.findUnique({
      where: { id: bloqueId },
      select: {
        id: true,
        version: true,
        estado: true,
        esEvaluable: true,
        skillQueMideId: true,
        tipo: true,
      },
    })
    if (!actual) {
      throw new NotFoundException({
        code: apiErrorCodes.bloqueNoEncontrado,
        message: "Bloque no encontrado.",
      })
    }
    if (actual.estado === EstadoBloque.ELIMINADO) {
      throw new ConflictException({
        code: apiErrorCodes.bloqueYaEliminado,
        message: "El bloque ya esta eliminado.",
      })
    }

    if (input.tipoEdicion === "COSMETICO") {
      this.validarContenidoOrThrow(actual.tipo, input.contenido)
      const fila = await this.prisma.bloque.update({
        where: { id: bloqueId },
        data: { contenido: input.contenido as Prisma.InputJsonObject },
        select: SELECT_BLOQUE_DETALLE_FIELDS,
      })
      await this.auditLog.record({
        usuarioId: adminUsuarioId,
        accion: AccionAuditoria.BLOQUE_EDITADO_COSMETICO,
        exito: true,
        recursoTipo: "bloque",
        recursoId: bloqueId,
        metadata: { tipoEdicion: "COSMETICO" },
        ...contexto,
      })
      return {
        bloque: toBloqueDetalleResponse(fila),
        tipoEdicion: "COSMETICO",
        intentosInvalidados: 0,
        versionAnterior: actual.version,
        versionNueva: actual.version,
      }
    }

    // CAMBIA_EVALUACION.
    if (motivo === undefined || motivo.length === 0) {
      throw new HttpException(
        {
          code: apiErrorCodes.motivoRequerido,
          message: "Se requiere X-Motivo para tipoEdicion=CAMBIA_EVALUACION.",
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      )
    }
    if (input.esEvaluable !== undefined) {
      const nuevoSkill = input.skillQueMideId ?? actual.skillQueMideId
      if (input.esEvaluable && !nuevoSkill) {
        throw new BadRequestException({
          code: apiErrorCodes.bloqueSkillObligatoriaEvaluable,
          message: "esEvaluable=true exige skillQueMideId definido.",
        })
      }
      if (!input.esEvaluable && input.skillQueMideId) {
        throw new BadRequestException({
          code: apiErrorCodes.bloqueSkillObligatoriaEvaluable,
          message: "esEvaluable=false exige skillQueMideId nulo.",
        })
      }
    }
    const { fila, intentosInvalidados, versionAnterior, versionNueva } =
      await this.prisma.$transaction(async (tx) => {
        const enTx = await tx.bloque.findUnique({
          where: { id: bloqueId },
          select: { id: true, version: true, estado: true },
        })
        if (!enTx) {
          throw new NotFoundException({
            code: apiErrorCodes.bloqueNoEncontrado,
            message: "Bloque no encontrado.",
          })
        }
        if (enTx.estado === EstadoBloque.ELIMINADO) {
          throw new ConflictException({
            code: apiErrorCodes.bloqueYaEliminado,
            message: "El bloque ya esta eliminado.",
          })
        }
        if (input.skillQueMideId) {
          await this.validarSkillActiva(tx, input.skillQueMideId)
        }
        this.validarContenidoOrThrow(actual.tipo, input.contenido)
        const versionAnt = enTx.version
        const versionNueva = versionAnt + 1

        const data: Prisma.BloqueUpdateInput = {
          contenido: input.contenido as Prisma.InputJsonObject,
          version: versionNueva,
        }
        if (input.esEvaluable !== undefined) {
          data.esEvaluable = input.esEvaluable
        }
        if (input.skillQueMideId !== undefined) {
          data.skillQueMide =
            input.skillQueMideId === null
              ? { disconnect: true }
              : { connect: { id: input.skillQueMideId } }
        }
        const actualizada = await tx.bloque.update({
          where: { id: bloqueId },
          data,
          select: SELECT_BLOQUE_DETALLE_FIELDS,
        })

        // D-CAT-14: invalidar intentos previos. Hoy 0 filas (P7 aun no llena
        // `intentos_bloque`), pero el contrato queda sellado.
        const intentos = await tx.intentoBloque.updateMany({
          where: {
            bloqueId,
            versionBloque: { lt: versionNueva },
            estaInvalidado: false,
          },
          data: { estaInvalidado: true },
        })

        return {
          fila: actualizada,
          intentosInvalidados: intentos.count,
          versionAnterior: versionAnt,
          versionNueva,
        }
      })

    await this.auditLog.record({
      usuarioId: adminUsuarioId,
      accion: AccionAuditoria.BLOQUE_EDITADO_EVALUACION,
      exito: true,
      recursoTipo: "bloque",
      recursoId: bloqueId,
      metadata: {
        tipoEdicion: "CAMBIA_EVALUACION",
        motivo,
        versionAnterior,
        versionNueva,
        intentosInvalidados,
      },
      ...contexto,
    })
    return {
      bloque: toBloqueDetalleResponse(fila),
      tipoEdicion: "CAMBIA_EVALUACION",
      intentosInvalidados,
      versionAnterior,
      versionNueva,
    }
  }

  /**
   * Reordenar bloques de una seccion (D-CAT-19). Dos pasos dentro del tx para
   * evitar violar el unique `[seccionId, orden]`.
   */
  async reordenar(
    seccionId: string,
    input: ReordenarBloquesInput,
    adminUsuarioId: string,
    contexto: ContextoHttpAuditoria = {},
  ): Promise<void> {
    const seccion = await this.prisma.seccion.findUnique({
      where: { id: seccionId },
      select: { id: true },
    })
    if (!seccion) {
      throw new NotFoundException({
        code: apiErrorCodes.seccionNoEncontrada,
        message: "Seccion no encontrada.",
      })
    }

    await this.prisma.$transaction(async (tx) => {
      const actuales = await tx.bloque.findMany({
        where: { seccionId },
        select: { id: true },
      })
      const actualesIds = new Set(actuales.map((b) => b.id))
      const inputIds = new Set(input.orden.map((o) => o.bloqueId))
      if (actualesIds.size !== inputIds.size) {
        throw new BadRequestException({
          code: apiErrorCodes.bloqueOrdenInvalido,
          message: "La permutacion no cubre exactamente los bloques de la seccion.",
          details: { esperado: actualesIds.size, recibido: inputIds.size },
        })
      }
      for (const id of inputIds) {
        if (!actualesIds.has(id)) {
          throw new BadRequestException({
            code: apiErrorCodes.bloqueOrdenInvalido,
            message: "Algun bloqueId no pertenece a la seccion.",
          })
        }
      }
      await tx.bloque.updateMany({
        where: { seccionId },
        data: { orden: { increment: REORDEN_OFFSET } },
      })
      for (const o of input.orden) {
        await tx.bloque.update({
          where: { id: o.bloqueId },
          data: { orden: o.orden },
          select: { id: true },
        })
      }
    })

    await this.auditLog.record({
      usuarioId: adminUsuarioId,
      accion: AccionAuditoria.BLOQUE_REORDENADO,
      exito: true,
      recursoTipo: "seccion",
      recursoId: seccionId,
      metadata: { totalBloques: input.orden.length },
      ...contexto,
    })
  }

  /**
   * Soft-delete del bloque (D-CAT-14): `estado='ELIMINADO'`. NO invalida
   * intentos previos. Devuelve HTTP 200 con `previewImpacto`; en P3c la lista
   * de `colaboradoresAfectados` esta vacia y P7 la poblara.
   */
  async eliminarSoft(
    bloqueId: string,
    motivo: string,
    adminUsuarioId: string,
    contexto: ContextoHttpAuditoria = {},
  ): Promise<EliminarBloqueResponse> {
    const actual = await this.prisma.bloque.findUnique({
      where: { id: bloqueId },
      select: { id: true, estado: true },
    })
    if (!actual) {
      throw new NotFoundException({
        code: apiErrorCodes.bloqueNoEncontrado,
        message: "Bloque no encontrado.",
      })
    }
    if (actual.estado === EstadoBloque.ELIMINADO) {
      throw new ConflictException({
        code: apiErrorCodes.bloqueYaEliminado,
        message: "El bloque ya esta eliminado.",
      })
    }

    await this.prisma.bloque.update({
      where: { id: bloqueId },
      data: { estado: EstadoBloque.ELIMINADO },
      select: { id: true },
    })
    await this.auditLog.record({
      usuarioId: adminUsuarioId,
      accion: AccionAuditoria.BLOQUE_ELIMINADO_SOFT,
      exito: true,
      recursoTipo: "bloque",
      recursoId: bloqueId,
      metadata: { motivo },
      ...contexto,
    })
    return { previewImpacto: { colaboradoresAfectados: [] } }
  }
}
