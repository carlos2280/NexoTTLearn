import { BadRequestException } from "@nestjs/common"
import {
  Asignacion,
  AsignacionDetallada,
  CondicionesListoFaltante,
  CursoDisponibleVoluntario,
  EstadoAsignado,
  EstadoVoluntario,
  RolAsignacion,
} from "@nexott-learn/shared-types"
import {
  EstadoAsignado as EstadoAsignadoPrisma,
  EstadoVoluntario as EstadoVoluntarioPrisma,
  Prisma,
  RolAsignacion as RolAsignacionPrisma,
} from "@prisma/client"
import { z } from "zod"
import { umbralAprobacionBloque } from "../catalogo/bloques/umbral-aprobacion"
import { apiErrorCodes } from "../common/errors/api-error.codes"
import { PrismaService } from "../common/prisma/prisma.service"

const idempotencyKeyUuidSchema = z.string().uuid()

/**
 * Valida el header `Idempotency-Key` requerido por `cerrar-caso` y
 * `reabrir-caso`. Lanza `BadRequestException(idempotencyKeyRequerida)`
 * si falta o no es UUID v4. Centraliza la validacion duplicada en el
 * controller (cierre §5.84).
 */
export function requireIdempotencyKeyUuid(headerValue: string | undefined): string {
  if (headerValue === undefined || !idempotencyKeyUuidSchema.safeParse(headerValue).success) {
    throw new BadRequestException({
      code: apiErrorCodes.idempotencyKeyRequerida,
      message: "El header Idempotency-Key es obligatorio y debe ser un UUID v4.",
    })
  }
  return headerValue
}

/**
 * Constante para evitar duplicar el literal `"ASIGNADO:ASIGNADO"` del
 * historico de estados (cierre §5.82 deuda P6a). Cualquier nueva
 * transicion que escriba el historico debe construir el literal via
 * `literalEstado(rol, estadoAsignado, estadoVoluntario)`.
 */
export const HISTORICO_LITERAL_ASIGNADO_ASIGNADO = "ASIGNADO:ASIGNADO" as const

/**
 * Construye el literal `"ROL:ESTADO"` que se persiste en el campo
 * `historico_estados_asignacion.estado_anterior` / `estado_nuevo`. Acepta
 * los dos campos de estado de la asignacion porque solo uno esta poblado
 * (CHECK `chk_asig_rol_estado`).
 */
export function literalEstado(
  rol: RolAsignacion,
  estadoAsignado: EstadoAsignado | null,
  estadoVoluntario: EstadoVoluntario | null,
): string {
  if (rol === "ASIGNADO") {
    return `ASIGNADO:${estadoAsignado ?? "?"}`
  }
  return `VOLUNTARIO:${estadoVoluntario ?? "?"}`
}

/**
 * Type guards para filtrar `query.estado` en el listado (§5.80). El schema
 * Zod valida `estado` como union de los 2 enums; estos predicados permiten
 * componer el `WHERE OR` sin `as` y omitir la columna en la que el valor
 * no puede vivir (e.g. `INSCRITO` no aplica a `estadoAsignado`).
 */
const ESTADOS_ASIGNADO_SET = new Set<string>(Object.values(EstadoAsignadoPrisma))
const ESTADOS_VOLUNTARIO_SET = new Set<string>(Object.values(EstadoVoluntarioPrisma))

export function esEstadoAsignado(estado: string): estado is EstadoAsignadoPrisma {
  return ESTADOS_ASIGNADO_SET.has(estado)
}

export function esEstadoVoluntario(estado: string): estado is EstadoVoluntarioPrisma {
  return ESTADOS_VOLUNTARIO_SET.has(estado)
}

/**
 * Predicado de "estado cerrado" para `reabrirCaso`: cierra ASIGNADO en
 * `APTO`/`NO_APTO` y VOLUNTARIO en `COMPLETADO` (cap. 12.5). Extraido como
 * helper para mantener el ejecutor de `runOnce` por debajo del umbral de
 * complejidad cognitiva (Biome `noExcessiveCognitiveComplexity`).
 */
export function esEstadoCerradoParaReabrir(previa: {
  readonly rol: RolAsignacion
  readonly estadoAsignado: EstadoAsignado | null
  readonly estadoVoluntario: EstadoVoluntario | null
}): boolean {
  if (previa.rol === "ASIGNADO") {
    return previa.estadoAsignado === "APTO" || previa.estadoAsignado === "NO_APTO"
  }
  return previa.estadoVoluntario === "COMPLETADO"
}

/**
 * D-AS-10 — Evalua las condiciones de cap. 12.3 para pasar a `LISTO`.
 *
 * `planCompleto` consulta el avance del plan personal (Slice 7):
 *  - VOLUNTARIO: planCompleto=true por diseno (los voluntarios no tienen plan
 *    personal — D-AS-1).
 *  - ASIGNADO sin plan -> planCompleto=false + faltante PLAN_INCOMPLETO.
 *  - ASIGNADO con plan: completo si % avance >= 100 sobre secciones
 *    obligatorias (D-S7-B6). 0 obligatorias -> 100% vacuamente.
 *
 * Transversal/IA conservan los placeholders S6: `NO_APLICA` / `TODO_S*`.
 */
export interface ResultadoEvaluacionListo {
  readonly cumple: boolean
  readonly planCompleto: boolean
  readonly transversal: "NO_APLICA" | "TODO_S8" | "APROBADO" | "NO_APROBADO"
  readonly entrevistaIA: "NO_APLICA" | "TODO_S9" | "APROBADO" | "NO_APROBADO"
  readonly faltantes: readonly CondicionesListoFaltante[]
}

interface CursoEvaluacionListo {
  readonly transversalId: string | null
  readonly entrevistaIaId: string | null
}

export async function evaluarCondicionesListo(
  prisma: PrismaService,
  asignacionId: string,
  curso: CursoEvaluacionListo,
): Promise<ResultadoEvaluacionListo> {
  const planCompleto = await calcularPlanCompleto(prisma, asignacionId)

  // P8c (D-S8-F1) — cierra TODO_S8 / TODO_S9.
  // Resolvemos solo el colaborador del intento; el cursoId no es necesario
  // para las queries de aptitud (los intentos llevan FK a transversalId /
  // entrevistaIaId, no a cursoId).
  const asignacion = await prisma.asignacionCurso.findUnique({
    where: { id: asignacionId },
    select: { colaboradorId: true },
  })

  let transversal: ResultadoEvaluacionListo["transversal"] = "NO_APLICA"
  if (curso.transversalId !== null && asignacion) {
    transversal = (await transversalAprobado(prisma, {
      colaboradorId: asignacion.colaboradorId,
      transversalId: curso.transversalId,
    }))
      ? "APROBADO"
      : "NO_APROBADO"
  }

  let entrevistaIA: ResultadoEvaluacionListo["entrevistaIA"] = "NO_APLICA"
  if (curso.entrevistaIaId !== null && asignacion) {
    entrevistaIA = (await entrevistaIaAprobada(prisma, {
      colaboradorId: asignacion.colaboradorId,
      entrevistaIaId: curso.entrevistaIaId,
    }))
      ? "APROBADO"
      : "NO_APROBADO"
  }

  const transversalBloquea = transversal === "NO_APROBADO"
  const entrevistaBloquea = entrevistaIA === "NO_APROBADO"

  const faltantes: CondicionesListoFaltante[] = []
  if (!planCompleto) {
    faltantes.push({
      codigo: "PLAN_INCOMPLETO",
      mensaje: "El plan personal del colaborador todavia no esta completo.",
    })
  }
  if (transversalBloquea) {
    faltantes.push({
      codigo: "TRANSVERSAL_PENDIENTE",
      mensaje: "El intento de transversal del curso aun no esta aprobado.",
    })
  }
  if (entrevistaBloquea) {
    faltantes.push({
      codigo: "ENTREVISTA_IA_PENDIENTE",
      mensaje: "La entrevista IA del curso aun no esta aprobada.",
    })
  }

  return {
    cumple: faltantes.length === 0,
    planCompleto,
    transversal,
    entrevistaIA,
    faltantes,
  }
}

/**
 * D-S8-F1 — comprueba si existe un intento transversal vigente APROBADO para
 * el colaborador segun politica "ultimo aprobado" (D-S8-C5). Si la skill no
 * etiqueta al transversal, igual cuenta si `aprobado=true`.
 */
export async function transversalAprobado(
  prisma: PrismaService,
  input: {
    readonly colaboradorId: string
    readonly transversalId: string
  },
): Promise<boolean> {
  const intentos = await prisma.intentoTransversal.findMany({
    where: {
      transversalId: input.transversalId,
      colaboradorId: input.colaboradorId,
      anulado: false,
      estado: "FINALIZADO",
    },
    select: { aprobado: true, fecha: true },
    orderBy: { fecha: "asc" },
  })
  if (intentos.length === 0) {
    return false
  }
  const ultimo = intentos[intentos.length - 1]
  if (ultimo?.aprobado === true) {
    return true
  }
  return intentos.some((i) => i.aprobado === true)
}

/**
 * D-S8-F1 — analogo para entrevista IA. Considera `notaAjustadaAdmin` si
 * existe (D-S8-D5). Un intento se considera FINALIZADO cuando tiene al menos
 * una fila en `intentos_entrevista_ia_notas_area` (decision emergente
 * D-EMERG-P8c-3: el schema actual no tiene columna `estado`).
 */
async function entrevistaIaAprobada(
  prisma: PrismaService,
  input: {
    readonly colaboradorId: string
    readonly entrevistaIaId: string
  },
): Promise<boolean> {
  const intentos = await prisma.intentoEntrevistaIA.findMany({
    where: {
      entrevistaIaId: input.entrevistaIaId,
      colaboradorId: input.colaboradorId,
      anulado: false,
    },
    select: {
      aprobado: true,
      fecha: true,
      notasPorArea: { select: { intentoId: true }, take: 1 },
    },
    orderBy: { fecha: "asc" },
  })
  const finalizados = intentos.filter((i) => i.notasPorArea.length > 0)
  if (finalizados.length === 0) {
    return false
  }
  const ultimo = finalizados[finalizados.length - 1]
  if (ultimo?.aprobado === true) {
    return true
  }
  return finalizados.some((i) => i.aprobado === true)
}

async function calcularPlanCompleto(prisma: PrismaService, asignacionId: string): Promise<boolean> {
  const asignacion = await prisma.asignacionCurso.findUnique({
    where: { id: asignacionId },
    select: { rol: true, colaboradorId: true },
  })
  if (!asignacion) {
    return false
  }
  if (asignacion.rol !== RolAsignacionPrisma.ASIGNADO) {
    // Voluntarios no tienen plan personal (D-AS-1).
    return true
  }
  const plan = await prisma.planEstudio.findUnique({
    where: { asignacionId },
    select: { id: true },
  })
  if (!plan) {
    return false
  }
  const items = await prisma.itemPlan.findMany({
    where: { planId: plan.id, caracter: "OBLIGATORIA" },
    select: {
      seccionId: true,
      seccion: {
        select: {
          id: true,
          bloques: {
            where: { estado: "ACTIVO", esEvaluable: true },
            select: { id: true, tipo: true, contenido: true },
          },
        },
      },
    },
  })
  if (items.length === 0) {
    return true
  }
  const bloqueIds = items.flatMap((i) => i.seccion.bloques.map((b) => b.id))
  const intentos =
    bloqueIds.length === 0
      ? []
      : await prisma.intentoBloque.findMany({
          where: {
            colaboradorId: asignacion.colaboradorId,
            bloqueId: { in: bloqueIds },
            esMejorIntento: true,
            estaInvalidado: false,
          },
          select: { bloqueId: true, nota: true },
        })
  const intentoPorBloque = new Map<string, number>()
  for (const it of intentos) {
    intentoPorBloque.set(it.bloqueId, Number(it.nota.toString()))
  }
  const seccionIdsSinBloques = items
    .filter((i) => i.seccion.bloques.length === 0)
    .map((i) => i.seccionId)
  const aperturas =
    seccionIdsSinBloques.length === 0
      ? []
      : await prisma.aperturaSeccion.findMany({
          where: { asignacionId, seccionId: { in: seccionIdsSinBloques } },
          select: { seccionId: true },
        })
  const aperturasSet = new Set(aperturas.map((a) => a.seccionId))
  for (const item of items) {
    const bloques = item.seccion.bloques
    if (bloques.length === 0) {
      if (!aperturasSet.has(item.seccionId)) {
        return false
      }
      continue
    }
    const todosCumplen = bloques.every((b) => {
      const nota = intentoPorBloque.get(b.id)
      const umbral = umbralAprobacionBloque(b.tipo, b.contenido)
      return nota !== undefined && nota >= umbral
    })
    if (!todosCumplen) {
      return false
    }
  }
  return true
}

/**
 * Selects explicitos del recurso AsignacionCurso (D-AS, D-CUR-12). Reutilizados
 * por todos los endpoints del modulo. Cualquier campo sensible adicional debe
 * agregarse explicitamente, nunca exponer el modelo Prisma directo.
 */
export const SELECT_ASIGNACION_FIELDS = {
  id: true,
  colaboradorId: true,
  cursoId: true,
  rol: true,
  origenVoluntario: true,
  estadoAsignado: true,
  estadoVoluntario: true,
  fechaInicio: true,
  fechaCierre: true,
  resultadoEntrevistaCliente: true,
  createdAt: true,
  updatedAt: true,
  colaborador: {
    select: {
      id: true,
      nombre: true,
      email: true,
    },
  },
} as const satisfies Prisma.AsignacionCursoSelect

export const SELECT_ASIGNACION_DETALLE_FIELDS = {
  id: true,
  colaboradorId: true,
  cursoId: true,
  rol: true,
  origenVoluntario: true,
  estadoAsignado: true,
  estadoVoluntario: true,
  fechaInicio: true,
  fechaCierre: true,
  observacionesAdmin: true,
  observacionesCliente: true,
  fechaEntrevistaCliente: true,
  resultadoEntrevistaCliente: true,
  createdAt: true,
  updatedAt: true,
  colaborador: {
    select: {
      id: true,
      nombre: true,
      email: true,
    },
  },
  historicoEstados: {
    select: {
      fecha: true,
      estadoAnterior: true,
      estadoNuevo: true,
      motivo: true,
    },
    orderBy: { fecha: "desc" },
    take: 5,
  },
} as const satisfies Prisma.AsignacionCursoSelect

type AsignacionRow = Prisma.AsignacionCursoGetPayload<{
  select: typeof SELECT_ASIGNACION_FIELDS
}>

type AsignacionDetalleRow = Prisma.AsignacionCursoGetPayload<{
  select: typeof SELECT_ASIGNACION_DETALLE_FIELDS
}>

function fechaIso(d: Date | null): string | null {
  return d === null ? null : d.toISOString()
}

function fechaDia(d: Date | null): string | null {
  return d === null ? null : d.toISOString().slice(0, 10)
}

export function toAsignacion(row: AsignacionRow): Asignacion {
  return {
    id: row.id,
    colaboradorId: row.colaboradorId,
    cursoId: row.cursoId,
    rol: row.rol,
    origenVoluntario: row.origenVoluntario,
    estadoAsignado: row.estadoAsignado,
    estadoVoluntario: row.estadoVoluntario,
    fechaInicio: fechaIso(row.fechaInicio),
    fechaCierre: fechaIso(row.fechaCierre),
    resultadoEntrevistaCliente: row.resultadoEntrevistaCliente,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    colaborador: {
      id: row.colaborador.id,
      nombreCompleto: row.colaborador.nombre,
      email: row.colaborador.email,
    },
  }
}

export function toAsignacionDetallada(row: AsignacionDetalleRow): AsignacionDetallada {
  return {
    id: row.id,
    colaboradorId: row.colaboradorId,
    cursoId: row.cursoId,
    rol: row.rol,
    origenVoluntario: row.origenVoluntario,
    estadoAsignado: row.estadoAsignado,
    estadoVoluntario: row.estadoVoluntario,
    fechaInicio: fechaIso(row.fechaInicio),
    fechaCierre: fechaIso(row.fechaCierre),
    resultadoEntrevistaCliente: row.resultadoEntrevistaCliente,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    colaborador: {
      id: row.colaborador.id,
      nombreCompleto: row.colaborador.nombre,
      email: row.colaborador.email,
    },
    observacionesAdmin: row.observacionesAdmin,
    observacionesCliente: row.observacionesCliente,
    fechaEntrevistaCliente: fechaDia(row.fechaEntrevistaCliente),
    historicoEstados: row.historicoEstados.map((h) => ({
      fecha: h.fecha.toISOString(),
      estadoAnterior: h.estadoAnterior,
      estadoNuevo: h.estadoNuevo,
      motivo: h.motivo,
    })),
  }
}

const TOP_SKILLS_DESTACADAS = 4
const MAX_AREAS_SECUNDARIAS = 2

/**
 * Shape minimo que necesita `proyectarCursoDisponible`. No usamos
 * `Prisma.CursoGetPayload` porque acoplaria el helper a una unica firma de
 * `select` y dificultaria reusarlo en tests.
 */
export interface CursoDisponibleRow {
  readonly id: string
  readonly titulo: string
  readonly fechaInicio: Date
  readonly fechaDeadline: Date
  readonly cliente: { readonly id: string; readonly nombre: string }
  readonly areasExigidas: ReadonlyArray<{
    readonly peso: Prisma.Decimal | number
    readonly area: { readonly id: string; readonly nombre: string; readonly codigo: string }
  }>
  readonly skillsExigidas: ReadonlyArray<{
    readonly notaMinima: Prisma.Decimal | number
    readonly skill: {
      readonly id: string
      readonly etiquetaVisible: string
      readonly area: { readonly codigo: string }
    }
  }>
  readonly _count: { readonly asignaciones: number }
}

function pesoNumero(p: Prisma.Decimal | number): number {
  return typeof p === "number" ? p : Number(p)
}

/**
 * Proyecta la fila completa de Prisma al contrato `CursoDisponibleVoluntario`.
 * Reglas:
 *  - `areaPrincipal` = la `CursoAreaExigida` con mayor `peso` (desempate
 *    alfabetico por `area.nombre`). Si el curso no tiene areas exigidas
 *    devuelve `null` en `areaPrincipal.id` y los demas como cadenas vacias
 *    (no deberia pasar en cursos ACTIVO, pero el contrato exige no romper).
 *  - `areasSecundarias` = resto ordenadas por peso desc, max 2.
 *  - `skillsDestacadas` = top 4 por `notaMinima` desc + `etiqueta` asc.
 */
export function proyectarCursoDisponible(row: CursoDisponibleRow): CursoDisponibleVoluntario {
  const areasOrdenadas = [...row.areasExigidas].sort((a, b) => {
    const diff = pesoNumero(b.peso) - pesoNumero(a.peso)
    if (diff !== 0) {
      return diff
    }
    return a.area.nombre.localeCompare(b.area.nombre)
  })
  const principal = areasOrdenadas[0]?.area
  const secundarias = areasOrdenadas
    .slice(1, 1 + MAX_AREAS_SECUNDARIAS)
    .map(({ area }) => ({ id: area.id, nombre: area.nombre, codigo: area.codigo }))

  const skills = [...row.skillsExigidas]
    .sort((a, b) => {
      const diff = pesoNumero(b.notaMinima) - pesoNumero(a.notaMinima)
      if (diff !== 0) {
        return diff
      }
      return a.skill.etiquetaVisible.localeCompare(b.skill.etiquetaVisible)
    })
    .slice(0, TOP_SKILLS_DESTACADAS)
    .map(({ skill }) => ({
      id: skill.id,
      etiquetaVisible: skill.etiquetaVisible,
      areaCodigo: skill.area.codigo,
    }))

  return {
    cursoId: row.id,
    titulo: row.titulo,
    cliente: { id: row.cliente.id, nombre: row.cliente.nombre },
    fechaInicio: row.fechaInicio.toISOString().slice(0, 10),
    fechaDeadline: row.fechaDeadline.toISOString().slice(0, 10),
    voluntariosInscritos: row._count.asignaciones,
    areaPrincipal: principal
      ? { id: principal.id, nombre: principal.nombre, codigo: principal.codigo }
      : { id: "", nombre: "", codigo: "" },
    areasSecundarias: secundarias,
    skillsDestacadas: skills,
  }
}
