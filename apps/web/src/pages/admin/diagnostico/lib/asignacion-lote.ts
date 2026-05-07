import type {
  CandidatoAsignacion,
  ConfirmarLoteItem,
  TipoAsignacion,
} from "@nexott-learn/shared-types"
import type { ResumenConfirmacion } from "../components/modal-confirmar-asignacion"
import type { BorradorPorInscripcion } from "./use-borrador-asignaciones"

// Helpers puros para el tab "Asignacion": derivan items para POST confirmar-lote
// y el resumen cuantitativo del modal a partir del borrador local.

export function construirItemsLote(borrador: BorradorPorInscripcion): ConfirmarLoteItem[] {
  const items: ConfirmarLoteItem[] = []
  for (const [inscripcionId, sub] of borrador) {
    const asignaciones = Array.from(sub, ([moduloId, tipo]) => ({ moduloId, tipo }))
    items.push({ inscripcionId, asignaciones })
  }
  return items
}

interface ConstruirResumenArgs {
  readonly candidatos: readonly CandidatoAsignacion[]
  readonly borrador: BorradorPorInscripcion
}

interface ResumenMutable {
  candidatos: number
  conAsignacion: number
  sinAsignacion: number
  sinEvaluacion: number
  obligatorios: number
  recomendados: number
  opcionales: number
}

export function construirResumen({
  candidatos,
  borrador,
}: ConstruirResumenArgs): ResumenConfirmacion {
  const r: ResumenMutable = {
    candidatos: candidatos.length,
    conAsignacion: 0,
    sinAsignacion: 0,
    sinEvaluacion: 0,
    obligatorios: 0,
    recomendados: 0,
    opcionales: 0,
  }
  for (const c of candidatos) {
    if (!c.tieneEvaluacion) {
      r.sinEvaluacion += 1
    }
    const sub = borrador.get(c.inscripcionId)
    const cuantos = sub?.size ?? 0
    if (cuantos > 0) {
      r.conAsignacion += 1
    } else {
      r.sinAsignacion += 1
    }
    if (sub) {
      for (const tipo of sub.values()) {
        sumar(r, tipo)
      }
    }
  }
  return r
}

function sumar(r: ResumenMutable, tipo: TipoAsignacion): void {
  if (tipo === "OBLIGATORIO") {
    r.obligatorios += 1
  } else if (tipo === "RECOMENDADO") {
    r.recomendados += 1
  } else {
    r.opcionales += 1
  }
}
