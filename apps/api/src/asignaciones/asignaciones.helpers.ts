import {
  Asignacion,
  AsignacionDetallada,
  CondicionesListoFaltante,
  EstadoAsignado,
  EstadoVoluntario,
  RolAsignacion,
} from "@nexott-learn/shared-types"
import { Prisma } from "@prisma/client"

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
 * D-AS-10 — Evalua las condiciones de cap. 12.3 para pasar a `LISTO`.
 *
 * En S6 con S7/S8/S9 ausentes:
 *  - `planCompleto: true` (TODO(S7) — sustituir por consulta real al plan).
 *  - `transversal: 'NO_APLICA'` si el curso no exige transversal; cuando S8
 *    conecte el intento real, devolvera `APROBADO` / `NO_APROBADO` /
 *    `TODO_S8` segun corresponda.
 *  - `entrevistaIA: 'NO_APLICA'` analoga para S9.
 *
 * `cumple` es la conjuncion: todas las dimensiones cumplen (`true` /
 * `NO_APLICA` / `APROBADO`). `faltantes` lista los codigos pendientes
 * para devolverlos en `422 condicionesListoNoCumplidas`.
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

export function evaluarCondicionesListo(curso: CursoEvaluacionListo): ResultadoEvaluacionListo {
  // Hoy solo emitimos `true` (TODO(S7) hasta que exista calculo real del plan).
  const planCompleto = true
  // En S6 los placeholders solo emiten `NO_APLICA` o `TODO_*`. Los valores
  // `APROBADO`/`NO_APROBADO` se reservan para cuando S8 y S9 conecten el
  // calculo real (D-AS-10).
  const transversal: ResultadoEvaluacionListo["transversal"] =
    curso.transversalId === null ? "NO_APLICA" : "TODO_S8"
  const entrevistaIA: ResultadoEvaluacionListo["entrevistaIA"] =
    curso.entrevistaIaId === null ? "NO_APLICA" : "TODO_S9"

  const transversalBloquea = transversal !== "NO_APLICA"
  const entrevistaBloquea = entrevistaIA !== "NO_APLICA"

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
