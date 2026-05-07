import { Badge } from "@/shared/ui/patterns/badge"
import { Skeleton } from "@/shared/ui/patterns/skeleton"
import { Button } from "@/shared/ui/primitives/button"
import { Card } from "@/shared/ui/primitives/card"
import type { CursoListItem, KpisCursoActual } from "@nexott-learn/shared-types"
import { AlertTriangle, ArrowRight, Clock, Users } from "lucide-react"
import { diasHastaDeadline } from "../lib/ordenar-cursos-hub"

interface TarjetaCursoSeguimientoProps {
  readonly curso: CursoListItem
  readonly kpis: KpisCursoActual | null
  readonly isLoadingKpis: boolean
  readonly onAbrir: (cursoId: string) => void
}

export function TarjetaCursoSeguimiento({
  curso,
  kpis,
  isLoadingKpis,
  onAbrir,
}: TarjetaCursoSeguimientoProps) {
  const dias = diasHastaDeadline(curso.deadline)

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex flex-col gap-1">
        <span className="text-text-muted text-xs uppercase tracking-wider">
          {curso.empresaCliente}
        </span>
        <h3 className="font-semibold text-base text-text-primary tracking-tight">{curso.titulo}</h3>
      </div>

      <DeadlineLine dias={dias} />

      <div className="flex flex-col gap-2 text-sm">
        <RiesgoLine kpis={kpis} isLoading={isLoadingKpis} />
        <span className="flex items-center gap-1.5 text-text-secondary">
          <Users className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
          <strong className="font-medium text-text-primary">
            {curso.contadores.inscripcionesActivas}
          </strong>
          {curso.contadores.inscripcionesActivas === 1 ? "candidato" : "candidatos"}
        </span>
        {kpis ? (
          <span className="text-text-muted text-xs">
            Cumplimiento: {Math.round(kpis.cumplimientoPct)}%
          </span>
        ) : null}
      </div>

      <div className="mt-auto flex items-center justify-end gap-3">
        <Button size="sm" variant="ghost" onClick={() => onAbrir(curso.id)}>
          Abrir matriz
          <ArrowRight className="size-4" strokeWidth={2} aria-hidden="true" />
        </Button>
      </div>
    </Card>
  )
}

interface DeadlineLineProps {
  readonly dias: number | null
}

function DeadlineLine({ dias }: DeadlineLineProps) {
  if (dias === null) {
    return <p className="text-text-muted text-xs">Sin deadline definido</p>
  }
  const urgente = dias < 14
  const Icon = urgente ? AlertTriangle : Clock
  const tone = urgente ? "text-warning" : "text-text-secondary"
  return (
    <p className={`flex items-center gap-1.5 text-xs ${tone}`}>
      <Icon className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
      Deadline en {dias} día{dias === 1 ? "" : "s"}
    </p>
  )
}

interface RiesgoLineProps {
  readonly kpis: KpisCursoActual | null
  readonly isLoading: boolean
}

function RiesgoLine({ kpis, isLoading }: RiesgoLineProps) {
  if (isLoading) {
    return <Skeleton className="h-5 w-32" />
  }
  if (!kpis) {
    return <span className="text-text-muted text-xs">Sin datos de progreso</span>
  }
  if (kpis.enRiesgo === 0) {
    return (
      <Badge tone="success" size="sm">
        0 en riesgo
      </Badge>
    )
  }
  return (
    <Badge tone="danger" size="sm" dot={true}>
      {kpis.enRiesgo} en riesgo
    </Badge>
  )
}
