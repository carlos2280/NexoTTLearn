import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common"
import type { PlanResponseAdmin, PlanResponseParticipante } from "@nexott-learn/shared-types"
import { fichaSnapshotV1Schema } from "@nexott-learn/shared-types"
import {
  Prisma,
  type CaracterItemPlan as PrismaCaracterItemPlan,
  type RazonItemPlan as PrismaRazonItemPlan,
  RolAsignacion,
  RolUsuario,
} from "@prisma/client"
import { apiErrorCodes } from "../common/errors/api-error.codes"
import { PrismaService } from "../common/prisma/prisma.service"
import { SesionUsuario } from "../common/types/sesion.types"
import {
  type ResultadoCalculo,
  calcularAvance,
  calcularPlan,
  decimalAsNumber,
  toPlanResponse,
} from "./plan-personal.helpers"
import type { ModuloSeccionRef } from "./plan-personal.types"
import { SELECT_PLAN_FIELDS, SELECT_PLAN_ITEM_FIELDS } from "./plan-personal.types"

type PrismaTx = Prisma.TransactionClient | PrismaService

interface CalcularInternalInput {
  readonly asignacionId: string
  readonly tx: PrismaTx
  /**
   * Cuando es `true` (calcular inicial), falla con 409 si ya existe plan.
   * Cuando es `false` (recalcular), reemplaza el plan completo.
   */
  readonly fallarSiExiste: boolean
}

/**
 * Service del modulo plan-personal (Slice 7 P7a).
 *
 * Endpoints:
 *  - `POST /asignaciones/:id/plan/calcular`  — admin. Falla 409 si ya existe.
 *  - `POST /asignaciones/:id/plan/recalcular` — admin con X-Motivo.
 *  - `GET  /asignaciones/:id/plan` — admin o propio (D-AS-9).
 *
 * Decisiones de referencia: D-S7-A2..D6 (design doc Slice 7).
 */
@Injectable()
export class PlanPersonalService {
  private readonly logger = new Logger(PlanPersonalService.name)

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cierre del TODO(S7) en `crearAsignacionesAdmin` y `convertirAAsignado`:
   * el motor se invoca tras crear la asignacion. Sin TX explicito: en
   * `crearAsignacionesAdmin` el TX externo no existe; en `convertirAAsignado`
   * el caller pasa su `tx` y se reutiliza.
   */
  async calcularSiAsignado(asignacionId: string, tx?: PrismaTx): Promise<void> {
    const cliente = tx ?? this.prisma
    const previa = await cliente.asignacionCurso.findUnique({
      where: { id: asignacionId },
      select: { id: true, rol: true },
    })
    if (!previa) {
      return
    }
    if (previa.rol !== RolAsignacion.ASIGNADO) {
      // D-AS-1: voluntarios sin plan personal.
      return
    }
    try {
      await this.calcularInterno({
        asignacionId,
        tx: cliente,
        fallarSiExiste: false,
      })
    } catch (error) {
      // El cierre del TODO(S7) no debe abortar el alta. Logueamos para
      // diagnostico y dejamos al admin recalcular manualmente si hace falta.
      this.logger.warn(
        `calcularSiAsignado(${asignacionId}) fallo: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  /**
   * `POST /plan/calcular` — ADMIN. 409 si el plan ya existe.
   */
  async calcularExplicito(asignacionId: string): Promise<PlanResponseAdmin> {
    const previa = await this.prisma.asignacionCurso.findUnique({
      where: { id: asignacionId },
      select: { id: true, rol: true },
    })
    if (!previa) {
      throw new NotFoundException({
        code: apiErrorCodes.asignacionNoEncontrada,
        message: `Asignacion ${asignacionId} no encontrada.`,
      })
    }
    if (previa.rol !== RolAsignacion.ASIGNADO) {
      throw new UnprocessableEntityException({
        code: apiErrorCodes.conflictAsignacionNoVoluntario,
        message: "Solo asignaciones con rol ASIGNADO tienen plan personal.",
        details: { rol: previa.rol },
      })
    }
    const planExistente = await this.prisma.planEstudio.findUnique({
      where: { asignacionId },
      select: { id: true, fechaCalculo: true },
    })
    if (planExistente) {
      throw new ConflictException({
        code: apiErrorCodes.conflictPlanYaCalculado,
        message: "El plan ya esta calculado. Para recalcularlo use /plan/recalcular.",
        details: {
          planId: planExistente.id,
          fechaCalculo: planExistente.fechaCalculo.toISOString(),
        },
      })
    }
    return await this.prisma.$transaction(async (tx) => {
      await this.calcularInterno({ asignacionId, tx, fallarSiExiste: true })
      return (await this.obtenerPlanInterno(
        tx,
        asignacionId,
        RolUsuario.ADMIN,
      )) as PlanResponseAdmin
    })
  }

  /**
   * `POST /plan/recalcular` — ADMIN. Requiere `X-Motivo` (controller).
   * Reemplaza items + actualiza snapshot + `estaDesactualizado=false`.
   * TODO(P7b): audit `PLAN_RECALCULADO` cuando llegue el ALTER TYPE
   * accion_auditoria_enum.
   * TODO(S10): emitir notificacion PLAN_RECALCULADO al participante.
   */
  async recalcular(asignacionId: string): Promise<PlanResponseAdmin> {
    const previa = await this.prisma.asignacionCurso.findUnique({
      where: { id: asignacionId },
      select: { id: true, rol: true },
    })
    if (!previa) {
      throw new NotFoundException({
        code: apiErrorCodes.asignacionNoEncontrada,
        message: `Asignacion ${asignacionId} no encontrada.`,
      })
    }
    if (previa.rol !== RolAsignacion.ASIGNADO) {
      throw new UnprocessableEntityException({
        code: apiErrorCodes.conflictAsignacionNoVoluntario,
        message: "Solo asignaciones con rol ASIGNADO tienen plan personal.",
        details: { rol: previa.rol },
      })
    }
    const planExistente = await this.prisma.planEstudio.findUnique({
      where: { asignacionId },
      select: { id: true },
    })
    if (!planExistente) {
      throw new NotFoundException({
        code: apiErrorCodes.planNoEncontrado,
        message: "El plan no existe. Use /plan/calcular para el primer calculo.",
      })
    }
    return await this.prisma.$transaction(async (tx) => {
      await this.calcularInterno({ asignacionId, tx, fallarSiExiste: false })
      return (await this.obtenerPlanInterno(
        tx,
        asignacionId,
        RolUsuario.ADMIN,
      )) as PlanResponseAdmin
    })
  }

  /**
   * `GET /plan` — ADMIN o propio (D-AS-9). Visibilidad diferenciada D90.
   */
  async obtener(
    asignacionId: string,
    usuario: SesionUsuario,
  ): Promise<PlanResponseAdmin | PlanResponseParticipante> {
    const asignacion = await this.prisma.asignacionCurso.findUnique({
      where: { id: asignacionId },
      select: { id: true, rol: true, colaboradorId: true },
    })
    if (!asignacion) {
      throw new NotFoundException({
        code: apiErrorCodes.asignacionNoEncontrada,
        message: `Asignacion ${asignacionId} no encontrada.`,
      })
    }
    if (usuario.rol === RolUsuario.PARTICIPANTE) {
      const usuarioConColab = await this.prisma.usuario.findUnique({
        where: { id: usuario.usuarioId },
        select: { colaboradorId: true },
      })
      const colaboradorId = usuarioConColab?.colaboradorId ?? null
      if (colaboradorId === null || asignacion.colaboradorId !== colaboradorId) {
        // D-S7-D1: ocultar existencia, NO 403.
        throw new NotFoundException({
          code: apiErrorCodes.asignacionNoEncontrada,
          message: `Asignacion ${asignacionId} no encontrada.`,
        })
      }
    }
    return await this.obtenerPlanInterno(this.prisma, asignacionId, usuario.rol)
  }

  // ===== Internals =====

  private async calcularInterno(input: CalcularInternalInput): Promise<void> {
    const { tx, asignacionId, fallarSiExiste } = input
    const planPrevio = await tx.planEstudio.findUnique({
      where: { asignacionId },
      select: { id: true },
    })
    if (planPrevio && fallarSiExiste) {
      throw new ConflictException({
        code: apiErrorCodes.conflictPlanYaCalculado,
        message: "El plan ya esta calculado.",
        details: { planId: planPrevio.id },
      })
    }

    const asignacion = await tx.asignacionCurso.findUniqueOrThrow({
      where: { id: asignacionId },
      select: { id: true, cursoId: true, colaboradorId: true },
    })
    const curso = await tx.curso.findUniqueOrThrow({
      where: { id: asignacion.cursoId },
      select: { id: true, umbralNoCumple: true },
    })

    const resultado = await this.ejecutarMotor({
      tx,
      cursoId: asignacion.cursoId,
      colaboradorId: asignacion.colaboradorId,
      umbralNoCumple: decimalAsNumber(curso.umbralNoCumple) ?? 10,
    })

    await this.persistirResultado({
      tx,
      asignacionId,
      planId: planPrevio?.id ?? null,
      resultado,
    })
  }

  private async ejecutarMotor(input: {
    readonly tx: PrismaTx
    readonly cursoId: string
    readonly colaboradorId: string
    readonly umbralNoCumple: number
  }): Promise<ResultadoCalculo> {
    const { tx, cursoId, colaboradorId, umbralNoCumple } = input

    const exigidas = await tx.cursoSkillExigida.findMany({
      where: { cursoId },
      select: { skillId: true, notaMinima: true },
    })

    const notas = await tx.notaSkill.findMany({
      where: {
        colaboradorId,
        skillId: { in: exigidas.map((e) => e.skillId) },
      },
      select: { skillId: true, notaActual: true, origenActual: true },
    })

    const modulosHabilitados = await tx.cursoModuloHabilitado.findMany({
      where: { cursoId },
      select: { moduloId: true },
    })

    const secciones = await tx.seccion.findMany({
      where: { moduloId: { in: modulosHabilitados.map((m) => m.moduloId) } },
      select: {
        id: true,
        titulo: true,
        moduloId: true,
        modulo: { select: { id: true, titulo: true } },
        skills: { select: { skillId: true } },
      },
      orderBy: [{ moduloId: "asc" }, { orden: "asc" }],
    })

    return calcularPlan({
      cursoId,
      colaboradorId,
      umbralNoCumple,
      exigidas: exigidas.map((e) => ({
        skillId: e.skillId,
        notaMinima: decimalAsNumber(e.notaMinima) ?? 0,
      })),
      notas: notas.map((n) => ({
        skillId: n.skillId,
        notaActual: decimalAsNumber(n.notaActual),
        origen: extraerOrigenTipo(n.origenActual),
      })),
      secciones: secciones.map((s) => ({
        seccionId: s.id,
        moduloId: s.moduloId,
        seccionTitulo: s.titulo,
        tituloModulo: s.modulo.titulo,
        skillIds: s.skills.map((sk) => sk.skillId),
      })),
    })
  }

  private async persistirResultado(input: {
    readonly tx: PrismaTx
    readonly asignacionId: string
    readonly planId: string | null
    readonly resultado: ResultadoCalculo
  }): Promise<void> {
    const { tx, asignacionId, planId, resultado } = input
    const fichaSnapshotJson = resultado.fichaSnapshot as unknown as Prisma.InputJsonValue

    if (planId === null) {
      const planNuevo = await tx.planEstudio.create({
        data: {
          asignacionId,
          fichaSnapshot: fichaSnapshotJson,
          fechaCalculo: new Date(),
          estaDesactualizado: false,
        },
        select: { id: true },
      })
      await tx.itemPlan.createMany({
        data: resultado.items.map((i) => ({
          planId: planNuevo.id,
          moduloId: i.moduloId,
          seccionId: i.seccionId,
          caracter: i.caracter as PrismaCaracterItemPlan,
          razon: i.razon as PrismaRazonItemPlan,
        })),
      })
      return
    }
    await tx.itemPlan.deleteMany({ where: { planId } })
    await tx.planEstudio.update({
      where: { asignacionId },
      data: {
        fichaSnapshot: fichaSnapshotJson,
        fechaCalculo: new Date(),
        estaDesactualizado: false,
      },
    })
    await tx.itemPlan.createMany({
      data: resultado.items.map((i) => ({
        planId,
        moduloId: i.moduloId,
        seccionId: i.seccionId,
        caracter: i.caracter as PrismaCaracterItemPlan,
        razon: i.razon as PrismaRazonItemPlan,
      })),
    })
  }

  private async obtenerPlanInterno(
    tx: PrismaTx,
    asignacionId: string,
    rol: RolUsuario,
  ): Promise<PlanResponseAdmin | PlanResponseParticipante> {
    const plan = await tx.planEstudio.findUnique({
      where: { asignacionId },
      select: SELECT_PLAN_FIELDS,
    })
    if (!plan) {
      throw new NotFoundException({
        code: apiErrorCodes.planNoEncontrado,
        message: "El plan no existe para esta asignacion.",
      })
    }
    const items = await tx.itemPlan.findMany({
      where: { planId: plan.id },
      select: SELECT_PLAN_ITEM_FIELDS,
    })
    const seccionIds = items.map((i) => i.seccionId)
    const secciones = await tx.seccion.findMany({
      where: { id: { in: seccionIds } },
      select: {
        id: true,
        titulo: true,
        moduloId: true,
        modulo: { select: { id: true, titulo: true } },
        bloques: {
          where: { estado: "ACTIVO", esEvaluable: true },
          select: { id: true },
        },
      },
    })

    const asignacion = await tx.asignacionCurso.findUniqueOrThrow({
      where: { id: asignacionId },
      select: { colaboradorId: true },
    })

    const { avancePlan, porSeccion } = await this.obtenerAvance(
      tx,
      asignacionId,
      asignacion.colaboradorId,
      items.filter((i) => i.caracter === "OBLIGATORIA"),
      secciones,
    )

    const modulosSecciones: ModuloSeccionRef[] = secciones.map((s) => ({
      moduloId: s.moduloId,
      tituloModulo: s.modulo.titulo,
      seccionId: s.id,
      seccionTitulo: s.titulo,
    }))

    // El JSON persistido puede ser cualquier shape antiguo. Validamos con Zod
    // antes de devolverlo a admin (defense in depth).
    const fichaSnapshot = fichaSnapshotV1Schema.parse(plan.fichaSnapshot)

    return toPlanResponse({
      planId: plan.id,
      asignacionId: plan.asignacionId,
      fechaCalculo: plan.fechaCalculo,
      estaDesactualizado: plan.estaDesactualizado,
      fichaSnapshot,
      items: items.map((i) => ({
        moduloId: i.moduloId,
        seccionId: i.seccionId,
        caracter: i.caracter,
        razon: i.razon,
      })),
      modulosSecciones,
      avance: avancePlan,
      porSeccion,
      rol,
    })
  }

  private async obtenerAvance(
    tx: PrismaTx,
    asignacionId: string,
    colaboradorId: string,
    itemsObligatorios: ReadonlyArray<{ readonly seccionId: string }>,
    secciones: ReadonlyArray<{
      readonly id: string
      readonly bloques: ReadonlyArray<{ readonly id: string }>
    }>,
  ): ReturnType<typeof calcularAvance> extends infer R ? Promise<Awaited<R>> : never {
    const seccionPorId = new Map(secciones.map((s) => [s.id, s]))
    const seccionesObligatorias = itemsObligatorios.map((it) => {
      const s = seccionPorId.get(it.seccionId)
      return {
        seccionId: it.seccionId,
        bloques: s?.bloques ?? [],
      }
    })
    const bloqueIds = seccionesObligatorias.flatMap((s) => s.bloques.map((b) => b.id))
    const mejoresIntentos =
      bloqueIds.length === 0
        ? []
        : await tx.intentoBloque.findMany({
            where: {
              colaboradorId,
              bloqueId: { in: bloqueIds },
              esMejorIntento: true,
              estaInvalidado: false,
            },
            select: { bloqueId: true, nota: true },
          })
    const aperturas = await tx.aperturaSeccion.findMany({
      where: { asignacionId, seccionId: { in: seccionesObligatorias.map((s) => s.seccionId) } },
      select: { seccionId: true },
    })
    return calcularAvance({
      seccionesObligatorias,
      mejoresIntentosVigentes: mejoresIntentos.map((m) => ({
        bloqueId: m.bloqueId,
        notaNum: decimalAsNumber(m.nota) ?? 0,
      })),
      aperturas,
    }) as Awaited<ReturnType<typeof calcularAvance>>
  }
}

/**
 * `NotaSkill.origenActual` es JSONB. Extraemos el campo `tipo` si existe;
 * cualquier otra cosa cae a `null` (lo que el motor mapea a SIN_NOTA).
 */
function extraerOrigenTipo(json: Prisma.JsonValue | null | undefined): string | null {
  if (json === null || json === undefined || typeof json !== "object" || Array.isArray(json)) {
    return null
  }
  const tipo = (json as Record<string, unknown>).tipo
  return typeof tipo === "string" ? tipo : null
}
