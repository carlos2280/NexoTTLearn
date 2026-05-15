import { Card } from "@/shared/components/ui/card"
import { ArrowUpRight } from "lucide-react"
import { Link } from "react-router-dom"
import type { ReporteDefinicion } from "../reportes.types"

interface ReporteCardProps {
  readonly reporte: ReporteDefinicion
}

export function ReporteCard({ reporte }: ReporteCardProps) {
  const { slug, titulo, descripcion, icono: Icono, exportable, disponible } = reporte

  const contenido = (
    <>
      <header className="flex items-start justify-between gap-4">
        <span
          aria-hidden={true}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-subtle text-text-secondary transition-colors duration-base ease-default group-hover:border-accent/30 group-hover:bg-accent-soft group-hover:text-accent"
        >
          <Icono className="h-[18px] w-[18px]" />
        </span>
        {disponible ? (
          <ArrowUpRight
            className="h-4 w-4 text-text-tertiary opacity-0 transition-opacity duration-base ease-default group-hover:opacity-100"
            aria-hidden={true}
          />
        ) : (
          <span className="text-eyebrow text-text-tertiary">Próximamente</span>
        )}
      </header>

      <div className="flex flex-col gap-1.5">
        <h3 className="text-h3 text-text-primary">{titulo}</h3>
        <p className="text-body-sm text-text-secondary">{descripcion}</p>
      </div>

      {exportable && (
        <footer className="mt-auto flex items-center gap-2 pt-2">
          <span className="text-eyebrow text-text-tertiary">Exporta</span>
          <span className="tabular font-mono text-caption text-text-tertiary">
            CSV · XLSX · PDF
          </span>
        </footer>
      )}
    </>
  )

  if (!disponible) {
    return (
      <Card
        tono="plano"
        densidad="generosa"
        aria-disabled={true}
        className="group relative flex h-full flex-col gap-4"
      >
        {contenido}
      </Card>
    )
  }

  return (
    <Card
      asChild={true}
      tono="elevado"
      densidad="generosa"
      interactiva={true}
      className="group relative flex h-full flex-col gap-4"
    >
      <Link to={`/admin/reportes/${slug}`}>{contenido}</Link>
    </Card>
  )
}
