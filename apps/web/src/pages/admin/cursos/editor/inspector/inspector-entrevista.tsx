import {
  useActualizarEntrevistaIa,
  useEntrevistaIa,
} from "@/features/admin-cursos/hooks/use-entrevista-ia"
import {
  InspectorPanel,
  InspectorRow,
  InspectorSection,
} from "@/shared/ui/patterns/immersive/inspector"
import type { CursoDetalle, EntrevistaIADetalleAdmin } from "@nexott-learn/shared-types"
import { useState } from "react"
import { useDebouncedSave } from "../hooks/use-debounced-save"
import { InspectorStub } from "./inspector-stub"

interface InspectorEntrevistaProps {
  readonly curso: CursoDetalle
  readonly cursoId: string
}

export function InspectorEntrevista({ curso, cursoId }: InspectorEntrevistaProps) {
  const query = useEntrevistaIa(cursoId)

  if (query.isLoading) {
    return <InspectorStub eyebrow="Hito" title="Entrevista IA" description="Cargando…" />
  }

  if (query.data === null || query.data === undefined) {
    return (
      <InspectorStub
        eyebrow="Hito"
        title="Entrevista IA"
        description="Inactiva. Activa la entrevista desde el canvas para configurar perfil y rúbrica."
      />
    )
  }

  return <InspectorEntrevistaCargada curso={curso} cursoId={cursoId} ei={query.data} />
}

interface CargadaProps {
  readonly curso: CursoDetalle
  readonly cursoId: string
  readonly ei: EntrevistaIADetalleAdmin
}

function InspectorEntrevistaCargada({ curso, cursoId, ei }: CargadaProps) {
  const actualizar = useActualizarEntrevistaIa(cursoId)

  const [umbral, setUmbral] = useState(String(ei.umbralAprobacion))
  const [preguntas, setPreguntas] = useState(String(ei.numeroPreguntas))
  const [intentos, setIntentos] = useState(String(ei.maxIntentos))

  useDebouncedSave(umbral, (v) => {
    const n = Number.parseInt(v, 10)
    if (Number.isFinite(n) && n >= 0 && n <= 100 && n !== ei.umbralAprobacion) {
      actualizar.mutate({ umbralAprobacion: n })
    }
  })
  useDebouncedSave(preguntas, (v) => {
    const n = Number.parseInt(v, 10)
    if (Number.isFinite(n) && n >= 1 && n <= 50 && n !== ei.numeroPreguntas) {
      actualizar.mutate({ numeroPreguntas: n })
    }
  })
  useDebouncedSave(intentos, (v) => {
    const n = Number.parseInt(v, 10)
    if (Number.isFinite(n) && n >= 1 && n <= 20 && n !== ei.maxIntentos) {
      actualizar.mutate({ maxIntentos: n })
    }
  })

  return (
    <InspectorPanel
      eyebrow="Hito"
      title="Entrevista IA"
      subtitle={<span>Activa · {curso.pesoEntrevistaIA}% del curso</span>}
    >
      <InspectorSection title="Configuración">
        <InspectorRow label="Modo">
          <div className="flex gap-2">
            {(["TEXTO", "VOZ"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  if (m !== ei.modo) {
                    actualizar.mutate({ modo: m })
                  }
                }}
                className={`rounded-[var(--radius-sm)] border px-3 py-1.5 text-xs transition-colors ${
                  ei.modo === m
                    ? "border-brand-violet bg-brand-violet/10 text-brand-violet"
                    : "border-glass-border bg-glass-1 text-text-secondary hover:border-brand-violet/40"
                }`}
              >
                {m === "TEXTO" ? "Texto" : "Voz"}
              </button>
            ))}
          </div>
        </InspectorRow>
        <InspectorRow label="Nº preguntas">
          <input
            type="number"
            min={1}
            max={50}
            value={preguntas}
            onChange={(e) => setPreguntas(e.target.value)}
            className="rounded-[var(--radius-sm)] border border-glass-border bg-glass-1 px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-violet"
          />
        </InspectorRow>
        <InspectorRow label="Umbral aprobación (%)">
          <input
            type="number"
            min={0}
            max={100}
            step={1}
            value={umbral}
            onChange={(e) => setUmbral(e.target.value)}
            className="rounded-[var(--radius-sm)] border border-glass-border bg-glass-1 px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-violet"
          />
        </InspectorRow>
        <InspectorRow label="Máx. intentos">
          <input
            type="number"
            min={1}
            max={20}
            value={intentos}
            onChange={(e) => setIntentos(e.target.value)}
            className="rounded-[var(--radius-sm)] border border-glass-border bg-glass-1 px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-violet"
          />
        </InspectorRow>
      </InspectorSection>

      <InspectorSection title="Información" defaultOpen={false}>
        <InspectorRow label="Peso en curso">
          <span className="text-sm text-text-secondary">{curso.pesoEntrevistaIA}%</span>
        </InspectorRow>
      </InspectorSection>
    </InspectorPanel>
  )
}
