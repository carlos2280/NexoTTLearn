import { Button } from "@/shared/components/ui/button"
import { Kbd } from "@/shared/components/ui/kbd"
import { PanelLeftClose, PanelLeftOpen, Search } from "lucide-react"
import { AdminUserMenu } from "./admin-user-menu"

interface AdminTopbarProps {
  readonly sidebarColapsado: boolean
  readonly onAlternarSidebar: () => void
  readonly onAbrirPaleta: () => void
}

export function AdminTopbar({
  sidebarColapsado,
  onAlternarSidebar,
  onAbrirPaleta,
}: AdminTopbarProps) {
  const IconoToggle = sidebarColapsado ? PanelLeftOpen : PanelLeftClose
  const etiquetaToggle = sidebarColapsado ? "Expandir menú lateral" : "Colapsar menú lateral"

  return (
    <div className="flex h-16 items-center gap-3 px-6">
      <Button
        variant="ghost"
        size="icon"
        onClick={onAlternarSidebar}
        aria-label={etiquetaToggle}
        aria-pressed={sidebarColapsado}
      >
        <IconoToggle className="h-4 w-4" aria-hidden={true} />
      </Button>

      <button
        type="button"
        onClick={onAbrirPaleta}
        aria-label="Buscar, navegar, ejecutar — atajo Cmd K"
        className="group flex h-9 max-w-md flex-1 items-center gap-2 rounded-md border border-border bg-canvas px-3 text-body-sm text-text-tertiary transition-colors duration-fast ease-default hover:border-border-strong hover:text-text-secondary focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
      >
        <Search className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} aria-hidden={true} />
        <span className="flex-1 truncate text-left">Buscar, navegar, ejecutar…</span>
        <span className="flex shrink-0 items-center gap-1">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </span>
      </button>

      <div className="ml-auto">
        <AdminUserMenu />
      </div>
    </div>
  )
}
