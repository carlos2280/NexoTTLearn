import { ConflictException, Injectable, NotFoundException } from "@nestjs/common"
import {
  CargarCapaComprensionInput,
  CargarCapaCualitativaInput,
  CargarCapaTestsInput,
  IntentoTransversalAdminResponse,
} from "@nexott-learn/shared-types"
import { Prisma } from "@prisma/client"
import { apiErrorCodes } from "../common/errors/api-error.codes"
import { IdempotencyService } from "../common/idempotency/idempotency.service"
import { SesionUsuario } from "../common/types/sesion.types"
import { toIntentoAdmin } from "./transversal.helpers"
import { SELECT_INTENTO_TRANSVERSAL_FIELDS } from "./transversal.types"

const IDEMPOTENCY_SCOPE_CAPA_TESTS = "intento-transversal.capa-tests"
const IDEMPOTENCY_SCOPE_CAPA_CUALITATIVA = "intento-transversal.capa-cualitativa"
const IDEMPOTENCY_SCOPE_CAPA_COMPRENSION = "intento-transversal.capa-comprension"
const HTTP_OK = 200

export type CapaKey = "tests" | "cualitativa" | "comprension"

export interface CargarCapaResult {
  readonly response: IntentoTransversalAdminResponse
  readonly replay: boolean
  readonly capa: CapaKey
}

/**
 * Service compartido por `TransversalService` (handlers REST E7-E9) y por
 * `JobEvaluacionTransversalService` (worker async que persiste resultados
 * del MockAiProvider). Antes de esta extraccion, ambos services se
 * referenciaban con `forwardRef` produciendo una dependencia circular: el
 * controller llamaba a `TransversalService.cargarCapa*`, el job tambien.
 *
 * Aqui vive el patron unico: idempotencia + validacion estado/capa +
 * actualizacion + transicion automatica a EVALUADO cuando todas las capas
 * activas tienen nota (D-S8-C3).
 */
@Injectable()
export class TransversalCapasService {
  constructor(private readonly idempotency: IdempotencyService) {}

  cargarCapaTests(input: {
    readonly intentoId: string
    readonly body: CargarCapaTestsInput
    readonly idempotencyKey: string
    readonly usuario: SesionUsuario
  }): Promise<CargarCapaResult> {
    return this.cargarCapaGenerico({
      capa: "tests",
      scope: IDEMPOTENCY_SCOPE_CAPA_TESTS,
      intentoId: input.intentoId,
      nota: input.body.nota,
      detalle: input.body.detalle,
      idempotencyKey: input.idempotencyKey,
      usuario: input.usuario,
    })
  }

  cargarCapaCualitativa(input: {
    readonly intentoId: string
    readonly body: CargarCapaCualitativaInput
    readonly idempotencyKey: string
    readonly usuario: SesionUsuario
  }): Promise<CargarCapaResult> {
    return this.cargarCapaGenerico({
      capa: "cualitativa",
      scope: IDEMPOTENCY_SCOPE_CAPA_CUALITATIVA,
      intentoId: input.intentoId,
      nota: input.body.nota,
      detalle: input.body.detalle as unknown as Record<string, unknown>,
      idempotencyKey: input.idempotencyKey,
      usuario: input.usuario,
    })
  }

  cargarCapaComprension(input: {
    readonly intentoId: string
    readonly body: CargarCapaComprensionInput
    readonly idempotencyKey: string
    readonly usuario: SesionUsuario
  }): Promise<CargarCapaResult> {
    return this.cargarCapaGenerico({
      capa: "comprension",
      scope: IDEMPOTENCY_SCOPE_CAPA_COMPRENSION,
      intentoId: input.intentoId,
      nota: input.body.nota,
      detalle: input.body.detalle as unknown as Record<string, unknown>,
      idempotencyKey: input.idempotencyKey,
      usuario: input.usuario,
    })
  }

  private async cargarCapaGenerico(input: {
    readonly capa: CapaKey
    readonly scope: string
    readonly intentoId: string
    readonly nota: number
    readonly detalle: Record<string, unknown>
    readonly idempotencyKey: string
    readonly usuario: SesionUsuario
  }): Promise<CargarCapaResult> {
    const ejecucion = await this.idempotency.runOnce<IntentoTransversalAdminResponse>({
      scope: input.scope,
      key: input.idempotencyKey,
      usuarioId: input.usuario.usuarioId,
      requestPayload: {
        intentoId: input.intentoId,
        capa: input.capa,
        nota: input.nota,
        detalle: input.detalle,
      },
      ejecutor: async (tx) => {
        const intento = await this.cargarIntentoParaCarga(tx, input.intentoId)
        validarIntentoEditableCapa(intento)
        validarCapaActiva(input.capa, intento.transversal)
        const data = construirDataCargaCapa({
          capa: input.capa,
          nota: input.nota,
          detalle: input.detalle,
          intento,
        })
        const actualizado = await tx.intentoTransversal.update({
          where: { id: input.intentoId },
          data,
          select: SELECT_INTENTO_TRANSVERSAL_FIELDS,
        })
        return { status: HTTP_OK, body: toIntentoAdmin(actualizado) }
      },
    })
    return { response: ejecucion.body, replay: ejecucion.replay, capa: input.capa }
  }

  private cargarIntentoParaCarga(
    tx: Prisma.TransactionClient,
    intentoId: string,
  ): Promise<IntentoConCapasYActivas> {
    return tx.intentoTransversal
      .findUnique({
        where: { id: intentoId },
        select: {
          id: true,
          estado: true,
          anulado: true,
          notaCapaTests: true,
          notaCapaCualitativa: true,
          notaCapaComprension: true,
          evaluacionesCapas: true,
          transversal: {
            select: {
              capaTestsActiva: true,
              capaCualitativaActiva: true,
              capaComprensionActiva: true,
            },
          },
        },
      })
      .then((intento) => {
        if (!intento) {
          throw new NotFoundException({
            code: apiErrorCodes.intentoTransversalNoEncontrado,
            message: `Intento transversal ${intentoId} no encontrado.`,
          })
        }
        return intento
      })
  }
}

interface IntentoConCapasYActivas {
  readonly id: string
  readonly estado: "EN_EVALUACION" | "EVALUADO" | "FINALIZADO" | "ANULADO"
  readonly anulado: boolean
  readonly notaCapaTests: Prisma.Decimal | null
  readonly notaCapaCualitativa: Prisma.Decimal | null
  readonly notaCapaComprension: Prisma.Decimal | null
  readonly evaluacionesCapas: Prisma.JsonValue
  readonly transversal: {
    readonly capaTestsActiva: boolean
    readonly capaCualitativaActiva: boolean
    readonly capaComprensionActiva: boolean
  }
}

function validarIntentoEditableCapa(intento: IntentoConCapasYActivas): void {
  if (intento.anulado || intento.estado === "FINALIZADO" || intento.estado === "ANULADO") {
    throw new ConflictException({
      code: apiErrorCodes.conflictIntentoTransversalNoEditable,
      message: "El intento no admite cargar capas en su estado actual.",
      details: { estado: intento.estado, anulado: intento.anulado },
    })
  }
}

function validarCapaActiva(capa: CapaKey, flags: IntentoConCapasYActivas["transversal"]): void {
  const activa =
    capa === "tests"
      ? flags.capaTestsActiva
      : capa === "cualitativa"
        ? flags.capaCualitativaActiva
        : flags.capaComprensionActiva
  if (!activa) {
    throw new ConflictException({
      code: apiErrorCodes.conflictCapaInactiva,
      message: `La capa ${capa} esta desactivada en este curso.`,
    })
  }
}

function construirDataCargaCapa(input: {
  readonly capa: CapaKey
  readonly nota: number
  readonly detalle: Record<string, unknown>
  readonly intento: IntentoConCapasYActivas
}): Prisma.IntentoTransversalUpdateInput {
  const detalleActualizado: Record<string, unknown> = {
    ...parseDetalleCapas(input.intento.evaluacionesCapas),
    [input.capa]: input.detalle,
  }
  const data: Prisma.IntentoTransversalUpdateInput = {
    evaluacionesCapas: detalleActualizado as unknown as Prisma.InputJsonValue,
  }
  if (input.capa === "tests") {
    data.notaCapaTests = new Prisma.Decimal(input.nota)
  } else if (input.capa === "cualitativa") {
    data.notaCapaCualitativa = new Prisma.Decimal(input.nota)
  } else {
    data.notaCapaComprension = new Prisma.Decimal(input.nota)
  }
  const notasProyectadas = proyectarNotasTrasCarga(input.capa, input.nota, input.intento)
  if (todasCapasActivasConNota(notasProyectadas, input.intento.transversal)) {
    data.estado = "EVALUADO"
  }
  return data
}

function proyectarNotasTrasCarga(
  capa: CapaKey,
  nota: number,
  intento: IntentoConCapasYActivas,
): {
  readonly tests: number | null
  readonly cualitativa: number | null
  readonly comprension: number | null
} {
  return {
    tests:
      capa === "tests"
        ? nota
        : intento.notaCapaTests === null
          ? null
          : Number(intento.notaCapaTests.toString()),
    cualitativa:
      capa === "cualitativa"
        ? nota
        : intento.notaCapaCualitativa === null
          ? null
          : Number(intento.notaCapaCualitativa.toString()),
    comprension:
      capa === "comprension"
        ? nota
        : intento.notaCapaComprension === null
          ? null
          : Number(intento.notaCapaComprension.toString()),
  }
}

/**
 * Lee `evaluacionesCapas` JSON sin reventar si esta corrupto. Devuelve siempre
 * un record indexable para mezclar el detalle nuevo.
 */
function parseDetalleCapas(value: Prisma.JsonValue): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {}
  }
  return { ...(value as Record<string, unknown>) }
}

/**
 * Determina si las capas activas tienen TODAS nota tras la proyeccion de la
 * carga actual — gatilla la transicion a `EVALUADO` (D-S8-C3).
 */
function todasCapasActivasConNota(
  notas: {
    readonly tests: number | null
    readonly cualitativa: number | null
    readonly comprension: number | null
  },
  capasActivas: {
    readonly capaTestsActiva: boolean
    readonly capaCualitativaActiva: boolean
    readonly capaComprensionActiva: boolean
  },
): boolean {
  if (capasActivas.capaTestsActiva && notas.tests === null) {
    return false
  }
  if (capasActivas.capaCualitativaActiva && notas.cualitativa === null) {
    return false
  }
  if (capasActivas.capaComprensionActiva && notas.comprension === null) {
    return false
  }
  return true
}
