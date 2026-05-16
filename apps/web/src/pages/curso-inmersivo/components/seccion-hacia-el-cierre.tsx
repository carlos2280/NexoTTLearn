import { cn } from "@/shared/lib/cn"
import type {
  DisponibilidadEntrevistaIaConMotivo,
  DisponibilidadTransversalConMotivo,
} from "../types"

type HitoTipo = "transversal" | "entrevistaIa"

interface SeccionHaciaElCierreProps {
  readonly transversal: DisponibilidadTransversalConMotivo | undefined
  readonly entrevistaIa: DisponibilidadEntrevistaIaConMotivo | undefined
  readonly onAbrirHito: (hito: HitoTipo) => void
}

/**
 * "Hacia el cierre" — Refinamiento 4 de pantalla 03.
 *
 * Línea de tiempo vertical con DOS puntos: Transversal y Entrevista IA. NO
 * incluye "Apto para cliente" — eso es decisión del admin, no destino del
 * participante. Click en hito disponible carga el canvas especializado.
 */
export function SeccionHaciaElCierre({
  transversal,
  entrevistaIa,
  onAbrirHito,
}: SeccionHaciaElCierreProps) {
  if (!(transversal || entrevistaIa)) {
    return null
  }
  return (
    <section className="flex flex-col gap-3">
      <h3 className="nx-eyebrow text-text-tertiary">Hacia el cierre</h3>
      <ol className="flex flex-col">
        {transversal ? (
          <ItemHito
            etiqueta="Proyecto transversal"
            disponible={transversal.disponible}
            motivoBloqueo={transversal.motivoBloqueo ?? null}
            onClick={() => onAbrirHito("transversal")}
            esUltimo={!entrevistaIa}
          />
        ) : null}
        {entrevistaIa ? (
          <ItemHito
            etiqueta="Entrevista IA"
            disponible={entrevistaIa.disponible}
            motivoBloqueo={entrevistaIa.motivoBloqueo ?? null}
            onClick={() => onAbrirHito("entrevistaIa")}
            esUltimo={true}
          />
        ) : null}
      </ol>
    </section>
  )
}

interface ItemHitoProps {
  readonly etiqueta: string
  readonly disponible: boolean
  readonly motivoBloqueo: string | null
  readonly onClick: () => void
  readonly esUltimo: boolean
}

function ItemHito({ etiqueta, disponible, motivoBloqueo, onClick, esUltimo }: ItemHitoProps) {
  const microcopy = disponible ? "Disponible ahora" : (motivoBloqueo ?? "Bloqueado")
  const contenido = (
    <div className="flex flex-col gap-0.5">
      <span
        className={cn("text-body-sm", disponible ? "text-text-primary" : "text-text-secondary")}
      >
        {etiqueta}
      </span>
      <span className="text-caption text-text-tertiary">{microcopy}</span>
    </div>
  )

  return (
    <li className="relative grid grid-cols-[auto_minmax(0,1fr)] gap-3">
      <div className="flex flex-col items-center">
        <Punto disponible={disponible} />
        {esUltimo ? null : <span aria-hidden={true} className="my-1 w-px flex-1 bg-border" />}
      </div>
      <div className={cn("pb-4", esUltimo ? "pb-0" : "")}>
        {disponible ? (
          <button
            type="button"
            onClick={onClick}
            className="rounded-md text-left transition-colors duration-base ease-default hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
          >
            {contenido}
          </button>
        ) : (
          contenido
        )}
      </div>
    </li>
  )
}

function Punto({ disponible }: { readonly disponible: boolean }) {
  if (disponible) {
    return (
      <span
        aria-hidden={true}
        className="nx-pulse-dot mt-1 inline-block h-2.5 w-2.5 shrink-0 rounded-pill bg-aurora-cyan text-aurora-cyan"
        style={{ boxShadow: "0 0 8px 2px rgb(var(--color-aurora-cyan-rgb) / 0.35)" }}
      />
    )
  }
  return (
    <span
      aria-hidden={true}
      className="mt-1 inline-block h-2.5 w-2.5 shrink-0 rounded-pill border border-border-strong bg-canvas"
    />
  )
}
