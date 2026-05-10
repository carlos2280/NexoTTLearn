import type {
  EntregaProyectoDetalleAdmin,
  EntregaProyectoIntentoPrevioAdmin,
  EntregaProyectoListItemAdmin,
  TipoEntregaProyecto,
} from "@nexott-learn/shared-types"
import { Prisma } from "@prisma/client"

// =============================================================================
// CENTRO DE REVISION · ENTREGAS DE PROYECTO (Iter 9.B)
// MAESTRO §10 (proyectos 3 capas), §10.5 (fórmula notaFinal), §12.4
// (acciones admin sobre proyecto), §12.5 (trazabilidad).
// notaFinal/notaCapa*/pesoCapa*Aplicado son Decimal(5,2) → number plano.
// =============================================================================

// ─────────────────────────────────────────────────────────────────
// LISTADO · select liviano para la cola
// ─────────────────────────────────────────────────────────────────

export const ENTREGA_PROYECTO_LISTADO_SELECT = {
  id: true,
  inscripcionId: true,
  miniProyectoId: true,
  transversalId: true,
  intento: true,
  estado: true,
  notaFinal: true,
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
  miniProyecto: {
    select: {
      id: true,
      titulo: true,
      modulo: { select: { id: true, titulo: true } },
    },
  },
  transversal: {
    select: { id: true, titulo: true },
  },
} satisfies Prisma.EntregaProyectoSelect

export type EntregaProyectoListadoRow = Prisma.EntregaProyectoGetPayload<{
  select: typeof ENTREGA_PROYECTO_LISTADO_SELECT
}>

export function deriveTipoProyecto(row: {
  miniProyectoId: string | null
  transversalId: string | null
}): TipoEntregaProyecto {
  if (row.miniProyectoId !== null && row.transversalId === null) {
    return "MINI"
  }
  if (row.transversalId !== null && row.miniProyectoId === null) {
    return "TRANSVERSAL"
  }
  // BD ya enforce el XOR (INVARIANTES-DB I2). Defensivo.
  throw new Error(
    `EntregaProyecto invariante XOR violado: miniProyectoId=${row.miniProyectoId}, transversalId=${row.transversalId}`,
  )
}

export function mapEntregaProyectoListItem(
  row: EntregaProyectoListadoRow,
): EntregaProyectoListItemAdmin {
  const tipo = deriveTipoProyecto(row)
  const proyectoTitulo =
    tipo === "MINI" ? (row.miniProyecto?.titulo ?? "") : (row.transversal?.titulo ?? "")
  const moduloId = tipo === "MINI" ? (row.miniProyecto?.modulo.id ?? null) : null
  const moduloTitulo = tipo === "MINI" ? (row.miniProyecto?.modulo.titulo ?? null) : null
  return {
    id: row.id,
    inscripcionId: row.inscripcionId,
    tipo,
    miniProyectoId: row.miniProyectoId,
    transversalId: row.transversalId,
    intento: row.intento,
    estado: row.estado,
    notaFinal: decimalToNullableNumber(row.notaFinal),
    ajustadaManual: row.ajustadaManual,
    enviadaAt: row.enviadaAt.toISOString(),
    evaluadaAt: row.evaluadaAt ? row.evaluadaAt.toISOString() : null,
    participante: {
      id: row.inscripcion.participante.id,
      nombre: row.inscripcion.participante.nombre,
      apellido: row.inscripcion.participante.apellido,
      email: row.inscripcion.participante.email,
    },
    curso: {
      id: row.inscripcion.curso.id,
      titulo: row.inscripcion.curso.titulo,
      empresaCliente: row.inscripcion.curso.empresaCliente,
    },
    proyectoTitulo,
    moduloId,
    moduloTitulo,
  }
}

// ─────────────────────────────────────────────────────────────────
// DETALLE · select completo + intentos previos
// ─────────────────────────────────────────────────────────────────

export const ENTREGA_PROYECTO_DETALLE_SELECT = {
  id: true,
  inscripcionId: true,
  miniProyectoId: true,
  transversalId: true,
  intento: true,
  estado: true,
  urlRepo: true,
  rama: true,
  notaCapa1: true,
  notaCapa2: true,
  notaCapa3: true,
  notaFinal: true,
  ajustadaManual: true,
  pesoCapa1Aplicado: true,
  pesoCapa2Aplicado: true,
  pesoCapa3Aplicado: true,
  fortalezas: true,
  areasMejora: true,
  dudasDetectadas: true,
  transcripcionCapa3: true,
  enviadaAt: true,
  evaluadaAt: true,
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
  miniProyecto: {
    select: {
      id: true,
      titulo: true,
      enunciado: true,
      pesoCapa1: true,
      pesoCapa2: true,
      pesoCapa3: true,
      modulo: { select: { id: true, titulo: true } },
    },
  },
  transversal: {
    select: {
      id: true,
      titulo: true,
      enunciado: true,
      umbralAprobacion: true,
      pesoCapa1: true,
      pesoCapa2: true,
      pesoCapa3: true,
    },
  },
} satisfies Prisma.EntregaProyectoSelect

export type EntregaProyectoDetalleRow = Prisma.EntregaProyectoGetPayload<{
  select: typeof ENTREGA_PROYECTO_DETALLE_SELECT
}>

export const ENTREGA_PROYECTO_INTENTO_SELECT = {
  id: true,
  intento: true,
  estado: true,
  notaFinal: true,
  ajustadaManual: true,
  enviadaAt: true,
  evaluadaAt: true,
} satisfies Prisma.EntregaProyectoSelect

export type EntregaProyectoIntentoRow = Prisma.EntregaProyectoGetPayload<{
  select: typeof ENTREGA_PROYECTO_INTENTO_SELECT
}>

export function mapEntregaProyectoIntentoPrevio(
  row: EntregaProyectoIntentoRow,
): EntregaProyectoIntentoPrevioAdmin {
  return {
    id: row.id,
    intento: row.intento,
    estado: row.estado,
    notaFinal: decimalToNullableNumber(row.notaFinal),
    ajustadaManual: row.ajustadaManual,
    enviadaAt: row.enviadaAt.toISOString(),
    evaluadaAt: row.evaluadaAt ? row.evaluadaAt.toISOString() : null,
  }
}

export function mapEntregaProyectoDetalle(
  row: EntregaProyectoDetalleRow,
  intentos: EntregaProyectoIntentoRow[],
): EntregaProyectoDetalleAdmin {
  const tipo = deriveTipoProyecto(row)
  return {
    id: row.id,
    inscripcionId: row.inscripcionId,
    tipo,
    miniProyectoId: row.miniProyectoId,
    transversalId: row.transversalId,
    intento: row.intento,
    estado: row.estado,
    urlRepo: row.urlRepo,
    rama: row.rama,
    notaCapa1: decimalToNullableNumber(row.notaCapa1),
    notaCapa2: decimalToNullableNumber(row.notaCapa2),
    notaCapa3: decimalToNullableNumber(row.notaCapa3),
    notaFinal: decimalToNullableNumber(row.notaFinal),
    ajustadaManual: row.ajustadaManual,
    pesoCapa1Aplicado: decimalToNullableNumber(row.pesoCapa1Aplicado),
    pesoCapa2Aplicado: decimalToNullableNumber(row.pesoCapa2Aplicado),
    pesoCapa3Aplicado: decimalToNullableNumber(row.pesoCapa3Aplicado),
    notaCalculadaOriginal: calcularNotaCalculadaOriginal(row),
    fortalezas: row.fortalezas,
    areasMejora: row.areasMejora,
    dudasDetectadas: row.dudasDetectadas,
    transcripcionCapa3: row.transcripcionCapa3,
    enviadaAt: row.enviadaAt.toISOString(),
    evaluadaAt: row.evaluadaAt ? row.evaluadaAt.toISOString() : null,
    participante: {
      id: row.inscripcion.participante.id,
      nombre: row.inscripcion.participante.nombre,
      apellido: row.inscripcion.participante.apellido,
      email: row.inscripcion.participante.email,
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
    miniProyecto: row.miniProyecto
      ? {
          id: row.miniProyecto.id,
          titulo: row.miniProyecto.titulo,
          enunciado: row.miniProyecto.enunciado,
          moduloId: row.miniProyecto.modulo.id,
          moduloTitulo: row.miniProyecto.modulo.titulo,
          pesoCapa1: row.miniProyecto.pesoCapa1.toNumber(),
          pesoCapa2: row.miniProyecto.pesoCapa2.toNumber(),
          pesoCapa3: row.miniProyecto.pesoCapa3.toNumber(),
        }
      : null,
    transversal: row.transversal
      ? {
          id: row.transversal.id,
          titulo: row.transversal.titulo,
          enunciado: row.transversal.enunciado,
          umbralAprobacion: row.transversal.umbralAprobacion,
          pesoCapa1: row.transversal.pesoCapa1.toNumber(),
          pesoCapa2: row.transversal.pesoCapa2.toNumber(),
          pesoCapa3: row.transversal.pesoCapa3.toNumber(),
        }
      : null,
    intentos: intentos.map(mapEntregaProyectoIntentoPrevio),
  }
}

// ─────────────────────────────────────────────────────────────────
// CALCULO notaFinal · MAESTRO §10.5
// notaFinal = (notaC1*pC1 + notaC2*pC2 + notaC3*pC3) / 100
// con pesos en porcentaje (p1+p2+p3=100, T04). Redondeo a 2 decimales.
// ─────────────────────────────────────────────────────────────────

export function calcularNotaFinal(
  notaC1: Prisma.Decimal | number,
  notaC2: Prisma.Decimal | number,
  notaC3: Prisma.Decimal | number,
  pesoC1: Prisma.Decimal | number,
  pesoC2: Prisma.Decimal | number,
  pesoC3: Prisma.Decimal | number,
): Prisma.Decimal {
  const n1 = toDecimal(notaC1)
  const n2 = toDecimal(notaC2)
  const n3 = toDecimal(notaC3)
  const p1 = toDecimal(pesoC1)
  const p2 = toDecimal(pesoC2)
  const p3 = toDecimal(pesoC3)

  // (n1*p1 + n2*p2 + n3*p3) / 100, redondeado a 2 decimales (HALF_UP).
  const ponderado = n1.mul(p1).add(n2.mul(p2)).add(n3.mul(p3)).div(100)
  return ponderado.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)
}

function calcularNotaCalculadaOriginal(row: EntregaProyectoDetalleRow): number | null {
  if (
    row.notaCapa1 === null ||
    row.notaCapa2 === null ||
    row.notaCapa3 === null ||
    row.pesoCapa1Aplicado === null ||
    row.pesoCapa2Aplicado === null ||
    row.pesoCapa3Aplicado === null
  ) {
    return null
  }
  return calcularNotaFinal(
    row.notaCapa1,
    row.notaCapa2,
    row.notaCapa3,
    row.pesoCapa1Aplicado,
    row.pesoCapa2Aplicado,
    row.pesoCapa3Aplicado,
  ).toNumber()
}

// ─────────────────────────────────────────────────────────────────
// SNAPSHOT para log_actividad
// ─────────────────────────────────────────────────────────────────

interface EntregaProyectoSnapshotInput {
  id: string
  estado: string
  notaCapa1: Prisma.Decimal | null
  notaCapa2: Prisma.Decimal | null
  notaCapa3: Prisma.Decimal | null
  notaFinal: Prisma.Decimal | null
  pesoCapa1Aplicado: Prisma.Decimal | null
  pesoCapa2Aplicado: Prisma.Decimal | null
  pesoCapa3Aplicado: Prisma.Decimal | null
  ajustadaManual: boolean
  fortalezas: string | null
  areasMejora: string | null
  dudasDetectadas: string | null
  transcripcionCapa3: string | null
  evaluadaAt: Date | null
}

export function snapshotEntregaProyecto(row: EntregaProyectoSnapshotInput): Prisma.InputJsonValue {
  return {
    id: row.id,
    estado: row.estado,
    notaCapa1: decimalToNullableNumber(row.notaCapa1),
    notaCapa2: decimalToNullableNumber(row.notaCapa2),
    notaCapa3: decimalToNullableNumber(row.notaCapa3),
    notaFinal: decimalToNullableNumber(row.notaFinal),
    pesoCapa1Aplicado: decimalToNullableNumber(row.pesoCapa1Aplicado),
    pesoCapa2Aplicado: decimalToNullableNumber(row.pesoCapa2Aplicado),
    pesoCapa3Aplicado: decimalToNullableNumber(row.pesoCapa3Aplicado),
    ajustadaManual: row.ajustadaManual,
    fortalezas: row.fortalezas,
    areasMejora: row.areasMejora,
    dudasDetectadas: row.dudasDetectadas,
    transcripcionCapa3: row.transcripcionCapa3,
    evaluadaAt: row.evaluadaAt ? row.evaluadaAt.toISOString() : null,
  }
}

// ─────────────────────────────────────────────────────────────────
// Helpers internos
// ─────────────────────────────────────────────────────────────────

function decimalToNullableNumber(value: Prisma.Decimal | null): number | null {
  if (value === null) {
    return null
  }
  return value.toNumber()
}

function toDecimal(value: Prisma.Decimal | number): Prisma.Decimal {
  return value instanceof Prisma.Decimal ? value : new Prisma.Decimal(value)
}
