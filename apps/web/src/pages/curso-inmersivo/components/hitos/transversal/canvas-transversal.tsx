import { useListarIntentosTransversal } from "@/features/transversal/hooks/use-listar-intentos-transversal"
import { useTransversalCurso } from "@/features/transversal/hooks/use-transversal-curso"
import { AlertCircle, Loader2 } from "lucide-react"
import { useMemo, useState } from "react"
import { VistaBriefTransversal } from "./vista-brief-transversal"
import { VistaEvaluandoStub } from "./vista-evaluando-stub"

interface CanvasTransversalProps {
  readonly cursoId: string
  readonly asignacionId: string | null
}

/**
 * Orquestador del canvas del proyecto transversal (spec 05). En F1 cubre:
 *  - Vista 1 (brief + envio) cuando no hay intento previo activo.
 *  - Vista evaluando (stub) cuando ya existe un intento `EN_EVALUACION`.
 *
 * Vistas 3a/3b (aprobado / aun no) y polling completo llegan en F2.
 */
export function CanvasTransversal({ cursoId, asignacionId }: CanvasTransversalProps) {
  const transversal = useTransversalCurso(cursoId)
  const intentos = useListarIntentosTransversal(asignacionId)
  const [intentoIdRecienCreado, setIntentoIdRecienCreado] = useState<string | null>(null)

  const intentoEnEvaluacion = useMemo(() => {
    const lista = intentos.data ?? []
    if (intentoIdRecienCreado) {
      return lista.find((i) => i.intentoId === intentoIdRecienCreado) ?? null
    }
    return lista.find((i) => i.estado === "EN_EVALUACION") ?? null
  }, [intentos.data, intentoIdRecienCreado])

  if (transversal.isLoading || intentos.isLoading) {
    return (
      <main className="flex flex-1 items-center justify-center bg-canvas">
        <Loader2
          className="h-5 w-5 animate-spin text-text-tertiary"
          aria-label="Cargando proyecto transversal"
        />
      </main>
    )
  }

  if (transversal.error || !transversal.data) {
    return (
      <main className="flex flex-1 items-center justify-center bg-canvas px-6 py-10">
        <article className="flex max-w-md flex-col items-start gap-3">
          <span className="nx-eyebrow inline-flex items-center gap-2 text-text-tertiary">
            <AlertCircle className="h-3.5 w-3.5" aria-hidden={true} />
            Hito de cierre
          </span>
          <h2 className="text-h2 text-text-primary">No pudimos cargar el proyecto transversal.</h2>
          <p className="text-body-sm text-text-secondary">
            Reintenta en un momento. Si persiste, avisa al administrador del curso.
          </p>
        </article>
      </main>
    )
  }

  if (!asignacionId) {
    return (
      <main className="flex flex-1 items-center justify-center bg-canvas px-6 py-10">
        <article className="flex max-w-md flex-col items-start gap-3">
          <span className="nx-eyebrow text-text-tertiary">Hito de cierre</span>
          <h2 className="text-h2 text-text-primary">Proyecto transversal</h2>
          <p className="text-body-sm text-text-secondary">
            Necesitas estar inscrito en el curso para enviar tu proyecto.
          </p>
        </article>
      </main>
    )
  }

  return (
    <main className="flex flex-1 flex-col overflow-y-auto bg-canvas px-8 py-10">
      <div className="mx-auto flex w-full max-w-2xl flex-col">
        {intentoEnEvaluacion ? (
          <VistaEvaluandoStub intento={intentoEnEvaluacion} />
        ) : (
          <VistaBriefTransversal
            transversal={transversal.data}
            asignacionId={asignacionId}
            onIntentoCreado={setIntentoIdRecienCreado}
          />
        )}
      </div>
    </main>
  )
}
