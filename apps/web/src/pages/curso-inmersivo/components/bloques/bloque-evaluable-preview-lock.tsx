import { Lock } from "lucide-react"

interface BloqueEvaluablePreviewLockProps {
  readonly titulo: string
}

/**
 * Placeholder sobrio que ocupa el lugar de un bloque evaluable (QUIZ o
 * CODIGO_PREGUNTAS) cuando el participante esta en modo `preview` (sin
 * asignacion). No revelamos el contenido evaluable — solo el cartelito de
 * "inscribete" que apela al deseo sin gritar.
 *
 * Identidad: caja `border bg-subtle` rounded-2xl, icono Lock pequeño, tipo
 * editorial sobrio. Sin aurora (esto NO es momento de marca).
 */
export function BloqueEvaluablePreviewLock({ titulo }: BloqueEvaluablePreviewLockProps) {
  return (
    <article className="flex items-center gap-4 rounded-2xl border border-border border-dashed bg-subtle px-5 py-5">
      <span
        aria-hidden={true}
        className="grid h-10 w-10 place-items-center rounded-xl bg-surface text-text-tertiary"
      >
        <Lock className="h-4 w-4" strokeWidth={1.75} />
      </span>
      <div className="flex flex-col gap-0.5">
        <span className="nx-eyebrow text-text-tertiary">{titulo}</span>
        <p className="text-body-sm text-text-secondary">
          Inscríbete como voluntario para responder y guardar tu progreso.
        </p>
      </div>
    </article>
  )
}
