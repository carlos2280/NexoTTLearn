import {
  IntentoEntrevistaIaAdminResponse,
  IntentoEntrevistaIaParticipanteResponse,
  TurnoEntrevistaIa,
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
 * Determina el estado externo del intento a partir de las columnas relacionales
 * + el estado interno persistido en `transcripcionOLog`. D-EMERG-P8c-3.
 */
export function derivarEstado(
  intento: Pick<IntentoEntrevistaSeleccionado, "anulado" | "notasPorArea">,
  interna: TranscripcionInterna,
): "EN_PROGRESO" | "FINALIZADO" | "ANULADO" {
  if (intento.anulado) {
    return "ANULADO"
  }
  if (interna.estado === "FINALIZADO" || intento.notasPorArea.length > 0) {
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
