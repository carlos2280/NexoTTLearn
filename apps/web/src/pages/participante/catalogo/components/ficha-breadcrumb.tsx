import { RUTAS } from "@/shared/constants/rutas"
import { ChevronLeft } from "lucide-react"
import { Link } from "react-router-dom"

interface FichaBreadcrumbProps {
  readonly tituloCurso: string
}

// §1 ficha-curso-libre.md · mini-header 40px con ← Catalogo.
export function FichaBreadcrumb({ tituloCurso }: FichaBreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[13px]">
      <Link
        to={RUTAS.participante.catalogo}
        className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-text-secondary hover:bg-surface-2 hover:text-text-primary"
      >
        <ChevronLeft aria-hidden="true" strokeWidth={1.75} className="size-4" />
        Catalogo
      </Link>
      <span aria-hidden="true" className="text-text-muted">
        ·
      </span>
      <span className="truncate text-text-muted">{tituloCurso}</span>
    </nav>
  )
}
