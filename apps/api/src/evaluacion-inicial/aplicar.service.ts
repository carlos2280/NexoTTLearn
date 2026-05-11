import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common"
import {
  AplicarRequest,
  AplicarResponse,
  aplicarResponseSchema,
  previewCambiosArraySchema,
  previewRechazosArraySchema,
} from "@nexott-learn/shared-types"
import { OrigenNotaSkill, Prisma } from "@prisma/client"
import { apiErrorCodes } from "../common/errors/api-error.codes"
import { IdempotencyService } from "../common/idempotency/idempotency.service"
import { PrismaService } from "../common/prisma/prisma.service"

const IDEMPOTENCY_SCOPE = "evaluacion-inicial.aplicar"
const HTTP_OK = 200

const SELECT_PREVIEW_APLICAR = {
  id: true,
  cursoId: true,
  archivoId: true,
  expiraEn: true,
  aplicadoEn: true,
  cambios: true,
  rechazos: true,
} as const satisfies Prisma.PreviewEvaluacionInicialSelect

interface AplicarInput {
  readonly cursoId: string
  readonly previewId: string
  readonly idempotencyKey: string
  readonly usuarioId: string
  readonly body: AplicarRequest
}

interface AplicarRunResult {
  readonly status: number
  readonly body: AplicarResponse
  readonly replay: boolean
}

/**
 * AplicarService — Slice 5 P5c.
 *
 * Aplica un preview de evaluacion inicial a las fichas (`notas_skill` +
 * `historico_notas_skill` append-only) con idempotencia transversal (D-EVI-3)
 * y semantica todo-o-nada (D-EVI-7). Toda la mutacion vive dentro del
 * `$transaction` del `IdempotencyService.runOnce`: si cualquier paso lanza,
 * Prisma hace rollback y la `IdempotencyKey` NO queda persistida, garantizando
 * que un reintento idempotente sea limpio y seguro.
 *
 * Race-safe contra "doble aplicar" del mismo preview (patron M1 heredado de
 * FIX-P4-cierre): el lock del preview se hace con `updateMany WHERE id=?
 * AND cursoId=? AND aplicadoEn IS NULL` + `count===0 -> 409`.
 *
 * El audit log lo escribe el controller FUERA del `$transaction` (D-AUDIT-2),
 * solo en el primer aplicar (no en replay).
 */
@Injectable()
export class AplicarService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly idempotency: IdempotencyService,
  ) {}

  async aplicar(input: AplicarInput): Promise<AplicarRunResult> {
    const curso = await this.prisma.curso.findUnique({
      where: { id: input.cursoId },
      select: { id: true },
    })
    if (!curso) {
      throw new NotFoundException({
        code: apiErrorCodes.cursoNoEncontrado,
        message: `Curso ${input.cursoId} no encontrado.`,
      })
    }

    const ejecucion = await this.idempotency.runOnce<AplicarResponse>({
      scope: IDEMPOTENCY_SCOPE,
      key: input.idempotencyKey,
      usuarioId: input.usuarioId,
      requestPayload: {
        cursoId: input.cursoId,
        previewId: input.previewId,
        body: input.body,
      },
      ejecutor: (tx) => this.ejecutarAplicar(tx, input),
    })
    return ejecucion
  }

  /**
   * D-EVI-7 todo-o-nada. Toda la mutacion sucede dentro del `tx` proporcionado
   * por `IdempotencyService.runOnce`. Si algun paso lanza, Prisma hace rollback
   * completo (incluyendo la fila `IdempotencyKey` que se persiste fuera de este
   * callback).
   */
  private async ejecutarAplicar(
    tx: Prisma.TransactionClient,
    input: AplicarInput,
  ): Promise<{ readonly status: number; readonly body: AplicarResponse }> {
    const preview = await tx.previewEvaluacionInicial.findUnique({
      where: { id: input.previewId },
      select: SELECT_PREVIEW_APLICAR,
    })

    const ahora = new Date()
    if (
      !preview ||
      preview.cursoId !== input.cursoId ||
      preview.expiraEn < ahora ||
      preview.aplicadoEn !== null
    ) {
      // No distinguimos "no existe" / "cross-curso" / "expirado" / "ya aplicado"
      // en el mismo handler para no leakear estado del preview.
      throw new NotFoundException({
        code: apiErrorCodes.previewNoEncontrado,
        message: `Preview ${input.previewId} no encontrado.`,
      })
    }

    const cambios = previewCambiosArraySchema.parse(preview.cambios)
    const rechazos = previewRechazosArraySchema.parse(preview.rechazos)

    if (rechazos.length > 0) {
      throw new UnprocessableEntityException({
        code: apiErrorCodes.validacionPreviewConRechazos,
        message:
          "El preview contiene filas rechazadas. Corrija el Excel y re-suba el preview antes de aplicar.",
        details: { filasRechazadas: rechazos.length },
      })
    }

    // Crear la carga primero — el `cargaId` se referencia en upserts y en el
    // lock del preview. Si el lock falla (race), el throw rolllbackea esta
    // fila junto con el resto.
    const carga = await tx.cargaEvaluacionInicial.create({
      data: {
        cursoId: input.cursoId,
        previewId: input.previewId,
        archivoId: preview.archivoId,
        aplicadoPorUsuarioId: input.usuarioId,
        skillsActualizadas: 0,
        colaboradoresActualizados: 0,
      },
      select: { id: true },
    })

    // Race-safe lock del preview (patron M1).
    const lock = await tx.previewEvaluacionInicial.updateMany({
      where: { id: input.previewId, cursoId: input.cursoId, aplicadoEn: null },
      data: { aplicadoEn: ahora, aplicadoPorCargaId: carga.id },
    })
    if (lock.count === 0) {
      throw new ConflictException({
        code: apiErrorCodes.conflictPreviewYaAplicado,
        message: "El preview fue aplicado por otra solicitud concurrente.",
      })
    }

    const skillsUnicas = new Set(cambios.map((c) => c.skillId))
    const colaboradoresUnicos = Array.from(new Set(cambios.map((c) => c.colaboradorId)))

    // Carga inicial sin cambios: aplicado sin notas que escribir. Aceptable
    // (idempotente). Actualizamos contadores y salimos.
    if (cambios.length === 0) {
      const planesMarcados = await this.marcarPlanesDesactualizados(tx, colaboradoresUnicos)
      const body = aplicarResponseSchema.parse({
        aplicado: true,
        skillsActualizadas: 0,
        colaboradoresActualizados: 0,
        planesMarcadosDesactualizados: planesMarcados,
        planesRecalculados: 0,
        cargaId: carga.id,
      })
      return { status: HTTP_OK, body }
    }

    // Upsert atomico por par (colaboradorId, skillId) — cubre tanto el caso
    // "nota nueva" como "nota existente". Necesario en lugar de updateMany
    // porque no podemos garantizar que las filas existan previamente.
    const origenActual: Prisma.InputJsonValue = {
      origen: OrigenNotaSkill.ENTREVISTA_INICIAL,
      cargaId: carga.id,
      archivoId: preview.archivoId,
    }
    for (const cambio of cambios) {
      await tx.notaSkill.upsert({
        where: {
          // biome-ignore lint/style/useNamingConvention: clave compuesta generada por Prisma para @@unique.
          colaboradorId_skillId: { colaboradorId: cambio.colaboradorId, skillId: cambio.skillId },
        },
        create: {
          colaboradorId: cambio.colaboradorId,
          skillId: cambio.skillId,
          notaActual: cambio.valorNuevo,
          origenActual,
        },
        update: {
          notaActual: cambio.valorNuevo,
          origenActual,
        },
        select: { id: true },
      })
    }

    // Recolectar todos los `notaSkillId` resueltos por los upserts en un solo
    // findMany para luego hacer createMany del historico en bulk.
    const pares = cambios.map((c) => ({
      colaboradorId: c.colaboradorId,
      skillId: c.skillId,
    }))
    const notas = await tx.notaSkill.findMany({
      // biome-ignore lint/style/useNamingConvention: operador logico de Prisma (uppercase).
      where: { OR: pares },
      select: { id: true, colaboradorId: true, skillId: true },
    })
    const idPorPar = new Map<string, string>()
    for (const n of notas) {
      idPorPar.set(this.clavePar(n.colaboradorId, n.skillId), n.id)
    }

    const referenciaHistorico: Prisma.InputJsonValue = {
      archivoId: preview.archivoId,
      cargaId: carga.id,
    }
    const historicoData = cambios.map((c) => {
      const notaSkillId = idPorPar.get(this.clavePar(c.colaboradorId, c.skillId))
      if (!notaSkillId) {
        // Caso imposible — el upsert siempre crea/encuentra la fila.
        throw new Error(
          `NotaSkill no resuelta tras upsert para par ${c.colaboradorId}/${c.skillId}`,
        )
      }
      return {
        notaSkillId,
        valor: c.valorNuevo,
        origen: OrigenNotaSkill.ENTREVISTA_INICIAL,
        referencia: referenciaHistorico,
        autorUsuarioId: input.usuarioId,
      }
    })
    await tx.historicoNotaSkill.createMany({ data: historicoData })

    const planesMarcados = await this.marcarPlanesDesactualizados(tx, colaboradoresUnicos)

    await tx.cargaEvaluacionInicial.update({
      where: { id: carga.id },
      data: {
        skillsActualizadas: skillsUnicas.size,
        colaboradoresActualizados: colaboradoresUnicos.length,
      },
    })

    const body = aplicarResponseSchema.parse({
      aplicado: true,
      skillsActualizadas: skillsUnicas.size,
      colaboradoresActualizados: colaboradoresUnicos.length,
      planesMarcadosDesactualizados: planesMarcados,
      planesRecalculados: 0,
      cargaId: carga.id,
    })
    return { status: HTTP_OK, body }
  }

  /**
   * D80 (marcar solamente; el recalculo real es del Slice 7). Marca como
   * `estaDesactualizado = true` los planes de los colaboradores afectados que
   * aun no estaban marcados. Devuelve el count para el response.
   */
  private async marcarPlanesDesactualizados(
    tx: Prisma.TransactionClient,
    colaboradoresAfectados: readonly string[],
  ): Promise<number> {
    if (colaboradoresAfectados.length === 0) {
      return 0
    }
    const planes = await tx.planEstudio.findMany({
      where: {
        asignacion: { colaboradorId: { in: [...colaboradoresAfectados] } },
        estaDesactualizado: false,
      },
      select: { id: true },
    })
    if (planes.length === 0) {
      return 0
    }
    const planIds = planes.map((p) => p.id)
    const result = await tx.planEstudio.updateMany({
      where: { id: { in: planIds } },
      data: { estaDesactualizado: true },
    })
    return result.count
  }

  private clavePar(colaboradorId: string, skillId: string): string {
    return `${colaboradorId}::${skillId}`
  }
}
