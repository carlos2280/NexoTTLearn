import { RUTAS } from "@/shared/constants/rutas"
import { ChevronLeft } from "lucide-react"
import { Link } from "react-router-dom"
import { SeccionCoberturaCurso } from "../cockpit/components/seccion-cobertura-curso"

/**
 * Drill-down de cobertura por curso. Llega aquí cuando un ejecutivo, viendo la
 * vista global por área, quiere bajar al detalle de un curso concreto:
 * matriz colaborador × skill y radar dual (target del curso vs cohorte o
 * individual).
 */
export function CoberturaCursoPage() {
  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-8">
      <Link
        to={RUTAS.admin.reportes}
        className="inline-flex items-center gap-1 self-start text-caption text-text-secondary transition-colors duration-fast hover:text-aurora-violet"
      >
        <ChevronLeft className="h-3.5 w-3.5" aria-hidden={true} />
        Volver al cockpit
      </Link>

      <header className="flex flex-col gap-2">
        <span className="nx-eyebrow text-aurora-violet">Reportes · Drill-down</span>
        <h1 className="text-h1 text-text-primary">
          Cobertura por curso<span className="text-aurora-violet">.</span>
        </h1>
        <p className="max-w-[640px] text-body-sm text-text-secondary">
          Detalle de un curso concreto: skills exigidas, radar de cobertura y matriz colaborador ×
          skill. Llega aquí cuando ya sabes qué área investigar.
        </p>
      </header>

      <SeccionCoberturaCurso />
    </div>
  )
}
