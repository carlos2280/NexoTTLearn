import { cn } from "@/shared/lib/cn"
import {
  Content as DropdownContent,
  Item as DropdownItem,
  Portal as DropdownPortal,
  Root as DropdownRoot,
  Separator as DropdownSeparator,
  Trigger as DropdownTrigger,
} from "@radix-ui/react-dropdown-menu"
import { type LucideIcon, MoreHorizontal } from "lucide-react"
import type { ReactNode } from "react"

export interface AccionMenu {
  readonly id: string
  readonly etiqueta: string
  readonly icono?: LucideIcon
  readonly destructiva?: boolean
  readonly deshabilitada?: boolean
  readonly onClick: () => void
}

interface MenuAccionesProps {
  readonly etiquetaAria: string
  readonly grupos: readonly (readonly AccionMenu[])[]
  readonly trigger?: ReactNode
}

export function MenuAcciones({ etiquetaAria, grupos, trigger }: MenuAccionesProps) {
  return (
    <DropdownRoot>
      <DropdownTrigger asChild={true}>
        {trigger ?? (
          <button
            type="button"
            aria-label={etiquetaAria}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary transition-colors duration-fast ease-default hover:bg-subtle hover:text-text-primary focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
          >
            <MoreHorizontal className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
          </button>
        )}
      </DropdownTrigger>
      <DropdownPortal>
        <DropdownContent
          align="end"
          sideOffset={6}
          className="min-w-[200px] rounded-md border border-border bg-surface p-1 shadow-md"
          style={{ zIndex: 250 }}
        >
          {grupos.map((grupo, indice) => (
            <div key={grupo[0]?.id ?? indice}>
              {indice > 0 ? <DropdownSeparator className="my-1 h-px bg-border" /> : null}
              {grupo.map((accion) => {
                const Icono = accion.icono
                return (
                  <DropdownItem
                    key={accion.id}
                    disabled={accion.deshabilitada}
                    onSelect={() => accion.onClick()}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-body-sm",
                      "outline-none",
                      "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
                      accion.destructiva
                        ? "text-danger-on-soft data-[highlighted]:bg-danger-soft"
                        : "text-text-primary data-[highlighted]:bg-subtle",
                    )}
                  >
                    {Icono ? (
                      <Icono className="h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden={true} />
                    ) : null}
                    <span>{accion.etiqueta}</span>
                  </DropdownItem>
                )
              })}
            </div>
          ))}
        </DropdownContent>
      </DropdownPortal>
    </DropdownRoot>
  )
}
