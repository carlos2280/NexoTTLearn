import type { LucideIcon } from "lucide-react"
import {
  Activity,
  AlertCircle,
  BarChart3,
  Building2,
  Inbox,
  Layers,
  Recycle,
  UserCircle2,
} from "lucide-react"

export type ReporteSlug =
  | "avance-curso"
  | "detalle-colaborador"
  | "brechas-detectadas"
  | "centro-revision"
  | "eficacia-plataforma"
  | "historico-cliente"
  | "inventario-skills"
  | "reutilizacion-catalogo"

export type ReporteSeccion = "operativos" | "estrategicos"

export interface ReporteDefinicion {
  readonly slug: ReporteSlug
  readonly seccion: ReporteSeccion
  readonly titulo: string
  readonly descripcion: string
  readonly icono: LucideIcon
  readonly exportable: boolean
  readonly disponible: boolean
}

export const REPORTES: readonly ReporteDefinicion[] = [
  {
    slug: "avance-curso",
    seccion: "operativos",
    titulo: "Avance por curso",
    descripcion:
      "Estado y porcentaje de progreso de cada asignación. Detecta rezago temprano y permite priorizar intervención.",
    icono: BarChart3,
    exportable: false,
    disponible: true,
  },
  {
    slug: "detalle-colaborador",
    seccion: "operativos",
    titulo: "Detalle de colaborador",
    descripcion:
      "Ficha 360°: últimos intentos, skills adquiridas, alertas de inactividad e intentos invalidados.",
    icono: UserCircle2,
    exportable: false,
    disponible: true,
  },
  {
    slug: "brechas-detectadas",
    seccion: "operativos",
    titulo: "Brechas detectadas",
    descripcion:
      "Skills exigidas por el cliente vs. skills disponibles en la plantilla. Visualiza los gaps que bloquean presentación.",
    icono: AlertCircle,
    exportable: false,
    disponible: true,
  },
  {
    slug: "centro-revision",
    seccion: "operativos",
    titulo: "Centro de revisión",
    descripcion:
      "Cola priorizada de lo que necesita atención: intentos transversales, evaluaciones IA y ajustes de plan.",
    icono: Inbox,
    exportable: false,
    disponible: false,
  },
  {
    slug: "eficacia-plataforma",
    seccion: "estrategicos",
    titulo: "Eficacia de la plataforma",
    descripcion:
      "Presentados al cliente, aptos que pasaron y correlación apto↔éxito. Mide si el sistema predice bien.",
    icono: Activity,
    exportable: true,
    disponible: true,
  },
  {
    slug: "historico-cliente",
    seccion: "estrategicos",
    titulo: "Histórico por cliente",
    descripcion:
      "Cursos preparados para un cliente, presentados, aceptados y porcentaje de aceptación a lo largo del tiempo.",
    icono: Building2,
    exportable: true,
    disponible: true,
  },
  {
    slug: "inventario-skills",
    seccion: "estrategicos",
    titulo: "Inventario de skills",
    descripcion:
      "Mapa cualitativo del talento: skills por etiqueta (excelencia / sólido / en desarrollo / no cumple).",
    icono: Layers,
    exportable: true,
    disponible: true,
  },
  {
    slug: "reutilizacion-catalogo",
    seccion: "estrategicos",
    titulo: "Reutilización del catálogo",
    descripcion:
      "Módulos y skills más reusados entre cursos. Diagnostica eficiencia del catálogo y oportunidades de consolidación.",
    icono: Recycle,
    exportable: true,
    disponible: true,
  },
] as const
