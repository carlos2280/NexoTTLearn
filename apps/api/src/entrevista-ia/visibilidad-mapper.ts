import {
  IntentoEntrevistaIaAdminResponse,
  IntentoEntrevistaIaParticipanteResponse,
  ReporteEvaluadorEntrevistaIa,
  TurnoEntrevistaIa,
  reporteEvaluadorEntrevistaIaSchema,
} from "@nexott-learn/shared-types"
import { Prisma } from "@prisma/client"
import { IntentoEntrevistaSeleccionado, TranscripcionInterna } from "./entrevista-ia.types"

/**
 * Mapeadores de visibilidad campo-a-campo (P8c — D89). ADMIN recibe todo;
 * PARTICIPANTE NO recibe `motivoAjusteOAnulacion`, `notaAjustadaAdmin`.
 */

function decimalAnumero(value: Prisma.Decimal | null): number | null {
  if (value === null) {
    return null
  }
  return Number(value.toString())
}

export function parsearTranscripcionInterna(value: Prisma.JsonValue): TranscripcionInterna {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return {
      estado: "EN_PROGRESO",
      rubricaSnapshot: {},
      seccionesBaseSnapshot: {},
      turnos: [],
      fechaFinalizacion: null,
    }
  }
  const obj = value as Record<string, unknown>
  return {
    estado: obj.estado === "FINALIZADO" ? "FINALIZADO" : "EN_PROGRESO",
    rubricaSnapshot:
      typeof obj.rubricaSnapshot === "object" && obj.rubricaSnapshot !== null
        ? (obj.rubricaSnapshot as Record<string, unknown>)
        : {},
    seccionesBaseSnapshot:
      typeof obj.seccionesBaseSnapshot === "object" && obj.seccionesBaseSnapshot !== null
        ? (obj.seccionesBaseSnapshot as Record<string, unknown>)
        : {},
    turnos: Array.isArray(obj.turnos) ? (obj.turnos as TurnoEntrevistaIa[]) : [],
    fechaFinalizacion: typeof obj.fechaFinalizacion === "string" ? obj.fechaFinalizacion : null,
  }
}

/**
 * Determina el estado externo del intento. FIX-P8-cierre §5.119: ahora la SoT
 * es la columna dedicada `intento.estado`; el bloque legacy (anulado + JSONB)
 * persiste como fallback defensivo para intentos creados antes de la migracion
 * `20260517000000_slice_8_cierre_aditivos` (el backfill ya cubre filas en
 * produccion; este fallback se mantiene solo por simetria de proyectos
 * down-grade y desaparece cuando se elimine la duplicidad JSONB).
 */
export function derivarEstado(
  intento: Pick<IntentoEntrevistaSeleccionado, "anulado" | "estado" | "notasPorArea">,
  interna: TranscripcionInterna,
): "EN_PROGRESO" | "FINALIZADO" | "ANULADO" {
  if (intento.estado === "ANULADO" || intento.anulado) {
    return "ANULADO"
  }
  if (
    intento.estado === "FINALIZADO" ||
    interna.estado === "FINALIZADO" ||
    intento.notasPorArea.length > 0
  ) {
    return "FINALIZADO"
  }
  return "EN_PROGRESO"
}

function notasPorAreaSerializadas(
  intento: IntentoEntrevistaSeleccionado,
): IntentoEntrevistaIaAdminResponse["notasPorArea"] {
  return intento.notasPorArea.map((n) => ({
    areaId: n.areaId,
    nota: Number(n.nota.toString()),
  }))
}

/**
 * Parsea defensivamente el JSONB `reporte_evaluador`. Si el shape no cumple el
 * contrato (caso: filas sembradas mal o registros previos a la migracion),
 * devuelve `null` en lugar de propagar el error al frontend.
 */
function parsearReporteEvaluador(
  value: Prisma.JsonValue | null,
): ReporteEvaluadorEntrevistaIa | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return null
  }
  const parsed = reporteEvaluadorEntrevistaIaSchema.safeParse(value)
  return parsed.success ? parsed.data : null
}

function clonarTurnos(
  turnos: TranscripcionInterna["turnos"],
): IntentoEntrevistaIaAdminResponse["transcripcion"] {
  return turnos.map((t) => ({
    rol: t.rol,
    mensaje: t.mensaje,
    timestamp: t.timestamp,
  }))
}

export function toIntentoAdmin(
  intento: IntentoEntrevistaSeleccionado,
  contexto: { readonly asignacionId: string },
): IntentoEntrevistaIaAdminResponse {
  const interna = parsearTranscripcionInterna(intento.transcripcionOLog)
  const estado = derivarEstado(intento, interna)
  const finalizado = estado === "FINALIZADO"
  return {
    intentoId: intento.id,
    estado,
    fecha: intento.fecha.toISOString(),
    transcripcion: clonarTurnos(interna.turnos),
    notaGlobal: finalizado ? Number(intento.notaGlobal.toString()) : null,
    aprobado: finalizado ? intento.aprobado : null,
    anulado: intento.anulado,
    notasPorArea: notasPorAreaSerializadas(intento),
    notaAjustadaAdmin: decimalAnumero(intento.notaAjustadaAdmin),
    motivoAjusteOAnulacion: intento.motivoAjusteOAnulacion,
    reporteEvaluador: parsearReporteEvaluador(intento.reporteEvaluador),
    colaborador: {
      id: intento.colaborador.id,
      nombre: intento.colaborador.nombre,
      email: intento.colaborador.email,
    },
    // EntrevistaIA SIEMPRE pertenece a un curso (FK NOT NULL en BD); el tipo
    // generado de Prisma lo marca opcional pero por integridad referencial
    // jamas es null en runtime.
    curso: {
      id: intento.entrevistaIA.curso?.id ?? intento.entrevistaIA.cursoId,
      titulo: intento.entrevistaIA.curso?.titulo ?? "",
      umbralAprobacion: Number(intento.entrevistaIA.umbralAprobacion.toString()),
    },
    asignacionId: contexto.asignacionId,
  }
}

export function toIntentoParticipante(
  intento: IntentoEntrevistaSeleccionado,
): IntentoEntrevistaIaParticipanteResponse {
  const interna = parsearTranscripcionInterna(intento.transcripcionOLog)
  const estado = derivarEstado(intento, interna)
  const finalizado = estado === "FINALIZADO"
  return {
    intentoId: intento.id,
    estado,
    fecha: intento.fecha.toISOString(),
    transcripcion: clonarTurnos(interna.turnos),
    notaGlobal: finalizado ? Number(intento.notaGlobal.toString()) : null,
    aprobado: finalizado ? intento.aprobado : null,
    anulado: intento.anulado,
    notasPorArea: notasPorAreaSerializadas(intento),
  }
}
