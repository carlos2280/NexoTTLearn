import { ChevronLeft } from "lucide-react"
import { Link } from "react-router-dom"

interface AvanceHeaderProps {
  readonly frescura?: string
}

function formatearFrescura(iso: string): string {
  const fecha = new Date(iso)
  return fecha.toLocaleString("es-ES", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function AvanceHeader({ frescura }: AvanceHeaderProps) {
  return (
    <header className="flex flex-col gap-4">
      <Link
        to="/admin/reportes"
        className="inline-flex w-fit items-center gap-1.5 text-body-sm text-text-tertiary transition-colors duration-base ease-default hover:text-text-secondary"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden={true} />
        Reportes
      </Link>

      <div className="flex flex-col gap-2">
        <span className="nx-eyebrow text-aurora-violet">Reporte operativo</span>
        <h1 className="text-h1 text-text-primary">
          Avance por curso<span className="text-aurora-violet">.</span>
        </h1>
        <p className="max-w-[720px] text-body text-text-secondary">
          Estado y porcentaje de progreso de cada asignación del curso. Detecta rezago temprano,
          identifica alertas operativas y consulta el histórico de cambios.
        </p>
      </div>

      {frescura && (
        <div className="flex items-center gap-1.5 text-caption text-text-tertiary">
          <span className="h-1.5 w-1.5 rounded-pill bg-success" aria-hidden={true} />
          Datos al {formatearFrescura(frescura)}
        </div>
      )}
    </header>
  )
}
