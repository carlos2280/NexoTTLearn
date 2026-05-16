import { Card } from "@/shared/components/ui/card"
import type { UmbralesBrechas } from "@nexott-learn/shared-types"
import { Gauge } from "lucide-react"

interface BrechasUmbralesProps {
  readonly umbrales: UmbralesBrechas
}

interface UmbralFila {
  readonly etiqueta: string
  readonly descripcion: string
  readonly valor: number | null
}

export function BrechasUmbrales({ umbrales }: BrechasUmbralesProps) {
  const filas: readonly UmbralFila[] = [
    {
      etiqueta: "No cumple",
      descripcion: "Nota mínima absoluta",
      valor: umbrales.umbralNoCumple,
    },
    {
      etiqueta: "Cumple",
      descripcion: "Promedio de notas mínimas exigidas",
      valor: umbrales.umbralCumple,
    },
    {
      etiqueta: "Aprobado",
      descripcion: "Sólido (default 70)",
      valor: umbrales.umbralAprobado,
    },
    {
      etiqueta: "Excelencia",
      descripcion: "Cumbre (default 85)",
      valor: umbrales.umbralExcelencia,
    },
  ]

  return (
    <Card tono="plano" densidad="generosa" className="flex flex-col gap-5">
      <header className="flex items-start gap-3">
        <span
          aria-hidden={true}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-subtle text-text-secondary"
        >
          <Gauge className="h-[16px] w-[16px]" />
        </span>
        <div className="flex flex-col gap-0.5">
          <span className="nx-eyebrow text-text-tertiary">Configuración del curso</span>
          <h2 className="text-h3 text-text-primary">Umbrales aplicados</h2>
        </div>
      </header>

      <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {filas.map((f) => (
          <div key={f.etiqueta} className="flex flex-col gap-1">
            <dt className="nx-eyebrow text-text-tertiary">{f.etiqueta}</dt>
            <dd className="tabular font-medium font-mono text-h3 text-text-primary leading-none tracking-tight">
              {f.valor === null ? "—" : f.valor}
            </dd>
            <span className="text-caption text-text-tertiary">{f.descripcion}</span>
          </div>
        ))}
      </dl>
    </Card>
  )
}
