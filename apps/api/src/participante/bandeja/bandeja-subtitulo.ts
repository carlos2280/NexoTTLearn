// §4.1.1 · subtitulo contextual del hero.
//
// Fase 0: implementa las prioridades que dependen solo de la inscripcion
// (1, 3, 5, 6, 7). Las prioridades 2 (urgentes) y 4 (hito desbloqueado) se
// resuelven en Fase 1-2 cuando exista el calculo de pendientes y el flujo
// de hitos.

import type { BandejaEstado } from "@nexott-learn/shared-types"

export interface SubtituloInputs {
  readonly cursosActivos: number
  readonly cursosRecienAsignados: number
  readonly pendientesTotal: number
}

export function calcularSubtitulo(inputs: SubtituloInputs): {
  texto: string
  estado: BandejaEstado
} {
  const { cursosActivos, cursosRecienAsignados, pendientesTotal } = inputs

  if (cursosActivos === 0) {
    return { texto: "Aun no tienes cursos asignados", estado: "VACIO" }
  }

  if (cursosRecienAsignados >= 1) {
    const plural = cursosRecienAsignados === 1 ? "curso nuevo" : "cursos nuevos"
    return {
      texto: `Te asignaron ${cursosRecienAsignados} ${plural}`,
      estado: "ASIGNADO_NO_INICIADO",
    }
  }

  if (pendientesTotal >= 1) {
    const plural = pendientesTotal === 1 ? "actividad pendiente" : "actividades pendientes"
    return {
      texto: `Tienes ${pendientesTotal} ${plural}`,
      estado: "EN_CURSO",
    }
  }

  return { texto: "Vas al dia — sigue asi", estado: "AL_DIA" }
}
