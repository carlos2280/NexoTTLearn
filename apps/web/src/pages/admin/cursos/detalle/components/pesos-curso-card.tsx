import { Badge } from "@/shared/ui/patterns/badge"
import { SectionCard } from "@/shared/ui/patterns/section-card"
import { Progress } from "@/shared/ui/primitives/progress"
import type { CursoDetalle } from "@nexott-learn/shared-types"
import { BarChart3, Layers } from "lucide-react"
import { formatPeso } from "../lib/format"

interface PesoFila {
  readonly label: string
  readonly valor: number
  readonly activa: boolean
}

function PesoRow({ fila }: { readonly fila: PesoFila }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex w-44 shrink-0 items-center gap-2">
        <span
          className={
            fila.activa
              ? "font-medium text-sm text-text-primary"
              : "font-medium text-sm text-text-muted"
          }
        >
          {fila.label}
        </span>
        {fila.activa ? null : (
          <Badge tone="neutral" size="sm">
            Inactivo
          </Badge>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <Progress
          value={fila.valor}
          max={100}
          size="sm"
          tone={fila.activa ? "brand" : "muted"}
          label={fila.label}
        />
      </div>
      <span className="w-12 shrink-0 text-right font-semibold text-sm text-text-primary tabular-nums">
        {formatPeso(fila.valor)}
      </span>
    </div>
  )
}

function SumaTotal({ valor, ok }: { readonly valor: number; readonly ok: boolean }) {
  return (
    <div className="flex items-center justify-end gap-2 pt-1">
      <span className="text-sm text-text-secondary">Suma total</span>
      <Badge tone={ok ? "success" : "warning"} size="sm">
        {formatPeso(valor)}
      </Badge>
    </div>
  )
}

export function PesosCursoCard({ curso }: { readonly curso: CursoDetalle }) {
  const filas: readonly PesoFila[] = [
    { label: "Áreas", valor: curso.pesoAreas, activa: true },
    {
      label: "Proyecto Transversal",
      valor: curso.pesoProyectoTransversal,
      activa: curso.proyectoTransversal.activo,
    },
    {
      label: "Entrevista Final IA",
      valor: curso.pesoEntrevistaIA,
      activa: curso.entrevistaIAConfig.activa,
    },
  ]
  const suma = filas.reduce((acc, f) => acc + f.valor, 0)
  const ok = Math.abs(suma - 100) < 0.01

  return (
    <SectionCard
      icon={BarChart3}
      iconTone="violet"
      title="Pesos a nivel curso"
      description="Cómo combinan áreas, proyecto y entrevista en la nota final."
    >
      <div className="flex flex-col gap-3">
        {filas.map((fila) => (
          <PesoRow key={fila.label} fila={fila} />
        ))}
        <SumaTotal valor={suma} ok={ok} />
      </div>
    </SectionCard>
  )
}

export function PesosIntraModuloCard({ curso }: { readonly curso: CursoDetalle }) {
  const filas: readonly PesoFila[] = [
    { label: "Actividades (bloques)", valor: curso.pesoActividades, activa: true },
    { label: "Mini proyecto", valor: curso.pesoMiniProyecto, activa: true },
  ]
  const suma = curso.pesoActividades + curso.pesoMiniProyecto
  const ok = Math.abs(suma - 100) < 0.01

  return (
    <SectionCard
      icon={Layers}
      iconTone="emerald"
      title="Pesos intra-módulo"
      description="Cómo se combina dentro de cada módulo (actividades + mini proyecto)."
    >
      <div className="flex flex-col gap-3">
        {filas.map((fila) => (
          <PesoRow key={fila.label} fila={fila} />
        ))}
        <SumaTotal valor={suma} ok={ok} />
      </div>
    </SectionCard>
  )
}
