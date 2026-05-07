import {
  useActualizarCursoArea,
  useEliminarCursoArea,
} from "@/features/admin-cursos/hooks/use-curso-areas"
import {
  InspectorPanel,
  InspectorRow,
  InspectorSection,
} from "@/shared/ui/patterns/immersive/inspector"
import { Button } from "@/shared/ui/primitives/button"
import type { CursoDetalle } from "@nexott-learn/shared-types"
import { Trash2 } from "lucide-react"
import { useState } from "react"
import { useDebouncedSave } from "../hooks/use-debounced-save"
import { InspectorStub } from "../inspector/inspector-stub"
import { useEditorStore } from "../use-editor-store"

interface InspectorAreaProps {
  readonly curso: CursoDetalle
  readonly cursoAreaId: string
}

export function InspectorArea({ curso, cursoAreaId }: InspectorAreaProps) {
  const cursoArea = curso.cursoAreas.find((a) => a.id === cursoAreaId)
  if (!cursoArea) {
    return <InspectorStub eyebrow="Área" title="Área no encontrada" description="" />
  }
  return <InspectorAreaCargada curso={curso} cursoArea={cursoArea} />
}

interface CargadaProps {
  readonly curso: CursoDetalle
  readonly cursoArea: NonNullable<ReturnType<CursoDetalle["cursoAreas"]["find"]>>
}

function InspectorAreaCargada({ curso, cursoArea }: CargadaProps) {
  const actualizar = useActualizarCursoArea(curso.id)
  const eliminar = useEliminarCursoArea(curso.id)
  const setSelected = useEditorStore((s) => s.setSelected)

  const [peso, setPeso] = useState(String(cursoArea.peso))
  const [umbral, setUmbral] = useState(String(cursoArea.puntajeObjetivo))

  useDebouncedSave(peso, (v) => {
    const n = Number.parseFloat(v)
    if (!Number.isFinite(n) || n < 0 || n > 100 || n === cursoArea.peso) {
      return
    }
    actualizar.mutate({ cursoAreaId: cursoArea.id, input: { peso: n } })
  })
  useDebouncedSave(umbral, (v) => {
    const n = Number.parseInt(v, 10)
    if (!Number.isFinite(n) || n < 0 || n > 100 || n === cursoArea.puntajeObjetivo) {
      return
    }
    actualizar.mutate({ cursoAreaId: cursoArea.id, input: { puntajeObjetivo: n } })
  })

  const sumaPesos = curso.cursoAreas.reduce((acc, a) => acc + a.peso, 0)
  const sumaOk = Math.abs(sumaPesos - 100) < 0.01

  const handleEliminar = () => {
    if (cursoArea.modulosCount > 0) {
      window.alert(
        "Esta área tiene módulos asignados. Reasigna o elimina los módulos antes de quitarla.",
      )
      return
    }
    if (!window.confirm(`¿Quitar el área "${cursoArea.area.nombre}" de este curso?`)) {
      return
    }
    eliminar.mutate(cursoArea.id, { onSuccess: () => setSelected({ tipo: "curso" }) })
  }

  return (
    <InspectorPanel
      eyebrow="Área del curso"
      title={cursoArea.area.nombre}
      subtitle={<span>{cursoArea.modulosCount} módulos · catálogo global</span>}
    >
      <InspectorSection title="Configuración en este curso">
        <InspectorRow
          label="Peso (% del curso)"
          hint={sumaOk ? "Suma actual: 100% ✓" : `Suma actual: ${sumaPesos.toFixed(2)}%`}
        >
          <input
            type="number"
            min={0}
            max={100}
            step={0.01}
            value={peso}
            onChange={(e) => setPeso(e.target.value)}
            className="rounded-[var(--radius-sm)] border border-glass-border bg-glass-1 px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-violet"
          />
        </InspectorRow>
        <InspectorRow label="Puntaje objetivo (0–100)">
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

      <InspectorSection title="Catálogo global" defaultOpen={false}>
        <InspectorRow label="Color">
          <span className="flex items-center gap-2 text-sm text-text-secondary">
            <span
              aria-hidden="true"
              className="size-3 rounded-full"
              style={{ background: cursoArea.area.color }}
            />
            {cursoArea.area.color}
          </span>
        </InspectorRow>
      </InspectorSection>

      <InspectorSection title="Acciones" defaultOpen={false}>
        <Button
          variant="ghost"
          size="sm"
          full={true}
          onClick={handleEliminar}
          disabled={eliminar.isPending}
        >
          <Trash2 className="size-3.5 text-danger" />
          <span className="text-danger">Quitar área del curso</span>
        </Button>
      </InspectorSection>
    </InspectorPanel>
  )
}
