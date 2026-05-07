// Constantes del dashboard admin (P1 · bandeja v2).
//
// Centralizadas aqui para que los tests las puedan importar sin duplicar.

export const RIESGO_DIAS_INACTIVIDAD = 14
export const RIESGO_DIAS_DEADLINE_CERCANO = 7
export const TENDENCIA_PUNTOS = 7
export const ALERTAS_LIMITE = 5
export const ACTIVIDAD_LIMITE = 10

export const RUTAS_ADMIN = {
  cursos: "/admin/cursos",
  participantes: "/admin/participantes",
  seguimiento: "/admin/seguimiento",
  diagnosticos: "/admin/diagnostico",
  centroRevision: "/admin/centro-revision",
  centroRevisionTab: (tab: "entregas" | "proyectos" | "alertas") =>
    `/admin/centro-revision?tab=${tab}`,
} as const
