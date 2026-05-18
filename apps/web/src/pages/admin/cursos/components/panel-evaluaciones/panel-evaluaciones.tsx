import { Tabs } from "@/shared/components/ui/tabs"
import { useState } from "react"
import { TabOtrosProximamente } from "./tab-otros-proximamente"
import { TablaIntentosEntrevistaIa } from "./tabla-intentos-entrevista-ia"
import { TablaIntentosTransversal } from "./tabla-intentos-transversal"

type SubtabEvaluacion = "entrevista-ia" | "transversal" | "otros"

const SUBTABS: readonly { readonly id: SubtabEvaluacion; readonly etiqueta: string }[] = [
  { id: "entrevista-ia", etiqueta: "Entrevista IA" },
  { id: "transversal", etiqueta: "Transversal" },
  { id: "otros", etiqueta: "Otros (próximamente)" },
]

interface PanelEvaluacionesProps {
  readonly cursoId: string
}

/**
 * Panel del tab "Evaluaciones" en la pantalla admin del curso. Reune las
 * tablas de intentos por tipo bajo subtabs. Cada tabla mantiene sus propios
 * filtros y paginacion independientes del resto.
 */
export function PanelEvaluaciones({ cursoId }: PanelEvaluacionesProps) {
  const [sub, setSub] = useState<SubtabEvaluacion>("entrevista-ia")
  return (
    <div className="flex flex-col gap-6">
      <Tabs<SubtabEvaluacion>
        items={SUBTABS}
        activa={sub}
        onCambiar={setSub}
        etiquetaAria="Tipo de evaluación"
      />
      <section role="tabpanel" aria-label={SUBTABS.find((s) => s.id === sub)?.etiqueta}>
        {sub === "entrevista-ia" ? <TablaIntentosEntrevistaIa cursoId={cursoId} /> : null}
        {sub === "transversal" ? <TablaIntentosTransversal cursoId={cursoId} /> : null}
        {sub === "otros" ? <TabOtrosProximamente /> : null}
      </section>
    </div>
  )
}
