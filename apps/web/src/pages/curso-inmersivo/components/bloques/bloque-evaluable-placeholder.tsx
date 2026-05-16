import type { TipoBloque } from "@nexott-learn/shared-types"
import { Sparkles } from "lucide-react"

interface BloqueEvaluablePlaceholderProps {
  readonly tipo: TipoBloque
}

// Claves = valores del enum `TipoBloque` del backend (SCREAMING_CASE). Usamos
// Map con strings literales para que biome no marque las claves como
// no-camelCase (el lint sólo aplica a propiedades de object literal).
const ETIQUETA: ReadonlyMap<string, string> = new Map([
  ["QUIZ", "Quiz · evaluable"],
  ["CODIGO_PREGUNTAS", "Reto de código · evaluable"],
  ["CODIGO_TESTS", "Tests del reto"],
])

/**
 * Placeholder de bloques evaluables. Sub-capa C los conecta de verdad
 * (quiz interactivo + CODIGO_PREGUNTAS con editor editable + envío de
 * intento). Por ahora mostramos un slot informativo para no romper el
 * orden de la sección.
 */
export function BloqueEvaluablePlaceholder({ tipo }: BloqueEvaluablePlaceholderProps) {
  return (
    <article
      className="relative flex items-start gap-4 overflow-hidden rounded-2xl border border-aurora-violet/20 p-5"
      style={{ background: "var(--gradient-card-acento)" }}
    >
      <span
        aria-hidden={true}
        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[rgb(var(--color-aurora-violet-rgb)/0.12)] text-aurora-violet"
      >
        <Sparkles className="h-5 w-5" />
      </span>
      <div className="flex flex-col gap-1">
        <span className="nx-eyebrow text-aurora-violet">
          {ETIQUETA.get(tipo) ?? "Bloque evaluable"}
        </span>
        <h3 className="text-h3 text-text-primary">Próximamente — Sub-capa C</h3>
        <p className="max-w-prose text-body-sm text-text-secondary">
          Aquí podrás responder y enviar tu intento. Mientras tanto, esta sección sigue avanzando
          con los bloques de contenido que ya tiene.
        </p>
      </div>
    </article>
  )
}
