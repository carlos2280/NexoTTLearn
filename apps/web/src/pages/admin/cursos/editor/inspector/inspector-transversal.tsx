import {
  useAjustarPesosProyectoTransversal,
  useAjustarUmbralProyectoTransversal,
  useProyectoTransversal,
} from "@/features/admin-cursos/hooks/use-proyecto-transversal"
import {
  InspectorPanel,
  InspectorRow,
  InspectorSection,
} from "@/shared/ui/patterns/immersive/inspector"
import type { CursoDetalle, ProyectoTransversalDetalleAdmin } from "@nexott-learn/shared-types"
import { useState } from "react"
import { useDebouncedSave } from "../hooks/use-debounced-save"
import { InspectorStub } from "./inspector-stub"

interface InspectorTransversalProps {
  readonly curso: CursoDetalle
  readonly cursoId: string
}

export function InspectorTransversal({ curso, cursoId }: InspectorTransversalProps) {
  const query = useProyectoTransversal(cursoId)

  if (query.isLoading) {
    return <InspectorStub eyebrow="Hito" title="Proyecto Transversal" description="Cargando…" />
  }

  if (query.data === null || query.data === undefined) {
    return (
      <InspectorStub
        eyebrow="Hito"
        title="Proyecto Transversal"
        description="Inactivo. Activa el proyecto desde el canvas para configurar enunciado y rúbrica."
      />
    )
  }

  return <InspectorTransversalCargado curso={curso} cursoId={cursoId} pt={query.data} />
}

interface CargadoProps {
  readonly curso: CursoDetalle
  readonly cursoId: string
  readonly pt: ProyectoTransversalDetalleAdmin
}

function InspectorTransversalCargado({ curso, cursoId, pt }: CargadoProps) {
  const ajustarUmbral = useAjustarUmbralProyectoTransversal(cursoId)
  const ajustarPesos = useAjustarPesosProyectoTransversal(cursoId)

  const [umbral, setUmbral] = useState(String(pt.umbralAprobacion))
  const [peso1, setPeso1] = useState(String(pt.pesoCapa1))
  const [peso2, setPeso2] = useState(String(pt.pesoCapa2))
  const [peso3, setPeso3] = useState(String(pt.pesoCapa3))

  useDebouncedSave(umbral, (v) => {
    const n = Number.parseInt(v, 10)
    if (Number.isFinite(n) && n >= 0 && n <= 100 && n !== pt.umbralAprobacion) {
      ajustarUmbral.mutate({ umbralAprobacion: n })
    }
  })

  const sumaPesos = Number(peso1) + Number(peso2) + Number(peso3)
  const sumaOk = Math.abs(sumaPesos - 100) <= 0.01

  const savePesos = () => {
    const p1 = Number.parseFloat(peso1)
    const p2 = Number.parseFloat(peso2)
    const p3 = Number.parseFloat(peso3)
    if (!Number.isFinite(p1 + p2 + p3)) {
      return
    }
    if (Math.abs(p1 + p2 + p3 - 100) > 0.01) {
      return
    }
    if (p1 === pt.pesoCapa1 && p2 === pt.pesoCapa2 && p3 === pt.pesoCapa3) {
      return
    }
    ajustarPesos.mutate({ pesoCapa1: p1, pesoCapa2: p2, pesoCapa3: p3 })
  }

  return (
    <InspectorPanel
      eyebrow="Hito"
      title="Proyecto Transversal"
      subtitle={<span>Activo · {curso.pesoProyectoTransversal}% del curso</span>}
    >
      <InspectorSection title="Evaluación">
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
      </InspectorSection>

      <InspectorSection title="Pesos por capa (deben sumar 100%)" defaultOpen={false}>
        <InspectorRow label="Capa 1">
          <input
            type="number"
            min={0}
            max={100}
            step={0.01}
            value={peso1}
            onChange={(e) => setPeso1(e.target.value)}
            onBlur={savePesos}
            className="rounded-[var(--radius-sm)] border border-glass-border bg-glass-1 px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-violet"
          />
        </InspectorRow>
        <InspectorRow label="Capa 2">
          <input
            type="number"
            min={0}
            max={100}
            step={0.01}
            value={peso2}
            onChange={(e) => setPeso2(e.target.value)}
            onBlur={savePesos}
            className="rounded-[var(--radius-sm)] border border-glass-border bg-glass-1 px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-violet"
          />
        </InspectorRow>
        <InspectorRow
          label="Capa 3"
          hint={sumaOk ? "Suma: 100% ✓" : `Suma: ${sumaPesos.toFixed(2)}%`}
        >
          <input
            type="number"
            min={0}
            max={100}
            step={0.01}
            value={peso3}
            onChange={(e) => setPeso3(e.target.value)}
            onBlur={savePesos}
            className="rounded-[var(--radius-sm)] border border-glass-border bg-glass-1 px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-violet"
          />
        </InspectorRow>
      </InspectorSection>
    </InspectorPanel>
  )
}
