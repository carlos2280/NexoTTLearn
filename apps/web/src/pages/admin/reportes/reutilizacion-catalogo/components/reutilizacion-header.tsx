import { ChevronLeft } from "lucide-react"
import { Link } from "react-router-dom"

interface ReutilizacionHeaderProps {
  readonly frescura?: string
  readonly scopeHash?: string
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

export function ReutilizacionHeader({ frescura, scopeHash }: ReutilizacionHeaderProps) {
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
        <span className="nx-eyebrow text-aurora-violet">Reporte estratégico</span>
        <h1 className="text-h1 text-text-primary">
          Reutilización del catálogo<span className="text-aurora-violet">.</span>
        </h1>
        <p className="max-w-[720px] text-body text-text-secondary">
          Identifica módulos didácticos y skills exigidas que se reutilizan entre cursos. Mide la
          eficiencia del catálogo y descubre oportunidades de consolidación.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-caption text-text-tertiary">
        {frescura && (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-pill bg-success" aria-hidden={true} />
            Datos al {formatearFrescura(frescura)}
          </span>
        )}
        {scopeHash && (
          <span className="tabular font-mono">
            scope <span className="text-text-secondary">#{scopeHash.slice(0, 8)}</span>
          </span>
        )}
        <span className="ml-auto inline-flex items-center gap-2">
          <span className="nx-eyebrow text-text-tertiary">Exporta</span>
          <span className="tabular font-mono text-caption text-text-tertiary">
            CSV · XLSX · PDF
          </span>
        </span>
      </div>
    </header>
  )
}
