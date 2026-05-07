import { EmptyState } from "@/shared/ui/patterns/empty-state"
import { SectionCard } from "@/shared/ui/patterns/section-card"
import { Alert } from "@/shared/ui/primitives/alert"
import { Divider } from "@/shared/ui/primitives/divider"
import { Progress } from "@/shared/ui/primitives/progress"
import type { ProyectoTransversalDetalleAdmin } from "@nexott-learn/shared-types"
import { TrendingUp } from "lucide-react"
import { formatPeso } from "../lib/format"

interface TransversalCardProps {
  readonly activo: boolean
  readonly transversal: ProyectoTransversalDetalleAdmin | null | undefined
  readonly loading: boolean
  readonly error: Error | null
}

export function TransversalCard({ activo, transversal, loading, error }: TransversalCardProps) {
  if (!activo) {
    return (
      <SectionCard
        icon={TrendingUp}
        iconTone="amber"
        title="Proyecto Transversal"
        description="No configurado para este curso."
      >
        <EmptyState
          variant="inline"
          icon={TrendingUp}
          title="Sin proyecto transversal"
          description="Activa esta sección si el curso necesita un entregable integrador."
        />
      </SectionCard>
    )
  }

  if (loading) {
    return (
      <SectionCard icon={TrendingUp} iconTone="amber" title="Proyecto Transversal" loading={true} />
    )
  }

  if (error) {
    return (
      <SectionCard icon={TrendingUp} iconTone="amber" title="Proyecto Transversal">
        <Alert variant="error">
          <p className="font-semibold text-sm">No pudimos cargar el proyecto transversal</p>
          <p className="mt-1 text-sm text-text-secondary">{error.message}</p>
        </Alert>
      </SectionCard>
    )
  }

  if (!transversal) {
    return (
      <SectionCard icon={TrendingUp} iconTone="amber" title="Proyecto Transversal">
        <Alert variant="warning">
          <p className="font-semibold text-sm">Configuración pendiente</p>
          <p className="mt-1 text-sm text-text-secondary">
            El proyecto transversal está marcado como activo pero aún no tiene contenido.
          </p>
        </Alert>
      </SectionCard>
    )
  }

  const capas = [
    { label: "Análisis Objetivo", n: 1, valor: transversal.pesoCapa1 },
    { label: "IA Cualitativa", n: 2, valor: transversal.pesoCapa2 },
    { label: "Comprensión IA", n: 3, valor: transversal.pesoCapa3 },
  ]

  return (
    <SectionCard
      icon={TrendingUp}
      iconTone="amber"
      title={transversal.titulo}
      description="Proyecto Transversal del curso"
    >
      <p className="max-w-[70ch] text-sm text-text-secondary leading-relaxed">
        {transversal.enunciado}
      </p>

      <Divider />

      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-[11px] text-text-muted uppercase tracking-wider">
            Umbral de aprobación
          </span>
          <span className="text-sm text-text-secondary">Nota mínima para aprobar el proyecto</span>
        </div>
        <span className="font-bold text-text-primary text-xl tabular-nums">
          ≥ {transversal.umbralAprobacion}
        </span>
      </div>

      <Divider />

      <div className="flex flex-col gap-3">
        <p className="font-semibold text-[11px] text-text-muted uppercase tracking-wider">
          Ponderación por capa (suma 100%)
        </p>
        <div className="flex flex-col gap-2.5">
          {capas.map((capa) => (
            <div key={capa.n} className="flex items-center gap-3">
              <span className="w-7 shrink-0 font-semibold text-text-muted text-xs">C{capa.n}</span>
              <span className="min-w-0 flex-1 truncate font-medium text-sm text-text-primary">
                {capa.label}
              </span>
              <div className="w-28 shrink-0">
                <Progress value={capa.valor} max={100} size="sm" tone="brand" />
              </div>
              <span className="w-11 shrink-0 text-right font-semibold text-sm text-text-primary tabular-nums">
                {formatPeso(capa.valor)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  )
}
