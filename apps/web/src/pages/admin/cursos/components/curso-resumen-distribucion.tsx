import { Card } from "@/shared/components/ui/card"
import type { ResumenCursoKpis } from "../lib/resumen-curso.builder"

interface CursoResumenDistribucionProps {
  readonly kpis: ResumenCursoKpis
}

interface Tramo {
  readonly id: string
  readonly etiqueta: string
  readonly valor: number
  readonly clase: string
}

function porcentaje(valor: number, total: number): number {
  if (total === 0) {
    return 0
  }
  return Math.round((valor / total) * 100)
}

function construirTramos(kpis: ResumenCursoKpis): readonly Tramo[] {
  return [
    {
      id: "activos",
      etiqueta: "En curso",
      valor: kpis.activos,
      clase: "bg-accent",
    },
    {
      id: "listo",
      etiqueta: "LISTO",
      valor: kpis.listo,
      clase: "bg-warning",
    },
    {
      id: "aptos",
      etiqueta: "APTO / Completado",
      valor: kpis.aptos,
      clase: "bg-success",
    },
    {
      id: "no-aptos",
      etiqueta: "NO APTO",
      valor: kpis.noAptos,
      clase: "bg-danger",
    },
    {
      id: "retirados",
      etiqueta: "Retirado",
      valor: kpis.retirados,
      clase: "bg-border-strong",
    },
  ]
}

export function CursoResumenDistribucion({ kpis }: CursoResumenDistribucionProps) {
  const total = kpis.total
  const tramos = construirTramos(kpis).filter((t) => t.valor > 0)

  return (
    <Card tono="plano" className="flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <h3 className="text-h3 text-text-primary">Distribución por estado</h3>
        <span className="tabular text-caption text-text-tertiary">{total} asignación(es)</span>
      </header>

      {total === 0 ? (
        <p className="text-body-sm text-text-tertiary">Aún no hay asignaciones en este curso.</p>
      ) : (
        <>
          <div
            className="flex h-2 w-full overflow-hidden rounded-pill bg-subtle"
            role="presentation"
          >
            {tramos.map((t) => (
              <div
                key={t.id}
                className={t.clase}
                style={{ width: `${porcentaje(t.valor, total)}%` }}
                title={`${t.etiqueta}: ${t.valor}`}
              />
            ))}
          </div>

          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {tramos.map((t) => (
              <li key={t.id} className="flex items-center gap-2 text-body-sm">
                <span
                  className={`inline-block h-2 w-2 shrink-0 rounded-pill ${t.clase}`}
                  aria-hidden={true}
                />
                <span className="flex-1 text-text-primary">{t.etiqueta}</span>
                <span className="tabular text-text-tertiary">
                  {t.valor} · {porcentaje(t.valor, total)}%
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  )
}
