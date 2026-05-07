import { SectionCard } from "@/shared/ui/patterns/section-card"
import type { CursoDetalle } from "@nexott-learn/shared-types"
import { CheckCircle2 } from "lucide-react"

interface UmbralesCardProps {
  readonly curso: CursoDetalle
}

interface UmbralFila {
  readonly etiqueta: string
  readonly rango: string
  readonly tone: string
  readonly accentClass: string
}

// Convención: enDesarrollo < aprobado < excelencia (estricto).
export function UmbralesCard({ curso }: UmbralesCardProps) {
  const filas: readonly UmbralFila[] = [
    {
      etiqueta: "Insuficiente",
      rango: `< ${curso.umbralEnDesarrollo}`,
      tone: "No cumple",
      accentClass: "bg-danger",
    },
    {
      etiqueta: "En desarrollo",
      rango: `${curso.umbralEnDesarrollo} – ${curso.umbralAprobado - 1}`,
      tone: "Necesita refuerzo",
      accentClass: "bg-warning",
    },
    {
      etiqueta: "Aprobado",
      rango: `${curso.umbralAprobado} – ${curso.umbralExcelencia - 1}`,
      tone: "Cumple objetivos",
      accentClass: "bg-info",
    },
    {
      etiqueta: "Excelencia",
      rango: `≥ ${curso.umbralExcelencia}`,
      tone: "Logro destacado",
      accentClass: "bg-success",
    },
  ]

  return (
    <SectionCard
      icon={CheckCircle2}
      iconTone="emerald"
      title="Umbrales de logro"
      description="Etiquetas que se asignan a la nota final del curso (escala 0–100)."
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {filas.map((fila) => (
          <UmbralBox key={fila.etiqueta} fila={fila} />
        ))}
      </div>
    </SectionCard>
  )
}

function UmbralBox({ fila }: { readonly fila: UmbralFila }) {
  return (
    <div className="relative overflow-hidden rounded-[var(--radius-lg)] border border-glass-border bg-glass-1 p-4">
      <span aria-hidden="true" className={`absolute inset-x-0 top-0 h-0.5 ${fila.accentClass}`} />
      <p className="font-semibold text-[11px] text-text-muted uppercase tracking-wider">
        {fila.etiqueta}
      </p>
      <p className="mt-1.5 font-bold text-text-primary text-xl tabular-nums">{fila.rango}</p>
      <p className="mt-1 text-sm text-text-secondary">{fila.tone}</p>
    </div>
  )
}
