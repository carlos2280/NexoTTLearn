import { presetParaBloque } from "@/features/bloques-runtime/lib/bloque-presets"
import { cn } from "@/shared/lib/cn"
import { type SeccionInmersiva, presetKeyDeBloque } from "@nexott-learn/shared-types"
import { Check, ChevronDown } from "lucide-react"
import { useEffect, useState } from "react"

interface SidebarSeccionProps {
  readonly seccion: SeccionInmersiva
  readonly esActual: boolean
  readonly bloqueActualId: string | null
  readonly onSeleccionarBloque: (bloqueId: string) => void
}

// Item de seccion con bloques anidados. Auto-expande cuando es la actual o
// esta en progreso. El alumno puede toggle manualmente.

export function SidebarSeccion({
  seccion,
  esActual,
  bloqueActualId,
  onSeleccionarBloque,
}: SidebarSeccionProps) {
  const [abierto, setAbierto] = useState<boolean>(esActual || seccion.estado === "EN_PROGRESO")

  // Cuando la seccion pasa a "actual" por scroll, la abrimos automaticamente.
  useEffect(() => {
    if (esActual) {
      setAbierto(true)
    }
  }, [esActual])

  return (
    <li>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors hover:bg-glass-1"
      >
        <ChevronDown
          className={cn(
            "size-3.5 shrink-0 text-text-muted transition-transform",
            !abierto && "-rotate-90",
          )}
          strokeWidth={2}
        />
        <EstadoSeccionDot estado={seccion.estado} esActual={esActual} />
        <span className="truncate font-semibold text-text-primary">{seccion.titulo}</span>
      </button>
      {abierto && (
        <ul className="mt-1 ml-4 flex flex-col gap-0.5 border-glass-border border-l pl-2">
          {seccion.bloques.map((bloque) => {
            const esBloqueActual = bloque.id === bloqueActualId
            const preset = presetParaBloque(presetKeyDeBloque(bloque))
            const Icon = preset.icon
            return (
              <li key={bloque.id}>
                <button
                  type="button"
                  onClick={() => onSeleccionarBloque(bloque.id)}
                  className={cn(
                    "group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors",
                    esBloqueActual
                      ? "bg-brand-violet/10 font-semibold text-text-primary"
                      : "text-text-secondary hover:bg-glass-1 hover:text-text-primary",
                  )}
                >
                  <Icon className="size-3.5 shrink-0 opacity-80" strokeWidth={1.75} />
                  <span className="flex-1 truncate">{bloque.titulo}</span>
                  {bloque.estado === "COMPLETADO" && (
                    <Check className="size-3.5 shrink-0 text-success" strokeWidth={2.5} />
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </li>
  )
}

function EstadoSeccionDot({
  estado,
  esActual,
}: { readonly estado: SeccionInmersiva["estado"]; readonly esActual: boolean }) {
  if (estado === "COMPLETADA") {
    return (
      <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-success/20">
        <Check className="size-2.5 text-success" strokeWidth={3} />
      </span>
    )
  }
  if (esActual || estado === "EN_PROGRESO") {
    return (
      <span
        className={cn(
          "size-4 shrink-0 rounded-full bg-gradient-to-br from-brand-violet to-brand-cyan",
          esActual && "animate-breathing",
        )}
      />
    )
  }
  return <span className="size-4 shrink-0 rounded-full border border-glass-border-strong" />
}
