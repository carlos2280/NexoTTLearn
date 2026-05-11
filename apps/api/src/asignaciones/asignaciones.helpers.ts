import { Asignacion, AsignacionDetallada } from "@nexott-learn/shared-types"
import { Prisma } from "@prisma/client"

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
