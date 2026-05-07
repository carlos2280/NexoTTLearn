import {
  InspectorPanel,
  InspectorRow,
  InspectorSection,
} from "@/shared/ui/patterns/immersive/inspector"
import { Button } from "@/shared/ui/primitives/button"
import type { CursoDetalle } from "@nexott-learn/shared-types"
import { CalendarDays, Sparkles } from "lucide-react"
import type { ReactNode } from "react"

interface InspectorCursoProps {
  readonly curso: CursoDetalle
  readonly onPublish: () => void
}

export function InspectorCurso({ curso, onPublish }: InspectorCursoProps) {
  const fechas = formatFechas(curso.fechaInicio, curso.deadline)
  return (
    <InspectorPanel
      eyebrow="Curso"
      title={curso.titulo}
      subtitle={
        <span>
          Para <span className="text-text-primary">{curso.empresaCliente}</span>
        </span>
      }
    >
      <InspectorSection title="Identidad">
        <InspectorRow label="Cliente">
          <ReadOnlyValue>{curso.empresaCliente}</ReadOnlyValue>
        </InspectorRow>
        <InspectorRow label="Título">
          <ReadOnlyValue>{curso.titulo}</ReadOnlyValue>
        </InspectorRow>
        {curso.descripcion ? (
          <InspectorRow label="Descripción">
            <p className="rounded-[var(--radius-sm)] bg-glass-1 px-3 py-2 text-sm text-text-secondary leading-relaxed">
              {curso.descripcion}
            </p>
          </InspectorRow>
        ) : null}
      </InspectorSection>

      <InspectorSection title="Fechas">
        <InspectorRow label="Inicio · Deadline">
          <ReadOnlyValue>
            <CalendarDays className="size-3.5 text-text-muted" strokeWidth={1.5} />
            <span>{fechas}</span>
          </ReadOnlyValue>
        </InspectorRow>
      </InspectorSection>

      <InspectorSection title="Pesos del curso" defaultOpen={false}>
        <PesoBar label="Áreas" value={curso.pesoAreas} />
        <PesoBar label="Proyecto Transversal" value={curso.pesoProyectoTransversal} />
        <PesoBar label="Entrevista IA" value={curso.pesoEntrevistaIA} />
        <p className="text-[11px] text-text-muted">
          Suma{" "}
          {(curso.pesoAreas + curso.pesoProyectoTransversal + curso.pesoEntrevistaIA).toFixed(0)}%
        </p>
      </InspectorSection>

      <InspectorSection title="Umbrales de logro" defaultOpen={false}>
        <UmbralRow label="Excelencia" value={curso.umbralExcelencia} accent="var(--success)" />
        <UmbralRow label="Aprobado" value={curso.umbralAprobado} accent="var(--info)" />
        <UmbralRow label="En desarrollo" value={curso.umbralEnDesarrollo} accent="var(--warning)" />
      </InspectorSection>

      {curso.estado === "BORRADOR" ? (
        <div className="-mx-1 mt-2 rounded-[var(--radius-md)] bg-[var(--gradient-brand-soft)] p-3">
          <p className="mb-2 flex items-center gap-1.5 font-medium text-text-primary text-xs">
            <Sparkles className="size-3.5 text-brand-violet-soft" strokeWidth={1.8} />
            Listo cuando completes el checklist
          </p>
          <Button size="sm" full={true} onClick={onPublish}>
            Publicar curso
          </Button>
        </div>
      ) : null}
    </InspectorPanel>
  )
}

function ReadOnlyValue({ children }: { readonly children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-glass-border bg-glass-1 px-3 py-2 text-sm text-text-primary">
      {children}
    </div>
  )
}

function PesoBar({ label, value }: { readonly label: string; readonly value: number }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-text-secondary">{label}</span>
        <span className="font-mono text-text-primary">{value.toFixed(0)}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-glass-2">
        <div
          className="h-full rounded-full bg-[var(--gradient-brand)]"
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  )
}

function UmbralRow({
  label,
  value,
  accent,
}: {
  readonly label: string
  readonly value: number
  readonly accent: string
}) {
  return (
    <div className="flex items-center justify-between rounded-[var(--radius-sm)] border border-glass-border bg-glass-1 px-3 py-2 text-sm">
      <span className="flex items-center gap-2 text-text-secondary">
        <span aria-hidden="true" className="size-2 rounded-full" style={{ background: accent }} />
        {label}
      </span>
      <span className="font-mono text-text-primary">{value}</span>
    </div>
  )
}

function formatFechas(inicio: string | null, deadline: string | null): string {
  if (!(inicio || deadline)) {
    return "Sin fechas definidas"
  }
  const fmt = (d: string | null) =>
    d
      ? new Date(d).toLocaleDateString("es-CL", {
          day: "numeric",
          month: "short",
          year: "2-digit",
        })
      : "—"
  return `${fmt(inicio)} → ${fmt(deadline)}`
}
