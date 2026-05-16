import { type ThemeMode, useTheme } from "@/shared/hooks/use-theme"
/**
 * ThemeSync — monta el hook useTheme aislado para que las re-renders
 * por cambio de tema (modo system reaccionando al SO, sync entre pestañas)
 * no afecten al árbol de App. Renderiza null.
 */
export function ThemeSync() {
  useTheme()
  return null
}

import { cn } from "@/shared/lib/cn"
import {
  Content as DropdownContent,
  ItemIndicator as DropdownItemIndicator,
  Portal as DropdownPortal,
  RadioGroup as DropdownRadioGroup,
  RadioItem as DropdownRadioItem,
  Root as DropdownRoot,
  Trigger as DropdownTrigger,
} from "@radix-ui/react-dropdown-menu"
import { Check, type LucideIcon, Monitor, Moon, Sun } from "lucide-react"

interface OpcionTema {
  readonly modo: ThemeMode
  readonly etiqueta: string
  readonly icono: LucideIcon
}

const OPCIONES: readonly OpcionTema[] = [
  { modo: "system", etiqueta: "Sistema", icono: Monitor },
  { modo: "light", etiqueta: "Claro", icono: Sun },
  { modo: "dark", etiqueta: "Oscuro", icono: Moon },
]

export function ThemeToggle() {
  const { modo, temaEfectivo, setModo } = useTheme()
  const IconoActual = modo === "system" ? Monitor : temaEfectivo === "dark" ? Moon : Sun

  return (
    <DropdownRoot>
      <DropdownTrigger asChild={true}>
        <button
          type="button"
          aria-label="Cambiar tema"
          className="inline-flex h-9 w-9 items-center justify-center rounded-pill border border-transparent text-text-secondary transition-colors duration-fast ease-default hover:border-border hover:bg-subtle hover:text-text-primary focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
        >
          <IconoActual className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
        </button>
      </DropdownTrigger>
      <DropdownPortal>
        <DropdownContent
          align="end"
          sideOffset={8}
          className="nx-motion-popover min-w-[180px] rounded-xl border border-border bg-surface p-1 shadow-md"
          style={{ zIndex: 250 }}
        >
          <DropdownRadioGroup value={modo} onValueChange={(v) => setModo(v as ThemeMode)}>
            {OPCIONES.map((opcion) => {
              const Icono = opcion.icono
              return (
                <DropdownRadioItem
                  key={opcion.modo}
                  value={opcion.modo}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-body-sm text-text-primary",
                    "outline-none data-[highlighted]:bg-subtle",
                  )}
                >
                  <Icono
                    className="h-4 w-4 shrink-0 text-text-tertiary"
                    strokeWidth={1.5}
                    aria-hidden={true}
                  />
                  <span className="flex-1">{opcion.etiqueta}</span>
                  <DropdownItemIndicator>
                    <Check
                      className="h-3.5 w-3.5 text-aurora-violet"
                      strokeWidth={2}
                      aria-hidden={true}
                    />
                  </DropdownItemIndicator>
                </DropdownRadioItem>
              )
            })}
          </DropdownRadioGroup>
        </DropdownContent>
      </DropdownPortal>
    </DropdownRoot>
  )
}
