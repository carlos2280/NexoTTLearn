import { Dialog } from "@/shared/components/ui/dialog"
import { cn } from "@/shared/lib/cn"
import type { TipoBloque } from "@nexott-learn/shared-types"
import { useEffect, useRef } from "react"
import { tipoBloqueMeta } from "../bloque-tipo-meta"

interface BuilderTipoBloqueDialogProps {
  readonly abierto: boolean
  readonly onCambiarAbierto: (abierto: boolean) => void
  readonly enviando: boolean
  readonly onElegir: (tipo: TipoBloque) => Promise<void> | void
}

type FamiliaId = "contenido" | "evaluacion" | "codigo"

interface Familia {
  readonly id: FamiliaId
  readonly etiqueta: string
  readonly tipos: readonly TipoBloque[]
}

const FAMILIAS: readonly Familia[] = [
  {
    id: "contenido",
    etiqueta: "Contenido",
    tipos: ["PARRAFO", "TIP", "VIDEO", "RECURSO"],
  },
  {
    id: "evaluacion",
    etiqueta: "Evaluación",
    tipos: ["QUIZ"],
  },
  {
    id: "codigo",
    etiqueta: "Código",
    tipos: ["CODIGO_ILUSTRATIVO", "CODIGO_PREGUNTAS", "CODIGO_TESTS"],
  },
]

const TINTE_ICONO: Record<FamiliaId, string> = {
  contenido: "bg-accent-soft text-accent",
  evaluacion: "bg-success-soft text-success-on-soft",
  codigo: "bg-[rgb(var(--color-aurora-cyan-rgb)/0.12)] text-aurora-cyan",
}

export function BuilderTipoBloqueDialog({
  abierto,
  onCambiarAbierto,
  enviando,
  onElegir,
}: BuilderTipoBloqueDialogProps) {
  const primerBotonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!abierto) {
      return
    }
    const id = window.setTimeout(() => primerBotonRef.current?.focus(), 80)
    return () => window.clearTimeout(id)
  }, [abierto])

  return (
    <Dialog
      abierto={abierto}
      onCambiarAbierto={onCambiarAbierto}
      titulo="Elige el tipo de bloque"
      descripcion="Cada tipo se edita de forma distinta. Algunos son evaluables, otros sólo enseñan."
      ancho="lg"
    >
      <div className="flex flex-col gap-5">
        {FAMILIAS.map((familia, indiceFamilia) => (
          <section key={familia.id} className="flex flex-col gap-2.5">
            <span className="nx-eyebrow text-text-tertiary">{familia.etiqueta}</span>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {familia.tipos.map((tipo, indiceTipo) => {
                const meta = tipoBloqueMeta(tipo)
                const Icono = meta.icono
                const esPrimero = indiceFamilia === 0 && indiceTipo === 0
                return (
                  <li key={tipo}>
                    <button
                      ref={esPrimero ? primerBotonRef : undefined}
                      type="button"
                      disabled={enviando}
                      onClick={() => onElegir(tipo)}
                      className={cn(
                        "group flex h-full w-full flex-col items-start gap-2 rounded-lg border border-border bg-surface p-3.5 text-left",
                        "shadow-xs transition-[border-color,box-shadow,transform] duration-base ease-default",
                        "hover:-translate-y-px hover:border-border-emphasis hover:shadow-sm",
                        "focus-visible:border-aurora-violet focus-visible:shadow-ring-aurora-soft focus-visible:outline-none",
                        "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-xs",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-md",
                          TINTE_ICONO[familia.id],
                        )}
                      >
                        <Icono className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
                      </span>
                      <span className="font-medium text-body-sm text-text-primary">
                        {meta.etiqueta}
                      </span>
                      <span className="text-caption text-text-tertiary leading-snug">
                        {meta.descripcionCorta}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
    </Dialog>
  )
}
