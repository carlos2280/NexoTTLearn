import type { TipoEventoNotif } from "@nexott-learn/shared-types"
import {
  AlertTriangle,
  Award,
  Bell,
  ClipboardList,
  Clock,
  FileSpreadsheet,
  type LucideIcon,
  RotateCcw,
  Sparkles,
} from "lucide-react"

interface CopyEvento {
  readonly texto: string
  readonly cta: string
  readonly icono: LucideIcon
  readonly tono: "neutro" | "marca" | "warmth" | "critico"
}

/**
 * Copy + icono + tono por `tipoEvento` (catálogo D88). El tono modula sólo el
 * acento del icono y el dot de estado: el texto en sí siempre va en
 * `text-text-primary` para no romper la lectura.
 */
const COPY_POR_TIPO: ReadonlyMap<TipoEventoNotif, CopyEvento> = new Map([
  [
    "ASIGNACION_CURSO",
    {
      texto: "Te asignaron un curso nuevo",
      cta: "Empezar",
      icono: Sparkles,
      tono: "marca",
    },
  ],
  [
    "PLAN_RECALCULADO",
    { texto: "Tu plan se recalculó", cta: "Ver plan", icono: ClipboardList, tono: "neutro" },
  ],
  [
    "TRANSVERSAL_DISPONIBLE",
    {
      texto: "Tu transversal está disponible",
      cta: "Entregar",
      icono: Sparkles,
      tono: "marca",
    },
  ],
  [
    "ENTREVISTA_IA_DISPONIBLE",
    {
      texto: "Entrevista IA disponible",
      cta: "Comenzar",
      icono: Sparkles,
      tono: "marca",
    },
  ],
  [
    "RECORDATORIO_DEADLINE",
    {
      texto: "Deadline cercano en un curso",
      cta: "Ver curso",
      icono: Clock,
      tono: "warmth",
    },
  ],
  [
    "CASO_REABIERTO",
    {
      texto: "Tu caso fue reabierto",
      cta: "Abrir",
      icono: RotateCcw,
      tono: "warmth",
    },
  ],
  [
    "RESULTADO_CIERRE",
    {
      texto: "Resultado de cierre disponible",
      cta: "Ver resultado",
      icono: Award,
      tono: "marca",
    },
  ],
  [
    "CURSO_DEADLINE",
    { texto: "Un curso se aproxima al deadline", cta: "Ver", icono: Clock, tono: "neutro" },
  ],
  [
    "COLABORADOR_LISTO",
    { texto: "Colaborador en estado LISTO", cta: "Ver", icono: Bell, tono: "neutro" },
  ],
  [
    "EXCEL_CARGADO",
    {
      texto: "Carga Excel procesada",
      cta: "Ver carga",
      icono: FileSpreadsheet,
      tono: "neutro",
    },
  ],
  [
    "MODULO_HUERFANO_SKILL",
    {
      texto: "Módulo con skill huérfana",
      cta: "Revisar",
      icono: AlertTriangle,
      tono: "critico",
    },
  ],
  [
    "PLANES_DESACTUALIZADOS",
    {
      texto: "Planes desactualizados detectados",
      cta: "Revisar",
      icono: AlertTriangle,
      tono: "warmth",
    },
  ],
  [
    "CENTRO_REVISION",
    {
      texto: "Hay items en centro de revisión",
      cta: "Ir al centro",
      icono: ClipboardList,
      tono: "neutro",
    },
  ],
])

const COPY_FALLBACK: CopyEvento = {
  texto: "Notificación disponible",
  cta: "Ver",
  icono: Bell,
  tono: "neutro",
}

export function obtenerCopyNotificacion(tipo: TipoEventoNotif): CopyEvento {
  return COPY_POR_TIPO.get(tipo) ?? COPY_FALLBACK
}

export type { CopyEvento }
