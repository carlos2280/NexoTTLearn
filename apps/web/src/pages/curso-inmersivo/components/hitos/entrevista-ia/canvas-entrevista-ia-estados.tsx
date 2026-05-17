import { AlertCircle } from "lucide-react"

/**
 * Estados de fallback del canvas de la Entrevista IA: error de carga y
 * usuario sin asignacion al curso. Viven aparte para mantener el orquestador
 * (`canvas-entrevista-ia`) bajo el limite de 150 lineas.
 */
export function ErrorCanvas() {
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

export function SinAsignacion() {
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
