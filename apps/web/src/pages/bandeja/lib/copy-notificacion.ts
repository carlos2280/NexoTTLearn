import type { TipoEventoNotif } from "@nexott-learn/shared-types"

interface CopyEvento {
  readonly texto: string
  readonly cta: "Abrir" | "Ver"
}

/**
 * Copy de UI por `tipoEvento` (catálogo D88). Para PR 2 mantenemos un texto
 * genérico por tipo; cuando llegue el payload completo en el detalle podremos
 * inyectar título de curso/sección.
 */
const COPY_POR_TIPO: ReadonlyMap<TipoEventoNotif, CopyEvento> = new Map([
  ["ASIGNACION_CURSO", { texto: "Te asignaron un curso nuevo", cta: "Abrir" }],
  ["PLAN_RECALCULADO", { texto: "Tu plan se recalculó", cta: "Ver" }],
  ["TRANSVERSAL_DISPONIBLE", { texto: "Transversal disponible", cta: "Abrir" }],
  ["ENTREVISTA_IA_DISPONIBLE", { texto: "Entrevista IA disponible", cta: "Abrir" }],
  ["RECORDATORIO_DEADLINE", { texto: "Recordatorio: deadline cercano", cta: "Ver" }],
  ["CASO_REABIERTO", { texto: "Tu caso fue reabierto", cta: "Abrir" }],
  ["RESULTADO_CIERRE", { texto: "Resultado de cierre disponible", cta: "Ver" }],
  ["CURSO_DEADLINE", { texto: "Un curso se aproxima al deadline", cta: "Ver" }],
  ["COLABORADOR_LISTO", { texto: "Colaborador en estado LISTO", cta: "Ver" }],
  ["EXCEL_CARGADO", { texto: "Carga Excel procesada", cta: "Ver" }],
  ["MODULO_HUERFANO_SKILL", { texto: "Módulo con skill huérfana", cta: "Ver" }],
  ["PLANES_DESACTUALIZADOS", { texto: "Planes desactualizados detectados", cta: "Ver" }],
  ["CENTRO_REVISION", { texto: "Hay items en centro de revisión", cta: "Ver" }],
])

const COPY_FALLBACK: CopyEvento = { texto: "Notificación disponible", cta: "Ver" }

export function obtenerCopyNotificacion(tipo: TipoEventoNotif): CopyEvento {
  return COPY_POR_TIPO.get(tipo) ?? COPY_FALLBACK
}
