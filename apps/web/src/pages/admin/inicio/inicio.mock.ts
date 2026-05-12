import type { EventoPulso } from "./inicio.types"

export const MOCK_PULSO: readonly EventoPulso[] = [
  {
    id: "ev-1",
    tipo: "publicacion",
    actor: "Diana M.",
    accion: "publicó",
    objeto: "el curso «Angular 17 + Signals»",
    hace: "hace 12 min",
  },
  {
    id: "ev-2",
    tipo: "matricula",
    actor: "Sistema",
    accion: "matriculó",
    objeto: "a 23 colaboradores en «FullStack Java 21»",
    hace: "hace 38 min",
  },
  {
    id: "ev-3",
    tipo: "evaluacion",
    actor: "Lucía V.",
    accion: "cerró la evaluación inicial de",
    objeto: "«FullStack Java 21 — Cohorte Mayo»",
    hace: "hace 1 h 12 min",
  },
  {
    id: "ev-4",
    tipo: "sistema",
    actor: "Sistema",
    accion: "completó el rebalanceo de skills de",
    objeto: "187 colaboradores",
    hace: "hace 2 h",
  },
  {
    id: "ev-5",
    tipo: "alerta",
    actor: "Sistema",
    accion: "detectó",
    objeto: "0 incidencias en los últimos 6 h",
    hace: "hace 3 h",
  },
]
