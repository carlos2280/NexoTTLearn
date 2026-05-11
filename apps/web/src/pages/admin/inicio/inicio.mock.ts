import { BookOpen, CalendarClock, ShieldAlert, Users } from "lucide-react"
import type { CasoRevision, CursoEnMarcha, EventoPulso, KpiPulso } from "./inicio.types"

export const MOCK_KPIS: readonly KpiPulso[] = [
  {
    id: "cursos-activos",
    etiqueta: "Cursos activos",
    valor: 14,
    delta: 2,
    tono: "acento",
    icono: BookOpen,
    serie: [9, 10, 10, 11, 12, 12, 13, 14],
    nota: "2 publicados esta semana",
  },
  {
    id: "personas-asignadas",
    etiqueta: "Personas asignadas",
    valor: 187,
    delta: 12,
    tono: "success",
    icono: Users,
    serie: [142, 148, 156, 162, 170, 175, 180, 187],
    nota: "+12 desde el lunes",
  },
  {
    id: "casos-pendientes",
    etiqueta: "Casos pendientes",
    valor: 6,
    delta: -3,
    tono: "warning",
    icono: CalendarClock,
    serie: [11, 10, 9, 9, 8, 8, 7, 6],
    nota: "3 cerrados ayer",
  },
  {
    id: "alertas-sistema",
    etiqueta: "Alertas de sistema",
    valor: 0,
    delta: 0,
    tono: "success",
    icono: ShieldAlert,
    serie: [2, 1, 1, 0, 1, 0, 0, 0],
    nota: "Todo en verde",
  },
]

export const MOCK_CASOS: readonly CasoRevision[] = [
  {
    id: "caso-1",
    titulo: "Curso «Salesforce Sales Cloud — BBVA» listo para publicar",
    contexto: "8 módulos · 12 evaluaciones · transversal cubierto al 92%",
    prioridad: "urgente",
    slaRestante: "vence en 6 h",
    responsable: "Diana M.",
  },
  {
    id: "caso-2",
    titulo: "Excel inicial pendiente de aplicar — Cohorte Mayo",
    contexto: "23 colaboradores · preview generado hace 18 min",
    prioridad: "alta",
    slaRestante: "vence mañana",
    responsable: "Marco A.",
  },
  {
    id: "caso-3",
    titulo: "Revisión de entrevista IA — Lucía Vega (FullStack Java)",
    contexto: "Veredicto preliminar: APTO · 4 evidencias contradictorias",
    prioridad: "alta",
    slaRestante: "vence en 2 días",
    responsable: "Tú",
  },
  {
    id: "caso-4",
    titulo: "Cliente «Mapfre» pidió ajustar umbrales del curso «Angular 17»",
    contexto: "Umbral aprobado 65 → 70 · impacto: 4 personas",
    prioridad: "normal",
    slaRestante: "sin SLA",
    responsable: "Equipo Catálogo",
  },
]

export const MOCK_CURSOS: readonly CursoEnMarcha[] = [
  {
    id: "curso-1",
    titulo: "Salesforce Sales Cloud — BBVA",
    cliente: "BBVA",
    avance: 72,
    participantes: 18,
    responsables: ["Diana M.", "Pablo R.", "Helena S."],
    proximoHito: "Módulo 6 — Workflows · cierra el 14 may",
  },
  {
    id: "curso-2",
    titulo: "FullStack Java 21 — Onboarding",
    cliente: "Mapfre",
    avance: 41,
    participantes: 24,
    responsables: ["Marco A.", "Lucía V."],
    proximoHito: "Evaluación capa servicio · 12 may",
  },
  {
    id: "curso-3",
    titulo: "Angular 17 + Signals",
    cliente: "Telefónica",
    avance: 88,
    participantes: 9,
    responsables: ["Helena S.", "Diana M."],
    proximoHito: "Entrevista final · 16 may",
  },
]

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
