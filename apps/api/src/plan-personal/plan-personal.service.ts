import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common"
import type {
  AjustarPlanInput,
  AperturaSeccionResponse,
  PlanDiffResponse,
  PlanResponseAdmin,
  PlanResponseParticipante,
} from "@nexott-learn/shared-types"
import { fichaSnapshotV1Schema } from "@nexott-learn/shared-types"
import {
  AccionAjustePlan,
  AccionAuditoria,
  EstadoAsignado,
  EstadoVoluntario,
  Prisma,
  type CaracterItemPlan as PrismaCaracterItemPlan,
  type RazonItemPlan as PrismaRazonItemPlan,
  RolAsignacion,
  RolUsuario,
  TipoBloque,
  TipoEventoNotif,
} from "@prisma/client"
import { umbralAprobacionBloque } from "../catalogo/bloques/umbral-aprobacion"
import { AuditLogService } from "../common/audit/audit-log.service"
import { apiErrorCodes } from "../common/errors/api-error.codes"
import { PrismaService } from "../common/prisma/prisma.service"
import { SesionUsuario } from "../common/types/sesion.types"
import { NotificacionesService } from "../notificaciones/notificaciones.service"
import {
  type ResultadoCalculo,
  calcularAvance,
  calcularDiffPlan,
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
 * Service del modulo plan-personal (Slice 7 P7a + P7c).
 *
 * Endpoints P7a:
 *  - `POST /asignaciones/:id/plan/calcular`   — admin. Falla 409 si ya existe.
 *  - `POST /asignaciones/:id/plan/recalcular` — admin con X-Motivo.
 *  - `GET  /asignaciones/:id/plan`            — admin o propio (D-AS-9).
 *
 * Endpoints P7c:
 *  - `PATCH /asignaciones/:id/plan/ajustes`              — admin con X-Motivo.
 *  - `GET   /asignaciones/:id/plan/diff`                 — admin only.
 *  - `POST  /asignaciones/:id/secciones/:sId/apertura`   — admin o propio.
 *
 * Decisiones de referencia: D-S7-A2..D6 (design doc Slice 7).
 */
@Injectable()
export class PlanPersonalService {
  private readonly logger = new Logger(PlanPersonalService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly notificaciones: NotificacionesService,
  ) {}

  /**
   * Cierre del TODO(S7) en `crearAsignacionesAdmin` y `convertirAAsignado`:
   * el motor se invoca tras crear la asignacion. Sin TX explicito: en
   * `crearAsignacionesAdmin` el TX externo no existe; en `convertirAAsignado`
   * el caller pasa su `tx` y se reutiliza.
   *
   * P11.5c — cierre TODO(S11) §6.1 item 45: tras un calculo exitoso se emite
   * `PLAN_RECALCULADO` al participante reutilizando el helper privado
   * `notificarPlanRecalculado`. La emision es fire-and-forget (ver helper) y
   * se hace SOLO si el plan quedo realmente persistido (recuperado via
   * `findUnique` por `asignacionId`). El fallo silencioso del calculo (catch
   * que loggea) implica que `findUnique` devolvera `null` y no se notifica
   * — evita falsos positivos al participante (D-S11.5-C*, D88).
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
    let calculoExitoso = false
    try {
      await this.calcularInterno({
        asignacionId,
        tx: cliente,
        fallarSiExiste: false,
      })
      calculoExitoso = true
    } catch (error) {
      // El cierre del TODO(S7) no debe abortar el alta. Logueamos para
      // diagnostico y dejamos al admin recalcular manualmente si hace falta.
      this.logger.warn(
        `calcularSiAsignado(${asignacionId}) fallo: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
    if (!calculoExitoso) {
      return
    }
    // Recuperar el planId tras el calculo (el motor lo creo o lo reescribio).
    // Si el plan no existe (caso imposible si calculoExitoso=true salvo race),
    // el helper se loggea sin propagar y no se notifica.
    const plan = await this.prisma.planEstudio.findUnique({
      where: { asignacionId },
      select: { id: true },
    })
    if (!plan) {
      this.logger.warn(
        `notif | plan-recalculado omitida | asignacion=${asignacionId} | motivo=plan-no-encontrado-post-calculo`,
      )
      return
    }
    await this.notificarPlanRecalculado(asignacionId, plan.id)
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
    const respuesta = await this.prisma.$transaction(async (tx) => {
      await this.calcularInterno({ asignacionId, tx, fallarSiExiste: true })
      return (await this.obtenerPlanInterno(
        tx,
        asignacionId,
        RolUsuario.ADMIN,
      )) as PlanResponseAdmin
    })
    // D-AUDIT-2 / R-S10-2: la notificacion se emite FUERA del TX. Si falla,
    // se loggea sin propagar al admin (el plan ya esta calculado y persistido).
    await this.notificarPlanRecalculado(asignacionId, respuesta.planId)
    return respuesta
  }

  /**
   * `POST /plan/recalcular` — ADMIN. Requiere `X-Motivo` (controller).
   * Reemplaza items + actualiza snapshot + `estaDesactualizado=false`.
   * Audit `PLAN_RECALCULADO` se registra fuera del TX (D-AUDIT-1) con
   * metadata estructural sin texto crudo del motivo (D-S7-D4).
   * P10c (D-S10-C9): emite notificacion PLAN_RECALCULADO al participante
   * tras el commit (best-effort fuera del TX).
   */
  async recalcular(
    asignacionId: string,
    autorUsuarioId: string,
    motivo: string,
  ): Promise<PlanResponseAdmin> {
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
    const respuesta = await this.prisma.$transaction(async (tx) => {
      await this.calcularInterno({ asignacionId, tx, fallarSiExiste: false })
      return (await this.obtenerPlanInterno(
        tx,
        asignacionId,
        RolUsuario.ADMIN,
      )) as PlanResponseAdmin
    })
    await this.auditLog.record({
      usuarioId: autorUsuarioId,
      accion: AccionAuditoria.PLAN_RECALCULADO,
      exito: true,
      recursoTipo: "plan_estudio",
      recursoId: planExistente.id,
      metadata: {
        planId: planExistente.id,
        asignacionId,
        motivoLength: motivo.trim().length,
      },
    })
    await this.notificarPlanRecalculado(asignacionId, planExistente.id)
    return respuesta
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

  /**
   * `PATCH /plan/ajustes` — ADMIN. Aplica un ajuste manual (AGREGAR / QUITAR /
   * CAMBIAR_CARACTER / EXIMIR). El motivo es obligatorio (controller + guard).
   * Audit `PLAN_AJUSTADO_MANUALMENTE` fuera del TX (D-S7-D4) sin texto crudo.
   * P10c (D-S10-C9): emite notificacion PLAN_RECALCULADO (reinterpretacion
   * §5.106 de PLAN_AJUSTADO_MANUALMENTE) al participante tras el audit.
   */
  async ajustarPlan(
    asignacionId: string,
    dto: AjustarPlanInput,
    autorUsuarioId: string,
    motivo: string,
  ): Promise<PlanResponseAdmin> {
    const plan = await this.prisma.planEstudio.findUnique({
      where: { asignacionId },
      select: {
        id: true,
        asignacion: { select: { cursoId: true, rol: true } },
      },
    })
    if (!plan) {
      throw new NotFoundException({
        code: apiErrorCodes.planNoEncontrado,
        message: "El plan no existe para esta asignacion.",
      })
    }
    if (plan.asignacion.rol !== RolAsignacion.ASIGNADO) {
      throw new UnprocessableEntityException({
        code: apiErrorCodes.conflictAsignacionNoVoluntario,
        message: "Solo asignaciones con rol ASIGNADO tienen plan personal.",
        details: { rol: plan.asignacion.rol },
      })
    }

    const cursoId = plan.asignacion.cursoId
    const planId = plan.id

    await this.prisma.$transaction(async (tx) => {
      switch (dto.accion) {
        case "AGREGAR":
          await this.aplicarAgregar(tx, planId, cursoId, dto.seccionId, dto.caracter)
          break
        case "QUITAR":
          await this.aplicarQuitar(tx, planId, dto.seccionId)
          break
        case "CAMBIAR_CARACTER":
          await this.aplicarCambiarCaracter(tx, planId, dto.seccionId, dto.caracter)
          break
        case "EXIMIR":
          await this.aplicarEximir(tx, planId, cursoId, dto.skillId)
          break
        default: {
          // Exhaustiveness check: si en el futuro se agrega otra accion a
          // `AccionAjustePlan` sin actualizar este switch, TS marca aqui un
          // error de compilacion (cierre §5.105 — FIX-P7-cierre).
          const _exhaustive: never = dto
          throw new Error(`Caso de ajuste no soportado: ${String(_exhaustive)}`)
        }
      }
      await this.registrarAjuste(tx, planId, dto, autorUsuarioId, motivo)
    })

    await this.auditLog.record({
      usuarioId: autorUsuarioId,
      accion: AccionAuditoria.PLAN_AJUSTADO_MANUALMENTE,
      exito: true,
      recursoTipo: "plan_estudio",
      recursoId: planId,
      metadata: this.metadataAuditAjuste(plan.id, asignacionId, dto, motivo),
    })

    await this.notificarPlanRecalculado(asignacionId, planId)

    return (await this.obtenerPlanInterno(
      this.prisma,
      asignacionId,
      RolUsuario.ADMIN,
    )) as PlanResponseAdmin
  }

  /**
   * `GET /plan/diff` — ADMIN only (D-S7-D1 estricto: PARTICIPANTE recibe 404).
   * Lectura READ-ONLY: NO marca el plan como desactualizado, NO recalcula.
   */
  async obtenerDiff(asignacionId: string, usuario: SesionUsuario): Promise<PlanDiffResponse> {
    if (usuario.rol !== RolUsuario.ADMIN) {
      // D-S7-D1: ocultar existencia (404 en lugar de 403).
      throw new NotFoundException({
        code: apiErrorCodes.asignacionNoEncontrada,
        message: `Asignacion ${asignacionId} no encontrada.`,
      })
    }
    const plan = await this.prisma.planEstudio.findUnique({
      where: { asignacionId },
      select: {
        id: true,
        fechaCalculo: true,
        fichaSnapshot: true,
        estaDesactualizado: true,
        asignacion: { select: { cursoId: true, colaboradorId: true } },
      },
    })
    if (!plan || plan.fichaSnapshot === null) {
      throw new NotFoundException({
        code: apiErrorCodes.planNoEncontrado,
        message: "El plan no existe para esta asignacion.",
      })
    }

    const parseo = fichaSnapshotV1Schema.safeParse(plan.fichaSnapshot)
    if (!parseo.success) {
      throw new InternalServerErrorException({
        code: apiErrorCodes.fichaSnapshotInvalida,
        message: "El snapshot persistido no cumple el contrato vigente.",
      })
    }
    const snapshot = parseo.data

    const cursoId = plan.asignacion.cursoId
    const skillIds = snapshot.skillsConsideradas.map((s) => s.skillId)

    const [curso, exigidas, notas, items] = await Promise.all([
      this.prisma.curso.findUniqueOrThrow({
        where: { id: cursoId },
        select: { umbralNoCumple: true },
      }),
      this.prisma.cursoSkillExigida.findMany({
        where: { cursoId, skillId: { in: skillIds } },
        select: { skillId: true, notaMinima: true },
      }),
      this.prisma.notaSkill.findMany({
        where: {
          colaboradorId: plan.asignacion.colaboradorId,
          skillId: { in: skillIds },
        },
        select: { skillId: true, notaActual: true },
      }),
      this.prisma.itemPlan.findMany({
        where: { planId: plan.id },
        select: {
          seccionId: true,
          caracter: true,
          seccion: {
            select: {
              id: true,
              titulo: true,
              skills: { select: { skillId: true } },
            },
          },
        },
      }),
    ])

    const notaMinimaPorSkill = new Map<string, number>()
    for (const e of exigidas) {
      notaMinimaPorSkill.set(e.skillId, decimalAsNumber(e.notaMinima) ?? 0)
    }
    const notaVigentePorSkill = new Map<string, number | null>()
    for (const n of notas) {
      notaVigentePorSkill.set(n.skillId, decimalAsNumber(n.notaActual))
    }

    const seccionesPorSkill = new Map<
      string,
      Array<{
        seccionId: string
        tituloSeccion: string
        caracterActual: "OBLIGATORIA" | "OPCIONAL"
      }>
    >()
    for (const it of items) {
      for (const sk of it.seccion.skills) {
        const lista = seccionesPorSkill.get(sk.skillId) ?? []
        lista.push({
          seccionId: it.seccionId,
          tituloSeccion: it.seccion.titulo,
          caracterActual: it.caracter,
        })
        seccionesPorSkill.set(sk.skillId, lista)
      }
    }

    const umbralNoCumple = decimalAsNumber(curso.umbralNoCumple) ?? 10
    const diff = calcularDiffPlan({
      umbralNoCumple,
      skills: snapshot.skillsConsideradas.map((s) => ({
        skillId: s.skillId,
        notaSnapshot: s.nota,
        estadoSnapshot: s.estado,
        notaVigente: notaVigentePorSkill.get(s.skillId) ?? null,
        notaMinima: notaMinimaPorSkill.get(s.skillId) ?? s.notaMinimaExigida,
        seccionesQueEnsenan: seccionesPorSkill.get(s.skillId) ?? [],
      })),
    })

    return {
      planId: plan.id,
      asignacionId,
      fechaCalculoSnapshot: snapshot.fechaCalculo,
      estaDesactualizado: plan.estaDesactualizado,
      diff,
    }
  }

  /**
   * `POST /asignaciones/:id/secciones/:seccionId/apertura` — ADMIN o propio.
   * Idempotente: segundo POST devuelve `yaEstaba=true` sin tocar la fila.
   * NO audit log (D-S7-D4): la fila `AperturaSeccion` es el audit funcional.
   *
   * §5.123 (FIX-P10-cierre): si la apertura es real (no replay) y deja el
   * plan completo (porcentaje=100, p.ej. seccion sin bloques evaluables que
   * cierra la ultima obligatoria), emite `PLAN_RECALCULADO` best-effort
   * FUERA de la transaccion de insercion (R-S10-2 / B7 — los errores de
   * notificacion no rompen el flujo origen).
   */
  async registrarApertura(
    asignacionId: string,
    seccionId: string,
    usuario: SesionUsuario,
  ): Promise<AperturaSeccionResponse> {
    const asignacion = await this.prisma.asignacionCurso.findUnique({
      where: { id: asignacionId },
      select: {
        id: true,
        cursoId: true,
        colaboradorId: true,
        rol: true,
        estadoAsignado: true,
        estadoVoluntario: true,
      },
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
        // D-S7-D1: ocultar existencia (404 no 403).
        throw new NotFoundException({
          code: apiErrorCodes.asignacionNoEncontrada,
          message: `Asignacion ${asignacionId} no encontrada.`,
        })
      }
    }
    if (estaEnEstadoTerminal(asignacion)) {
      throw new ConflictException({
        code: apiErrorCodes.conflictAsignacionCerrada,
        message: "La asignacion esta en estado terminal: no se permiten aperturas.",
        details: {
          estadoAsignado: asignacion.estadoAsignado,
          estadoVoluntario: asignacion.estadoVoluntario,
        },
      })
    }

    // Validar que la seccion pertenece a un modulo habilitado del curso.
    const seccionValida = await this.prisma.cursoModuloHabilitado.findFirst({
      where: {
        cursoId: asignacion.cursoId,
        modulo: { secciones: { some: { id: seccionId } } },
      },
      select: { moduloId: true },
    })
    if (!seccionValida) {
      // D-S7-D1: no revelar si la seccion existe en otro curso.
      throw new NotFoundException({
        code: apiErrorCodes.seccionNoEncontrada,
        message: `Seccion ${seccionId} no encontrada.`,
      })
    }

    try {
      const creado = await this.prisma.aperturaSeccion.create({
        data: { asignacionId, seccionId },
        select: { primeraAperturaAt: true },
      })
      // §5.123: la apertura quedo persistida. Si esto deja el plan al 100%,
      // emitir PLAN_RECALCULADO best-effort. No emitir en replay (yaEstaba=true).
      await this.notificarSiAperturaCompletoPlan(asignacionId)
      return {
        asignacionId,
        seccionId,
        primeraAperturaAt: creado.primeraAperturaAt.toISOString(),
        yaEstaba: false,
      }
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const existente = await this.prisma.aperturaSeccion.findUnique({
          where: {
            // biome-ignore lint/style/useNamingConvention: composite key Prisma.
            asignacionId_seccionId: { asignacionId, seccionId },
          },
          select: { primeraAperturaAt: true },
        })
        if (!existente) {
          throw error
        }
        return {
          asignacionId,
          seccionId,
          primeraAperturaAt: existente.primeraAperturaAt.toISOString(),
          yaEstaba: true,
        }
      }
      throw error
    }
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
          select: { id: true, tipo: true, contenido: true },
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

    // El JSON persistido puede ser de un shape antiguo o estar ausente. Sólo
    // lo parseamos cuando lo vamos a entregar (rol ADMIN, D-S7-D2): el
    // PARTICIPANTE no recibe `fichaSnapshot` y no debe romper si la fila es
    // legacy (seed antiguo, migración pendiente). Para ADMIN: si el snapshot
    // está corrupto o ausente, lanzamos 422 con código documentado en vez de
    // un 500 genérico — el admin sabrá que debe recalcular el plan.
    const fichaSnapshot =
      rol === RolUsuario.ADMIN ? this.parseFichaSnapshotOrThrow(plan.fichaSnapshot) : undefined

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

  /**
   * Parsea `fichaSnapshot` para entregárselo a un ADMIN. Si la columna es
   * `null` (plan creado por seeders antiguos o nunca recalculado) o el JSON
   * persistido no matchea `fichaSnapshotV1Schema`, lanza 422 con código
   * `fichaSnapshotInvalida` — un 500 ZodError no diagnostica nada al cliente.
   *
   * El admin puede llamar a `POST /plan/recalcular` para regenerar un
   * snapshot v1 válido.
   */
  private parseFichaSnapshotOrThrow(raw: Prisma.JsonValue | null) {
    if (raw === null || raw === undefined) {
      throw new UnprocessableEntityException({
        code: apiErrorCodes.fichaSnapshotInvalida,
        message:
          "El plan no tiene fichaSnapshot persistido. Ejecuta /plan/recalcular para regenerarlo.",
      })
    }
    const parsed = fichaSnapshotV1Schema.safeParse(raw)
    if (!parsed.success) {
      throw new UnprocessableEntityException({
        code: apiErrorCodes.fichaSnapshotInvalida,
        message:
          "El fichaSnapshot persistido no cumple el schema v1. Ejecuta /plan/recalcular para regenerarlo.",
      })
    }
    return parsed.data
  }

  private async obtenerAvance(
    tx: PrismaTx,
    asignacionId: string,
    colaboradorId: string,
    itemsObligatorios: ReadonlyArray<{ readonly seccionId: string }>,
    secciones: ReadonlyArray<{
      readonly id: string
      readonly bloques: ReadonlyArray<{
        readonly id: string
        readonly tipo: TipoBloque
        readonly contenido: Prisma.JsonValue
      }>
    }>,
  ): ReturnType<typeof calcularAvance> extends infer R ? Promise<Awaited<R>> : never {
    // Resuelve el umbral por bloque a partir de su contenido. Los bloques
    // viajan al helper `calcularAvance` ya enriquecidos con `umbralAprobacion`
    // para evitar que el helper conozca el contrato JSONB del contenido.
    const seccionPorId = new Map(
      secciones.map((s) => [
        s.id,
        {
          id: s.id,
          bloques: s.bloques.map((b) => ({
            id: b.id,
            umbralAprobacion: umbralAprobacionBloque(b.tipo, b.contenido),
          })),
        },
      ]),
    )
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

  // ===== Internals P7c =====

  private async aplicarAgregar(
    tx: Prisma.TransactionClient,
    planId: string,
    cursoId: string,
    seccionId: string,
    caracter: "OBLIGATORIA" | "OPCIONAL",
  ): Promise<void> {
    const habilitada = await tx.cursoModuloHabilitado.findFirst({
      where: {
        cursoId,
        modulo: { secciones: { some: { id: seccionId } } },
      },
      select: { moduloId: true },
    })
    if (!habilitada) {
      throw new NotFoundException({
        code: apiErrorCodes.seccionNoEncontrada,
        message: `Seccion ${seccionId} no encontrada.`,
      })
    }
    const seccion = await tx.seccion.findUnique({
      where: { id: seccionId },
      select: { moduloId: true },
    })
    if (!seccion) {
      throw new NotFoundException({
        code: apiErrorCodes.seccionNoEncontrada,
        message: `Seccion ${seccionId} no encontrada.`,
      })
    }
    const existente = await tx.itemPlan.findUnique({
      where: {
        // biome-ignore lint/style/useNamingConvention: composite key Prisma.
        planId_seccionId: { planId, seccionId },
      },
      select: { id: true },
    })
    if (existente) {
      throw new ConflictException({
        code: apiErrorCodes.conflictSeccionYaEnPlan,
        message: "La seccion ya esta en el plan.",
        details: { seccionId },
      })
    }
    await tx.itemPlan.create({
      data: {
        planId,
        moduloId: seccion.moduloId,
        seccionId,
        caracter: caracter as PrismaCaracterItemPlan,
        razon: "AJUSTE_ADMIN" as PrismaRazonItemPlan,
      },
    })
  }

  private async aplicarQuitar(
    tx: Prisma.TransactionClient,
    planId: string,
    seccionId: string,
  ): Promise<void> {
    const existente = await tx.itemPlan.findUnique({
      where: {
        // biome-ignore lint/style/useNamingConvention: composite key Prisma.
        planId_seccionId: { planId, seccionId },
      },
      select: { id: true },
    })
    if (!existente) {
      throw new NotFoundException({
        code: apiErrorCodes.seccionNoEnPlan,
        message: "La seccion no esta en el plan.",
        details: { seccionId },
      })
    }
    await tx.itemPlan.delete({
      where: {
        // biome-ignore lint/style/useNamingConvention: composite key Prisma.
        planId_seccionId: { planId, seccionId },
      },
    })
  }

  private async aplicarCambiarCaracter(
    tx: Prisma.TransactionClient,
    planId: string,
    seccionId: string,
    caracter: "OBLIGATORIA" | "OPCIONAL",
  ): Promise<void> {
    const existente = await tx.itemPlan.findUnique({
      where: {
        // biome-ignore lint/style/useNamingConvention: composite key Prisma.
        planId_seccionId: { planId, seccionId },
      },
      select: { id: true },
    })
    if (!existente) {
      throw new NotFoundException({
        code: apiErrorCodes.seccionNoEnPlan,
        message: "La seccion no esta en el plan.",
        details: { seccionId },
      })
    }
    await tx.itemPlan.update({
      where: {
        // biome-ignore lint/style/useNamingConvention: composite key Prisma.
        planId_seccionId: { planId, seccionId },
      },
      data: { caracter: caracter as PrismaCaracterItemPlan },
    })
  }

  private async aplicarEximir(
    tx: Prisma.TransactionClient,
    planId: string,
    cursoId: string,
    skillId: string,
  ): Promise<void> {
    const exigida = await tx.cursoSkillExigida.findUnique({
      where: {
        // biome-ignore lint/style/useNamingConvention: composite key Prisma.
        cursoId_skillId: { cursoId, skillId },
      },
      select: { skillId: true },
    })
    if (!exigida) {
      throw new NotFoundException({
        code: apiErrorCodes.skillNoEncontrada,
        message: `Skill ${skillId} no exigida en el curso.`,
      })
    }
    const itemsAfectados = await tx.itemPlan.findMany({
      where: {
        planId,
        caracter: "OBLIGATORIA",
        seccion: { skills: { some: { skillId } } },
      },
      select: { id: true },
    })
    if (itemsAfectados.length === 0) {
      return
    }
    await tx.itemPlan.updateMany({
      where: { id: { in: itemsAfectados.map((i) => i.id) } },
      data: { caracter: "OPCIONAL" },
    })
  }

  private async registrarAjuste(
    tx: Prisma.TransactionClient,
    planId: string,
    dto: AjustarPlanInput,
    autorUsuarioId: string,
    motivo: string,
  ): Promise<void> {
    const accion = mapAccionPrisma(dto.accion)
    const seccionId = dto.accion === "EXIMIR" ? null : dto.seccionId
    await tx.ajustePlan.create({
      data: {
        planId,
        accion,
        autorUsuarioId,
        motivo,
        seccionId,
      },
    })
  }

  private metadataAuditAjuste(
    planId: string,
    asignacionId: string,
    dto: AjustarPlanInput,
    motivo: string,
  ): Prisma.InputJsonValue {
    const base = {
      planId,
      asignacionId,
      ajuste: dto.accion,
      motivoLength: motivo.trim().length,
    }
    if (dto.accion === "EXIMIR") {
      return { ...base, skillId: dto.skillId }
    }
    return { ...base, seccionId: dto.seccionId }
  }

  /**
   * §5.123: encapsula la transicion "apertura -> plan al 100%". Si el plan
   * existe y queda completo tras la apertura, emite `PLAN_RECALCULADO`
   * (best-effort). Esta encapsulacion mantiene `registrarApertura` por
   * debajo del limite de complejidad cognitiva (15) y aisla la regla.
   */
  private async notificarSiAperturaCompletoPlan(asignacionId: string): Promise<void> {
    const planId = await this.planEstaCompleto(asignacionId)
    if (planId) {
      await this.notificarPlanRecalculado(asignacionId, planId)
    }
  }

  /**
   * `POST /cursos/:cursoId/planes/recalcular-masivo` (FIX-pre-S12) — ADMIN.
   * Recalcula todas las asignaciones ASIGNADO no-terminales del curso. Cada
   * recalculo va con try/catch individual (R-S10-2): un fallo aislado no
   * rompe el batch. No audit por-asignacion duplicado (cada `recalcular`
   * ya emite `PLAN_RECALCULADO`); el resumen agregado se audita con
   * `PLAN_RECALCULADO_MASIVO` (D-S12-D3).
   */
  async recalcularMasivo(
    cursoId: string,
    autorUsuarioId: string,
  ): Promise<{
    readonly cursoId: string
    readonly total: number
    readonly recalculadas: number
    readonly fallidas: number
    readonly duracionMs: number
  }> {
    const inicio = Date.now()
    const asignaciones = await this.prisma.asignacionCurso.findMany({
      where: {
        cursoId,
        rol: RolAsignacion.ASIGNADO,
        estadoAsignado: {
          in: [EstadoAsignado.ASIGNADO, EstadoAsignado.EN_PROGRESO, EstadoAsignado.LISTO],
        },
      },
      select: { id: true },
    })
    let recalculadas = 0
    let fallidas = 0
    for (const { id } of asignaciones) {
      try {
        await this.recalcular(id, autorUsuarioId, "RECALCULO_MASIVO")
        recalculadas += 1
      } catch (error) {
        fallidas += 1
        const detalle = error instanceof Error ? error.message : String(error)
        this.logger.warn(
          `recalcularMasivo | curso=${cursoId} | asignacion=${id} | fallo=${detalle}`,
        )
      }
    }
    const duracionMs = Date.now() - inicio
    await this.auditLog.record({
      usuarioId: autorUsuarioId,
      accion: AccionAuditoria.PLAN_RECALCULADO_MASIVO,
      exito: true,
      recursoTipo: "curso",
      recursoId: cursoId,
      metadata: {
        cursoId,
        total: asignaciones.length,
        recalculadas,
        fallidas,
        duracionMs,
      },
    })
    return {
      cursoId,
      total: asignaciones.length,
      recalculadas,
      fallidas,
      duracionMs,
    }
  }

  /**
   * §5.128 (FIX-P11b-avance): expone el porcentaje 0-100 del plan vigente de
   * la asignacion reutilizando el motor `obtenerAvance` (D-S7-B6). Pensado
   * para consumo desde `ReportesService.avanceCursoActual` — por eso no
   * lanza si la asignacion aun no tiene `PlanEstudio` (caso ASIGNADO antes
   * de `calcularExplicito` o VOLUNTARIO sin plan): devuelve 0. Tambien
   * devuelve 0 si el plan no tiene items obligatorios (mismo criterio
   * defensivo que `planEstaCompleto`: no hay metrica significativa).
   */
  async obtenerPorcentajeAvance(asignacionId: string): Promise<number> {
    const plan = await this.prisma.planEstudio.findUnique({
      where: { asignacionId },
      select: { id: true },
    })
    if (!plan) {
      return 0
    }
    const items = await this.prisma.itemPlan.findMany({
      where: { planId: plan.id, caracter: "OBLIGATORIA" },
      select: { seccionId: true },
    })
    if (items.length === 0) {
      return 0
    }
    const secciones = await this.prisma.seccion.findMany({
      where: { id: { in: items.map((i) => i.seccionId) } },
      select: {
        id: true,
        bloques: {
          where: { estado: "ACTIVO", esEvaluable: true },
          select: { id: true, tipo: true, contenido: true },
        },
      },
    })
    const asignacion = await this.prisma.asignacionCurso.findUniqueOrThrow({
      where: { id: asignacionId },
      select: { colaboradorId: true },
    })
    const { avancePlan } = await this.obtenerAvance(
      this.prisma,
      asignacionId,
      asignacion.colaboradorId,
      items,
      secciones,
    )
    return avancePlan.porcentaje
  }

  /**
   * §5.123: comprueba si la asignacion tiene un plan al 100%. Reutiliza el
   * motor `obtenerAvance` para no duplicar la regla de "seccion completada"
   * (D-S7-B6). Retorna `planId` si esta completo, `null` si no hay plan o
   * el porcentaje es menor a 100. Errores propagan al caller.
   */
  private async planEstaCompleto(asignacionId: string): Promise<string | null> {
    const plan = await this.prisma.planEstudio.findUnique({
      where: { asignacionId },
      select: { id: true },
    })
    if (!plan) {
      return null
    }
    const items = await this.prisma.itemPlan.findMany({
      where: { planId: plan.id, caracter: "OBLIGATORIA" },
      select: { seccionId: true },
    })
    if (items.length === 0) {
      // Sin obligatorias el porcentaje seria 100 vacuamente, pero no hay
      // transicion provocada por la apertura: no emitir.
      return null
    }
    const secciones = await this.prisma.seccion.findMany({
      where: { id: { in: items.map((i) => i.seccionId) } },
      select: {
        id: true,
        bloques: {
          where: { estado: "ACTIVO", esEvaluable: true },
          select: { id: true, tipo: true, contenido: true },
        },
      },
    })
    const asignacion = await this.prisma.asignacionCurso.findUniqueOrThrow({
      where: { id: asignacionId },
      select: { colaboradorId: true },
    })
    const { avancePlan } = await this.obtenerAvance(
      this.prisma,
      asignacionId,
      asignacion.colaboradorId,
      items,
      secciones,
    )
    // 100 = porcentaje completo (espejo de PORCENTAJE_TOTAL en plan-personal.helpers).
    return avancePlan.porcentaje >= 100 ? plan.id : null
  }

  /**
   * Trigger PLAN_RECALCULADO (D-S10-C9). Emite la notificacion al usuario
   * destinatario derivado de la asignacion (NUNCA del body — A01). Captura
   * cualquier error y lo loggea sin propagarlo: el flujo origen ya hizo
   * commit y el caller no debe ver fallos de notificacion (R-S10-2 / B7).
   */
  private async notificarPlanRecalculado(asignacionId: string, planId: string): Promise<void> {
    try {
      const asignacion = await this.prisma.asignacionCurso.findUnique({
        where: { id: asignacionId },
        select: {
          curso: { select: { titulo: true } },
          colaborador: { select: { usuario: { select: { id: true } } } },
        },
      })
      const usuarioId = asignacion?.colaborador?.usuario?.id
      const cursoTitulo = asignacion?.curso?.titulo
      if (!(usuarioId && cursoTitulo)) {
        this.logger.warn(
          `notif | plan-recalculado omitida | asignacion=${asignacionId} | motivo=sin-usuario-o-curso`,
        )
        return
      }
      await this.notificaciones.crear({
        usuarioId,
        tipo: TipoEventoNotif.PLAN_RECALCULADO,
        payload: {
          planId,
          asignacionId,
          cursoTitulo,
        },
      })
    } catch (error) {
      const detalle = error instanceof Error ? error.message : String(error)
      this.logger.warn(
        `notif | fallo | tipo=PLAN_RECALCULADO | asignacion=${asignacionId} | error=${detalle}`,
      )
    }
  }
}

function estaEnEstadoTerminal(asignacion: {
  readonly rol: RolAsignacion
  readonly estadoAsignado: EstadoAsignado | null
  readonly estadoVoluntario: EstadoVoluntario | null
}): boolean {
  if (asignacion.rol === RolAsignacion.ASIGNADO) {
    return (
      asignacion.estadoAsignado === EstadoAsignado.APTO ||
      asignacion.estadoAsignado === EstadoAsignado.NO_APTO ||
      asignacion.estadoAsignado === EstadoAsignado.RETIRADO
    )
  }
  return (
    asignacion.estadoVoluntario === EstadoVoluntario.COMPLETADO ||
    asignacion.estadoVoluntario === EstadoVoluntario.RETIRADO
  )
}

function mapAccionPrisma(accion: AjustarPlanInput["accion"]): AccionAjustePlan {
  switch (accion) {
    case "AGREGAR":
      return AccionAjustePlan.AGREGAR
    case "QUITAR":
      return AccionAjustePlan.QUITAR
    case "EXIMIR":
      return AccionAjustePlan.EXIMIR
    case "CAMBIAR_CARACTER":
      return AccionAjustePlan.CAMBIAR_CARACTER
    default: {
      // Exhaustiveness check: si `AccionAjustePlan` agrega otro valor sin
      // actualizar este mapper, TS marca aqui un error de compilacion
      // (cierre §5.105 — FIX-P7-cierre).
      const _exhaustive: never = accion
      throw new Error(`Accion de ajuste no mapeable: ${String(_exhaustive)}`)
    }
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
