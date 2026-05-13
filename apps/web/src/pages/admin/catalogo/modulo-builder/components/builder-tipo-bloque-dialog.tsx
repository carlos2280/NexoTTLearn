import { Dialog } from "@/shared/components/ui/dialog"
import { cn } from "@/shared/lib/cn"
import type { TipoBloque } from "@nexott-learn/shared-types"
import { tipoBloqueMeta, tiposBloqueOrdenados } from "../bloque-tipo-meta"

interface BuilderTipoBloqueDialogProps {
  readonly abierto: boolean
  readonly onCambiarAbierto: (abierto: boolean) => void
  readonly enviando: boolean
  readonly onElegir: (tipo: TipoBloque) => Promise<void> | void
}

export function BuilderTipoBloqueDialog({
  abierto,
  onCambiarAbierto,
  enviando,
  onElegir,
}: BuilderTipoBloqueDialogProps) {
  const tipos = tiposBloqueOrdenados()
  return (
    <Dialog
      abierto={abierto}
      onCambiarAbierto={onCambiarAbierto}
      titulo="Elige el tipo de bloque"
      descripcion="Cada tipo se edita de forma distinta. Algunos son evaluables, otros sólo sirven para enseñar."
      ancho="lg"
    >
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {tipos.map((tipo) => {
          const meta = tipoBloqueMeta(tipo)
          const Icono = meta.icono
          return (
            <li key={tipo}>
              <button
                type="button"
                disabled={enviando}
                onClick={() => onElegir(tipo)}
                className={cn(
                  "flex h-full w-full flex-col items-start gap-2 rounded-lg border border-border bg-surface p-4 text-left transition-colors",
                  "hover:border-accent hover:bg-accent-soft/50",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                )}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-subtle text-text-secondary">
                  <Icono className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
                </span>
                <span className="font-medium text-body-sm text-text-primary">{meta.etiqueta}</span>
                <span className="text-caption text-text-tertiary">{meta.descripcionCorta}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </Dialog>
  )
}
