import { Popover, PopoverContent, PopoverPortal, PopoverTrigger } from "@radix-ui/react-popover"
import { HelpCircle } from "lucide-react"

export interface AyudaContenido {
  readonly queEs: string
  readonly siCambias: string
  readonly ejemplo: string
}

interface AyudaPopoverProps {
  readonly contenido: AyudaContenido
  readonly etiquetaAria?: string
}

/**
 * AyudaPopover — botón discreto `(?)` que abre un popover con tres bloques
 * editoriales: Qué es · Si lo cambias · Ejemplo típico.
 *
 * Diseñado para acompañar al título de cualquier panel de configuración donde
 * el usuario necesite contexto sin abandonar la pantalla.
 */
export function AyudaPopover({ contenido, etiquetaAria = "Ayuda" }: AyudaPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild={true}>
        <button
          type="button"
          aria-label={etiquetaAria}
          className="inline-flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full text-text-tertiary transition-colors duration-base ease-default hover:bg-subtle hover:text-text-secondary focus-visible:bg-subtle focus-visible:text-text-secondary focus-visible:outline-none"
        >
          <HelpCircle className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverPortal>
        <PopoverContent
          side="bottom"
          align="start"
          sideOffset={8}
          collisionPadding={16}
          className="nx-motion-popover z-popover w-[360px] rounded-xl border border-border bg-surface p-5 shadow-overlay"
        >
          <div className="flex flex-col gap-4">
            <Seccion eyebrow="Qué es" texto={contenido.queEs} />
            <Seccion eyebrow="Si lo cambias" texto={contenido.siCambias} />
            <Seccion eyebrow="Ejemplo típico" texto={contenido.ejemplo} />
          </div>
        </PopoverContent>
      </PopoverPortal>
    </Popover>
  )
}

function Seccion({ eyebrow, texto }: { readonly eyebrow: string; readonly texto: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="nx-eyebrow text-aurora-violet">{eyebrow}</span>
      <p className="text-body-sm text-text-secondary leading-relaxed">{texto}</p>
    </div>
  )
}
