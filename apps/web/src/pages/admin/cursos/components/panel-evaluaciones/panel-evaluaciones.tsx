import { useEvaluacionesDisponibles } from "@/features/cursos/hooks/use-evaluaciones-disponibles"
import { EmptyState } from "@/shared/components/ui/empty-state"
import { Tabs } from "@/shared/components/ui/tabs"
import type { EvaluacionesDisponibles } from "@nexott-learn/shared-types"
import { ClipboardList } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { TablaIntentosEntrevistaIa } from "./tabla-intentos-entrevista-ia"
import { TablaIntentosTransversal } from "./tabla-intentos-transversal"

type SubtabEvaluacion = "entrevista-ia" | "transversal" | "bloques"

interface SubtabDisponible {
  readonly id: SubtabEvaluacion
  readonly etiqueta: string
}

function calcularSubtabs(d: EvaluacionesDisponibles): readonly SubtabDisponible[] {
  const lista: SubtabDisponible[] = []
  if (d.tieneEntrevistaIa) lista.push({ id: "entrevista-ia", etiqueta: "Entrevista IA" })
  if (d.tieneTransversal) lista.push({ id: "transversal", etiqueta: "Transversal" })
  if (d.tieneBloquesEvaluables) lista.push({ id: "bloques", etiqueta: "Bloques" })
  return lista
}

interface PanelEvaluacionesProps {
  readonly cursoId: string
}

/**
 * Panel del tab "Evaluaciones" en la pantalla admin del curso. Renderiza solo
 * los subtabs cuyas modalidades estan configuradas en el curso (Entrevista IA,
 * Transversal, Bloques evaluables). Si no hay ninguna, muestra empty state.
 * Si hay solo una, no muestra subtabs y renderiza la tabla directamente con
 * un eyebrow de la modalidad.
 */
export function PanelEvaluaciones({ cursoId }: PanelEvaluacionesProps) {
  const { data, isLoading } = useEvaluacionesDisponibles(cursoId)
  const subtabs = useMemo(() => (data ? calcularSubtabs(data) : []), [data])
  const [sub, setSub] = useState<SubtabEvaluacion | null>(null)

  // Sincroniza el subtab activo con la lista disponible: si la activa deja de
  // estar (porque cambia la configuracion del curso) cae al primero.
  useEffect(() => {
    if (subtabs.length === 0) {
      setSub(null)
      return
    }
    if (!sub || !subtabs.some((s) => s.id === sub)) {
      setSub(subtabs[0]?.id ?? null)
    }
  }, [subtabs, sub])

  if (isLoading || !data) {
    return <div className="min-h-[200px]" aria-busy={true} />
  }

  if (subtabs.length === 0) {
    return (
      <EmptyState
        tono="panel"
        icono={ClipboardList}
        titulo="Sin evaluaciones configuradas"
        descripcion="Este curso no tiene Entrevista IA, proyecto Transversal ni bloques evaluables. Configurarlas desde la pestaña Configuración."
      />
    )
  }

  if (subtabs.length === 1) {
    const unica = subtabs[0]
    if (!unica) return null
    return (
      <div className="flex flex-col gap-6">
        <span className="nx-eyebrow text-aurora-violet">{unica.etiqueta}</span>
        <section role="tabpanel" aria-label={unica.etiqueta}>
          <ContenidoSubtab subtab={unica.id} cursoId={cursoId} />
        </section>
      </div>
    )
  }

  const actual = sub ?? subtabs[0]?.id ?? null
  if (!actual) return null

  return (
    <div className="flex flex-col gap-6">
      <Tabs<SubtabEvaluacion>
        items={subtabs}
        activa={actual}
        onCambiar={setSub}
        etiquetaAria="Tipo de evaluación"
      />
      <section role="tabpanel" aria-label={subtabs.find((s) => s.id === actual)?.etiqueta}>
        <ContenidoSubtab subtab={actual} cursoId={cursoId} />
      </section>
    </div>
  )
}

interface ContenidoSubtabProps {
  readonly subtab: SubtabEvaluacion
  readonly cursoId: string
}

function ContenidoSubtab({ subtab, cursoId }: ContenidoSubtabProps) {
  if (subtab === "entrevista-ia") {
    return <TablaIntentosEntrevistaIa cursoId={cursoId} />
  }
  if (subtab === "transversal") {
    return <TablaIntentosTransversal cursoId={cursoId} />
  }
  // Bloques evaluables: tabla pendiente en la Fase 2.
  return (
    <EmptyState
      tono="panel"
      icono={ClipboardList}
      titulo="Vista en construcción"
      descripcion="La tabla de bloques evaluables llega en la próxima iteración."
    />
  )
}
