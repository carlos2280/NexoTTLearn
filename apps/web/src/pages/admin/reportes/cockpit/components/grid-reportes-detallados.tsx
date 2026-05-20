import { RUTAS } from "@/shared/constants/rutas"
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  BarChart3,
  Building2,
  Layers,
  type LucideIcon,
  Radar,
  Recycle,
  UserCircle2,
} from "lucide-react"
import { Link } from "react-router-dom"

interface ItemReporteDetallado {
  readonly slug: string
  readonly to: string
  readonly titulo: string
  readonly descripcion: string
  readonly icono: LucideIcon
  readonly grupo: "operativo" | "estrategico"
}

const ITEMS: readonly ItemReporteDetallado[] = [
  {
    slug: "cobertura-curso",
    to: `${RUTAS.admin.reportes}/cobertura-curso`,
    titulo: "Cobertura por curso",
    descripcion: "Drill-down: radar dual y matriz colaborador × skill para un curso concreto.",
    icono: Radar,
    grupo: "operativo",
  },
  {
    slug: "avance-curso",
    to: `${RUTAS.admin.reportes}/avance-curso`,
    titulo: "Avance por curso",
    descripcion: "Estado y % de cada asignación. Detección temprana de rezago.",
    icono: BarChart3,
    grupo: "operativo",
  },
  {
    slug: "detalle-colaborador",
    to: `${RUTAS.admin.reportes}/detalle-colaborador`,
    titulo: "Detalle de colaborador",
    descripcion: "Ficha 360°: últimos intentos, skills y alertas activas.",
    icono: UserCircle2,
    grupo: "operativo",
  },
  {
    slug: "brechas-detectadas",
    to: `${RUTAS.admin.reportes}/brechas-detectadas`,
    titulo: "Brechas detectadas",
    descripcion: "Skills exigidas vs. disponibles agregadas por curso.",
    icono: AlertCircle,
    grupo: "operativo",
  },
  {
    slug: "eficacia-plataforma",
    to: `${RUTAS.admin.reportes}/eficacia-plataforma`,
    titulo: "Eficacia de la plataforma",
    descripcion: "Aptos, presentados, aceptados y correlación apto↔éxito.",
    icono: Activity,
    grupo: "estrategico",
  },
  {
    slug: "historico-cliente",
    to: `${RUTAS.admin.reportes}/historico-cliente`,
    titulo: "Histórico por cliente",
    descripcion: "Aceptación a lo largo del tiempo por cliente.",
    icono: Building2,
    grupo: "estrategico",
  },
  {
    slug: "inventario-skills",
    to: `${RUTAS.admin.reportes}/inventario-skills`,
    titulo: "Inventario de skills",
    descripcion: "Mapa cualitativo del talento por skill y etiqueta.",
    icono: Layers,
    grupo: "estrategico",
  },
  {
    slug: "reutilizacion-catalogo",
    to: `${RUTAS.admin.reportes}/reutilizacion-catalogo`,
    titulo: "Reutilización del catálogo",
    descripcion: "Módulos y skills más reusados entre cursos.",
    icono: Recycle,
    grupo: "estrategico",
  },
]

export function GridReportesDetallados() {
  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <span className="nx-eyebrow text-text-tertiary">Reportes detallados</span>
        <h2 className="text-h3 text-text-primary">Profundiza cuando lo necesites</h2>
        <p className="max-w-[640px] text-body-sm text-text-secondary">
          Lecturas específicas con filtros, histórico y exportación. El cockpit de arriba ya resume
          el estado del sistema; estos reportes son para análisis profundo.
        </p>
      </header>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ITEMS.map((item) => {
          const Icono = item.icono
          return (
            <li key={item.slug}>
              <Link
                to={item.to}
                className="group flex h-full items-start gap-3 rounded-xl border border-border bg-surface p-4 transition-[border-color,box-shadow] duration-base ease-default hover:border-border-strong hover:shadow-sm"
              >
                <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-subtle text-text-secondary group-hover:text-aurora-violet">
                  <Icono className="h-4 w-4" aria-hidden={true} />
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-body-sm text-text-primary">
                      {item.titulo}
                    </span>
                    <ArrowUpRight
                      className="h-3.5 w-3.5 shrink-0 text-text-tertiary transition-colors duration-fast group-hover:text-aurora-violet"
                      aria-hidden={true}
                    />
                  </div>
                  <p className="mt-0.5 text-caption text-text-tertiary">{item.descripcion}</p>
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
