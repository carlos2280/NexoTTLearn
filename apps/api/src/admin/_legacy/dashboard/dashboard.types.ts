// Constantes y umbrales del calculo de la bandeja del admin.
// Centralizados aqui para que sean ajustables sin tocar la logica del service.

// Participante "en riesgo": sin actividad reciente o con deadline proximo.
// Las dos condiciones son OR (cualquiera dispara el riesgo).
export const RIESGO_DIAS_INACTIVIDAD = 7
export const RIESGO_DIAS_DEADLINE_CERCANO = 7

// Cuantos items de actividad reciente devolver en el feed.
export const ACTIVIDAD_LIMITE = 6

// Cuantos items de alertas devolver. Alertas = entregas pendientes,
// participantes en riesgo, sospechas IA, etc.
export const ALERTAS_LIMITE = 5

// Tendencia de KPIs: cuantos puntos retroactivos generar para el sparkline.
export const TENDENCIA_PUNTOS = 8

// Umbrales de variacion semana-a-semana para asignar trend up/down/neutral.
export const TREND_THRESHOLD = 0.001

// Rutas usadas en hrefs del response. Mantener sincronizado con
// apps/web/src/shared/constants/rutas.ts (no se importa porque viven
// en apps separados; el contrato es por convencion).
export const RUTAS_ADMIN = {
  cursos: "/admin/cursos",
  personas: "/admin/personas",
  seguimiento: "/admin/seguimiento",
  centroRevision: "/admin/centro-revision",
  centroRevisionTab: (tab: "entregas" | "proyectos") => `/admin/centro-revision?tab=${tab}`,
  diagnosticos: "/admin/diagnosticos",
} as const
