import type { InscripcionDiagnosticoItem } from "@nexott-learn/shared-types"

// Adapta el listado real de inscripciones al formato que consume el calculador
// de progreso (que aun comparte estructura con el mock). Se eliminara cuando
// progreso.ts acepte directamente InscripcionDiagnosticoItem.
export function mapMockInscripciones(reales: readonly InscripcionDiagnosticoItem[]) {
  return reales.map((r) => ({
    inscripcionId: r.inscripcionId,
    participante: { ...r.participante, ultimoLoginAt: r.participante.ultimoLoginAt ?? undefined },
    estadoInvitado: r.estadoInvitado,
    invitadaAt: r.invitadaAt,
    evaluacion: r.evaluacion,
    asignacion: r.asignacion,
  }))
}
