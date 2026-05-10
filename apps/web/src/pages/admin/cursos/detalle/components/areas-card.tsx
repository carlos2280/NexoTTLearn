import { Badge } from "@/shared/ui/patterns/badge"
import { EmptyState } from "@/shared/ui/patterns/empty-state"
import { SectionCard } from "@/shared/ui/patterns/section-card"
import { Progress } from "@/shared/ui/primitives/progress"
import type { CursoAreaDetalle } from "@nexott-learn/shared-types"
import { Layers } from "lucide-react"
import { formatPeso, formatPuntaje } from "../lib/format"

interface AreasCardProps {
  readonly areas: readonly CursoAreaDetalle[]
}

export function AreasCard({ areas }: AreasCardProps) {
  const sumaPesos = areas.reduce((acc, a) => acc + a.peso, 0)
  const pesosOk = Math.abs(sumaPesos - 100) < 0.01

  if (areas.length === 0) {
    return (
      <SectionCard
        icon={Layers}
        iconTone="indigo"
        title="Áreas del curso"
        description="Aún no hay áreas configuradas. Agrega al menos una para poder publicar."
      >
        <EmptyState
          variant="inline"
          icon={Layers}
          title="Sin áreas"
          description="Configura las áreas que pesan en este perfil de cliente."
        />
      </SectionCard>
    )
  }

  const ordenadas = [...areas].sort((a, b) => a.orden - b.orden)
  const sumaBadge = (
    <Badge tone={pesosOk ? "success" : "warning"} size="sm">
      {pesosOk ? "Suma 100%" : `Suma ${formatPeso(sumaPesos)}`}
    </Badge>
  )

  return (
    <SectionCard icon={Layers} iconTone="indigo" title="Áreas del curso" actions={sumaBadge}>
      <p className="-mt-2 text-sm text-text-secondary">
        {areas.length} área{areas.length === 1 ? "" : "s"} · pesos a nivel curso
      </p>
      <div className="flex flex-col gap-4">
        {ordenadas.map((cursoArea) => (
          <AreaRow key={cursoArea.id} cursoArea={cursoArea} />
        ))}
      </div>
    </SectionCard>
  )
}

function AreaRow({ cursoArea }: { readonly cursoArea: CursoAreaDetalle }) {
  const { area, peso, puntajeObjetivo, modulosCount } = cursoArea
  const dotColor = area.color || "var(--brand-violet)"
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="size-2.5 shrink-0 rounded-full"
          style={{ background: dotColor }}
        />
        <p className="min-w-0 flex-1 truncate font-semibold text-sm text-text-primary">
          {area.nombre}
        </p>
        <Badge tone="neutral" size="sm">
          {modulosCount} mód{modulosCount === 1 ? "" : "s"}
        </Badge>
        <Badge tone="info" size="sm">
          {formatPuntaje(puntajeObjetivo)}
        </Badge>
        <span className="w-12 text-right font-semibold text-sm text-text-primary tabular-nums">
          {formatPeso(peso)}
        </span>
      </div>
      <Progress value={peso} max={100} size="sm" tone="brand" label={`Peso de ${area.nombre}`} />
    </div>
  )
}
