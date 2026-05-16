import { cn } from "@/shared/lib/cn"
import { Lock } from "lucide-react"
import type {
  DisponibilidadEntrevistaIaConMotivo,
  DisponibilidadTransversalConMotivo,
} from "../types"

type HitoTipo = "transversal" | "entrevistaIa"

interface BloqueHitosSidebarProps {
  readonly transversal: DisponibilidadTransversalConMotivo | undefined
  readonly entrevistaIa: DisponibilidadEntrevistaIaConMotivo | undefined
  readonly hitoActivo: HitoTipo | null
  readonly onAbrirHito: (hito: HitoTipo) => void
}

/**
 * Bloque "HITOS DE CIERRE" al final del sidebar del plan. Cada hito
 * (Transversal, Entrevista IA) vive como ítem clickeable cuando está
 * disponible. Click activa el canvas especializado del hito SIN cambiar
 * de ruta (decisión cerrada 2026-05-15).
 */
export function BloqueHitosSidebar({
  transversal,
  entrevistaIa,
  hitoActivo,
  onAbrirHito,
}: BloqueHitosSidebarProps) {
  if (!(transversal || entrevistaIa)) {
    return null
  }
  return (
    <section
      className="flex flex-col gap-2 border-border border-t pt-5"
      aria-label="Hitos de cierre del curso"
    >
      <h3 className="px-2 font-mono text-[10px] text-text-tertiary uppercase tracking-wider">
        Hitos de cierre
      </h3>
      <ul className="flex flex-col gap-1">
        {transversal ? (
          <ItemHito
            etiqueta="Proyecto transversal"
            disponible={transversal.disponible}
            activo={hitoActivo === "transversal"}
            onClick={() => onAbrirHito("transversal")}
          />
        ) : null}
        {entrevistaIa ? (
          <ItemHito
            etiqueta="Entrevista IA"
            disponible={entrevistaIa.disponible}
            activo={hitoActivo === "entrevistaIa"}
            onClick={() => onAbrirHito("entrevistaIa")}
          />
        ) : null}
      </ul>
    </section>
  )
}

interface ItemHitoProps {
  readonly etiqueta: string
  readonly disponible: boolean
  readonly activo: boolean
  readonly onClick: () => void
}

function ItemHito({ etiqueta, disponible, activo, onClick }: ItemHitoProps) {
  return (
    <li>
      <button
        type="button"
        onClick={disponible ? onClick : undefined}
        disabled={!disponible}
        aria-current={activo ? "true" : undefined}
        className={cn(
          "group flex w-full items-start gap-3 rounded-lg px-2.5 py-2 text-left transition-colors duration-fast ease-default",
          activo ? "bg-accent-soft text-accent-on-soft" : "",
          disponible && !activo
            ? "text-text-secondary hover:bg-surface hover:text-text-primary"
            : "",
          disponible ? "" : "cursor-not-allowed text-text-tertiary",
        )}
      >
        <IconoHito disponible={disponible} activo={activo} />
        <span className="min-w-0 flex-1">
          <span
            className={cn(
              "block truncate text-body-sm",
              activo ? "font-semibold text-text-primary" : "",
            )}
          >
            {etiqueta}
          </span>
          <span className="block font-mono text-[10px] text-text-tertiary uppercase tracking-wider">
            {disponible ? "Disponible" : "Pendiente"}
          </span>
        </span>
      </button>
    </li>
  )
}

function IconoHito({
  disponible,
  activo,
}: { readonly disponible: boolean; readonly activo: boolean }) {
  if (disponible) {
    return (
      <span
        aria-hidden={true}
        className={cn(
          "mt-1 inline-block h-2.5 w-2.5 shrink-0 rounded-pill bg-aurora-cyan text-aurora-cyan",
          activo ? "" : "nx-pulse-dot",
        )}
        style={{ boxShadow: "0 0 8px 2px rgb(var(--color-aurora-cyan-rgb) / 0.35)" }}
      />
    )
  }
  return <Lock className="mt-0.5 h-4 w-4 shrink-0 text-text-tertiary" aria-hidden={true} />
}
