import type {
  EntregaBloqueDetalleAdmin,
  EntregaBloqueIntentoPrevioAdmin,
  EntregaBloqueListItemAdmin,
} from "@nexott-learn/shared-types"
import { Prisma } from "@prisma/client"

// =============================================================================
// CENTRO DE REVISION · ENTREGAS DE BLOQUE (Iter 9.A)
// MAESTRO §9 (entregas), §12.3 (acciones admin).
// nota es Decimal(5,2) → convertimos a number plano (T05 · I1 sigue calculandose
// fuera de este modulo).
// =============================================================================

// ─────────────────────────────────────────────────────────────────
// LISTADO · select liviano para la cola
// ─────────────────────────────────────────────────────────────────

export const ENTREGA_BLOQUE_LISTADO_SELECT = {
  id: true,
  inscripcionId: true,
  bloqueId: true,
  intento: true,
  estado: true,
  nota: true,
  ajustadaManual: true,
  enviadaAt: true,
  evaluadaAt: true,
  inscripcion: {
    select: {
      participante: {
        select: { id: true, nombre: true, apellido: true, email: true },
      },
      curso: {
        select: { id: true, titulo: true, empresaCliente: true },
      },
    },
  },
  bloque: {
    select: {
      id: true,
      tipo: true,
      codigoEvaluable: true,
      seccion: {
        select: {
          titulo: true,
          modulo: { select: { id: true, titulo: true } },
        },
      },
    },
  },
} satisfies Prisma.EntregaBloqueSelect

export type EntregaBloqueListadoRow = Prisma.EntregaBloqueGetPayload<{
  select: typeof ENTREGA_BLOQUE_LISTADO_SELECT
}>

export function mapEntregaBloqueListItem(row: EntregaBloqueListadoRow): EntregaBloqueListItemAdmin {
  return {
    id: row.id,
    inscripcionId: row.inscripcionId,
    bloqueId: row.bloqueId,
    intento: row.intento,
    estado: row.estado,
    nota: decimalToNullableNumber(row.nota),
    ajustadaManual: row.ajustadaManual,
    enviadaAt: row.enviadaAt.toISOString(),
    evaluadaAt: row.evaluadaAt ? row.evaluadaAt.toISOString() : null,
    participante: {
      id: row.inscripcion.participante.id,
      nombre: row.inscripcion.participante.nombre,
      apellido: row.inscripcion.participante.apellido,
      email: row.inscripcion.participante.email,
    },
    bloque: {
      id: row.bloque.id,
      tipo: row.bloque.tipo,
      codigoEvaluable: row.bloque.codigoEvaluable,
      seccionTitulo: row.bloque.seccion.titulo,
      moduloId: row.bloque.seccion.modulo.id,
      moduloTitulo: row.bloque.seccion.modulo.titulo,
    },
    curso: {
      id: row.inscripcion.curso.id,
      titulo: row.inscripcion.curso.titulo,
      empresaCliente: row.inscripcion.curso.empresaCliente,
    },
  }
}

// ─────────────────────────────────────────────────────────────────
// DETALLE · select completo + intentos previos
// ─────────────────────────────────────────────────────────────────

export const ENTREGA_BLOQUE_DETALLE_SELECT = {
  id: true,
  inscripcionId: true,
  bloqueId: true,
  intento: true,
  estado: true,
  nota: true,
  feedback: true,
  ajustadaManual: true,
  evaluadaPorId: true,
  enviadaAt: true,
  evaluadaAt: true,
  contenido: true,
  inscripcion: {
    select: {
      id: true,
      estado: true,
      tipo: true,
      participante: {
        select: { id: true, nombre: true, apellido: true, email: true },
      },
      curso: {
        select: { id: true, titulo: true, empresaCliente: true, estado: true },
      },
    },
  },
  bloque: {
    select: {
      id: true,
      tipo: true,
      codigoEvaluable: true,
      payload: true,
      seccion: {
        select: {
          id: true,
          titulo: true,
          modulo: { select: { id: true, titulo: true } },
        },
      },
    },
  },
} satisfies Prisma.EntregaBloqueSelect

export type EntregaBloqueDetalleRow = Prisma.EntregaBloqueGetPayload<{
  select: typeof ENTREGA_BLOQUE_DETALLE_SELECT
}>

// Select reducido para los intentos del mismo (participante, bloque).
export const ENTREGA_BLOQUE_INTENTO_SELECT = {
  id: true,
  intento: true,
  estado: true,
  nota: true,
  ajustadaManual: true,
  enviadaAt: true,
  evaluadaAt: true,
} satisfies Prisma.EntregaBloqueSelect

export type EntregaBloqueIntentoRow = Prisma.EntregaBloqueGetPayload<{
  select: typeof ENTREGA_BLOQUE_INTENTO_SELECT
}>

export function mapEntregaBloqueIntentoPrevio(
  row: EntregaBloqueIntentoRow,
): EntregaBloqueIntentoPrevioAdmin {
  return {
    id: row.id,
    intento: row.intento,
    estado: row.estado,
    nota: decimalToNullableNumber(row.nota),
    ajustadaManual: row.ajustadaManual,
    enviadaAt: row.enviadaAt.toISOString(),
    evaluadaAt: row.evaluadaAt ? row.evaluadaAt.toISOString() : null,
  }
}

export function mapEntregaBloqueDetalle(
  row: EntregaBloqueDetalleRow,
  intentos: EntregaBloqueIntentoRow[],
): EntregaBloqueDetalleAdmin {
  return {
    id: row.id,
    inscripcionId: row.inscripcionId,
    bloqueId: row.bloqueId,
    intento: row.intento,
    estado: row.estado,
    nota: decimalToNullableNumber(row.nota),
    feedback: row.feedback,
    ajustadaManual: row.ajustadaManual,
    evaluadaPorId: row.evaluadaPorId,
    enviadaAt: row.enviadaAt.toISOString(),
    evaluadaAt: row.evaluadaAt ? row.evaluadaAt.toISOString() : null,
    contenido: row.contenido as unknown,
    participante: {
      id: row.inscripcion.participante.id,
      nombre: row.inscripcion.participante.nombre,
      apellido: row.inscripcion.participante.apellido,
      email: row.inscripcion.participante.email,
    },
    bloque: {
      id: row.bloque.id,
      tipo: row.bloque.tipo,
      codigoEvaluable: row.bloque.codigoEvaluable,
      payload: row.bloque.payload as unknown,
      seccionId: row.bloque.seccion.id,
      seccionTitulo: row.bloque.seccion.titulo,
      moduloId: row.bloque.seccion.modulo.id,
      moduloTitulo: row.bloque.seccion.modulo.titulo,
    },
    curso: {
      id: row.inscripcion.curso.id,
      titulo: row.inscripcion.curso.titulo,
      empresaCliente: row.inscripcion.curso.empresaCliente,
      estado: row.inscripcion.curso.estado,
    },
    inscripcion: {
      id: row.inscripcion.id,
      estado: row.inscripcion.estado,
      tipo: row.inscripcion.tipo,
    },
    intentos: intentos.map(mapEntregaBloqueIntentoPrevio),
  }
}

// ─────────────────────────────────────────────────────────────────
// SNAPSHOT para log_actividad (T02 · I1, A26)
// ─────────────────────────────────────────────────────────────────

interface EntregaBloqueSnapshotInput {
  id: string
  estado: string
  nota: Prisma.Decimal | null
  feedback: string | null
  ajustadaManual: boolean
  evaluadaPorId: string | null
  evaluadaAt: Date | null
}

export function snapshotEntregaBloque(row: EntregaBloqueSnapshotInput): Prisma.InputJsonValue {
  return {
    id: row.id,
    estado: row.estado,
    nota: decimalToNullableNumber(row.nota),
    feedback: row.feedback,
    ajustadaManual: row.ajustadaManual,
    evaluadaPorId: row.evaluadaPorId,
    evaluadaAt: row.evaluadaAt ? row.evaluadaAt.toISOString() : null,
  }
}

// ─────────────────────────────────────────────────────────────────
// Helper: Decimal(5,2) → number | null
// ─────────────────────────────────────────────────────────────────

function decimalToNullableNumber(value: Prisma.Decimal | null): number | null {
  if (value === null) {
    return null
  }
  return value.toNumber()
}
