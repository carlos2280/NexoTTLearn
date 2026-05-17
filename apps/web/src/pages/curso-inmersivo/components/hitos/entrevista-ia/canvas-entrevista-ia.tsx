import { useDisponibilidadEntrevistaIa } from "@/features/entrevista-ia/hooks/use-disponibilidad-entrevista-ia"
import { useEntrevistaIaCurso } from "@/features/entrevista-ia/hooks/use-entrevista-ia-curso"
import { AlertCircle, Loader2 } from "lucide-react"
import { VistaBloqueadaEntrevistaIa } from "./vista-bloqueada-entrevista-ia"
import { VistaBriefEntrevistaIa } from "./vista-brief-entrevista-ia"

interface CanvasEntrevistaIaProps {
  readonly cursoId: string
  readonly asignacionId: string | null
}

/**
 * Orquestador del canvas de la Entrevista IA (spec 06). En F1 cubre:
 *  - Vista 1 (brief) cuando la entrevista esta disponible.
 *  - Vista 5 (bloqueada) con microcopy fijo por razon.
 *
 * Vistas 2 (chat), 3a/3b (resultado) y 4 (drawer releer) llegan en F2/F3.
 * CTA "Empezar entrevista" hoy es no-op en F1; se cableara con el flujo
 * real de creacion de intento en F2.
 */
export function CanvasEntrevistaIa({ cursoId, asignacionId }: CanvasEntrevistaIaProps) {
  const entrevista = useEntrevistaIaCurso(cursoId)
  const disponibilidad = useDisponibilidadEntrevistaIa(asignacionId)

  if (entrevista.isLoading || disponibilidad.isLoading) {
    return (
      <main className="flex flex-1 items-center justify-center bg-canvas">
        <Loader2
          className="h-5 w-5 animate-spin text-text-tertiary"
          aria-label="Cargando entrevista IA"
        />
      </main>
    )
  }

  if (entrevista.error || !entrevista.data || disponibilidad.error || !disponibilidad.data) {
    return <ErrorCanvas />
  }

  if (!asignacionId) {
    return <SinAsignacion />
  }

  return (
    <main className="flex flex-1 flex-col overflow-y-auto bg-canvas px-8 py-10">
      <div className="mx-auto flex w-full max-w-2xl flex-col">
        {disponibilidad.data.disponible ? (
          <VistaBriefEntrevistaIa
            entrevista={entrevista.data}
            disponibilidad={disponibilidad.data}
            onEmpezar={() => {
              // F2: aqui llamamos POST /asignaciones/:id/intentos-entrevista-ia
              // y conmutamos a la vista 2 (chat).
            }}
          />
        ) : (
          <VistaBloqueadaEntrevistaIa disponibilidad={disponibilidad.data} />
        )}
      </div>
    </main>
  )
}

function ErrorCanvas() {
  return (
    <main className="flex flex-1 items-center justify-center bg-canvas px-6 py-10">
      <article className="flex max-w-md flex-col items-start gap-3">
        <span className="nx-eyebrow inline-flex items-center gap-2 text-text-tertiary">
          <AlertCircle className="h-3.5 w-3.5" aria-hidden={true} />
          Hito de cierre
        </span>
        <h2 className="text-h2 text-text-primary">No pudimos cargar la entrevista IA.</h2>
        <p className="text-body-sm text-text-secondary">
          Reintenta en un momento. Si persiste, avisa al administrador del curso.
        </p>
      </article>
    </main>
  )
}

function SinAsignacion() {
  return (
    <main className="flex flex-1 items-center justify-center bg-canvas px-6 py-10">
      <article className="flex max-w-md flex-col items-start gap-3">
        <span className="nx-eyebrow text-text-tertiary">Hito de cierre</span>
        <h2 className="text-h2 text-text-primary">Entrevista IA</h2>
        <p className="text-body-sm text-text-secondary">
          Necesitas estar inscrito en el curso para hacer la entrevista.
        </p>
      </article>
    </main>
  )
}
