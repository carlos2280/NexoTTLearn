import { useGitEjercicio } from "@/features/git-ejecucion/use-git-ejercicio"
import { Button } from "@/shared/components/ui/button"
import { sanitizarHtml } from "@/shared/lib/sanitize-html"
import { type ContenidoGitEjercicio, contenidoGitEjercicioSchema } from "@nexott-learn/shared-types"
import { Check, RotateCcw } from "lucide-react"
import { EstadoRepoGit } from "./estado-repo-git"
import { TerminalGit } from "./terminal-git"

interface BloqueGitEjercicioProps {
  readonly contenido: Record<string, unknown> | null
}

/**
 * Bloque GIT_EJERCICIO: un terminal de git sobre un repo simulado en memoria.
 * Autocontenido — el alumno practica branch/commit/merge y ve "objetivo
 * cumplido" al instante, sin registrar nota (el diseño deja la puerta abierta
 * al futuro modo evaluable vía el `objetivo` declarativo del contenido).
 *
 * El outer valida el contenido y delega en el inner, que llama el hook siempre
 * (rules-of-hooks): así el early-return por contenido inválido no lo condiciona.
 */
export function BloqueGitEjercicio({ contenido }: BloqueGitEjercicioProps) {
  const parsed = contenidoGitEjercicioSchema.safeParse(contenido)
  if (!parsed.success) {
    return null
  }
  return <GitEjercicioActivo contenido={parsed.data} />
}

interface GitEjercicioActivoProps {
  readonly contenido: ContenidoGitEjercicio
}

function GitEjercicioActivo({ contenido }: GitEjercicioActivoProps) {
  const { estado, historial, logrado, ejecutar, reiniciar } = useGitEjercicio(contenido.objetivo)
  const enunciadoHtml = sanitizarHtml(contenido.enunciado)

  return (
    <section className="flex flex-col gap-3">
      <div
        className="tiptap max-w-prose text-body text-text-secondary"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: HTML del enunciado, sanitizado por sanitizarHtml.
        dangerouslySetInnerHTML={{ __html: enunciadoHtml }}
      />
      <div className="grid gap-3 lg:grid-cols-[1fr_minmax(200px,280px)]">
        <TerminalGit historial={historial} rama={estado.head} onEjecutar={ejecutar} />
        <EstadoRepoGit estado={estado} />
      </div>
      <div className="flex items-center justify-between gap-3">
        <p aria-live="polite" className="text-body-sm">
          {logrado ? (
            <span className="inline-flex items-center gap-1.5 text-success">
              <Check className="h-4 w-4" aria-hidden={true} />
              Objetivo cumplido.
            </span>
          ) : (
            <span className="text-text-tertiary">Completa el objetivo del enunciado.</span>
          )}
        </p>
        <Button type="button" variant="ghost" size="sm" onClick={reiniciar}>
          <RotateCcw className="h-4 w-4" aria-hidden={true} />
          Reiniciar
        </Button>
      </div>
      {contenido.pista.length > 0 ? (
        <details className="rounded-lg border border-border bg-surface px-4 py-2 text-body-sm text-text-secondary">
          <summary className="cursor-pointer select-none text-text-tertiary">Ver pista</summary>
          <p className="mt-2 whitespace-pre-wrap">{contenido.pista}</p>
        </details>
      ) : null}
    </section>
  )
}
