import { cn } from "@/shared/lib/cn"
import { CircleDot, Lock, PanelBottom } from "lucide-react"

type ModoCurso = "asignado" | "voluntario" | "preview"

interface IdeStatusbarProps {
  readonly modo: ModoCurso
  /** `null` cuando no aplica (modo preview, sin asignacion). */
  readonly porcentajeAvance: number | null
  readonly soloLectura: boolean
  readonly atenuado?: boolean
  /**
   * Toggle del panel inferior de avance. `undefined` cuando no hay avance que
   * mostrar (p. ej. modo preview) — en ese caso no se pinta el control.
   */
  readonly panelAvance?: { readonly abierto: boolean; readonly onToggle: () => void }
}

const ETIQUETA_MODO: Record<ModoCurso, string> = {
  asignado: "Asignado",
  voluntario: "Voluntario",
  preview: "Vista previa",
}

/**
 * Barra de estado del IDE inmerso (patrón VS Code): segmento de acento a la
 * izquierda con el modo del curso, indicadores a la derecha. Tokens semánticos
 * → dark/light automático. Fina, mono, calma editorial: informa sin competir.
 */
export function IdeStatusbar({
  modo,
  porcentajeAvance,
  soloLectura,
  atenuado,
  panelAvance,
}: IdeStatusbarProps) {
  const round =
    porcentajeAvance === null ? null : Math.max(0, Math.min(100, Math.round(porcentajeAvance)))
  return (
    <footer
      className={cn(
        "flex h-7 shrink-0 items-center justify-between border-border border-t bg-subtle pr-3",
        "font-code text-[11px] text-text-tertiary",
        "transition-[opacity,filter] duration-cinematic ease-default",
        atenuado ? "pointer-events-none opacity-15 blur-[2px]" : "",
      )}
    >
      <span className="flex h-full items-center gap-1.5 bg-accent px-3 text-white">
        <CircleDot className="h-3 w-3" aria-hidden={true} />
        {ETIQUETA_MODO[modo]}
      </span>
      <span className="flex items-center gap-4">
        {panelAvance ? (
          <button
            type="button"
            onClick={panelAvance.onToggle}
            aria-pressed={panelAvance.abierto}
            className={cn(
              "flex items-center gap-1 transition-colors duration-base ease-default hover:text-text-secondary",
              panelAvance.abierto ? "text-accent" : "",
            )}
          >
            <PanelBottom className="h-3 w-3" aria-hidden={true} />
            avance
          </button>
        ) : null}
        {soloLectura ? (
          <span className="flex items-center gap-1">
            <Lock className="h-3 w-3" aria-hidden={true} />
            solo lectura
          </span>
        ) : null}
        {round !== null ? (
          <span className="tabular flex items-baseline gap-1">
            <span className="font-semibold text-accent text-body-sm">{round}%</span>
            <span className="text-text-tertiary">completado</span>
          </span>
        ) : null}
      </span>
    </footer>
  )
}
