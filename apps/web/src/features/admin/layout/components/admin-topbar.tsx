import { CampanitaNotificaciones } from "@/features/notificaciones/components/campanita-notificaciones"
import { Button } from "@/shared/components/ui/button"
import { Kbd } from "@/shared/components/ui/kbd"
import { PanelLeftClose, PanelLeftOpen, Search } from "lucide-react"
import { AdminUserMenu } from "./admin-user-menu"

interface AdminTopbarProps {
  readonly sidebarColapsado: boolean
  readonly onAlternarSidebar: () => void
  readonly onAbrirPaleta: () => void
  readonly onAbrirCuenta: () => void
}

export function AdminTopbar({
  sidebarColapsado,
  onAlternarSidebar,
  onAbrirPaleta,
  onAbrirCuenta,
}: AdminTopbarProps) {
  const IconoToggle = sidebarColapsado ? PanelLeftOpen : PanelLeftClose
  const etiquetaToggle = sidebarColapsado ? "Expandir menú lateral" : "Colapsar menú lateral"

  return (
    <div className="flex h-16 items-center gap-4 px-6 lg:px-8">
      <Button
        variant="ghost"
        size="icon"
        onClick={onAlternarSidebar}
        aria-label={etiquetaToggle}
        aria-pressed={sidebarColapsado}
        className="text-text-tertiary hover:text-text-primary"
      >
        <IconoToggle className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
      </Button>

      <button
        type="button"
        onClick={onAbrirPaleta}
        aria-label="Buscar, navegar, ejecutar — atajo Cmd K"
        className="group/search inline-flex h-9 max-w-xl flex-1 items-center gap-2 rounded-lg border border-border-strong bg-surface px-3 text-body-sm text-text-secondary shadow-xs transition-[border-color,box-shadow,color] duration-base ease-default hover:border-border-emphasis hover:shadow-sm focus-visible:border-aurora-violet focus-visible:shadow-ring-aurora-soft focus-visible:outline-none"
      >
        <Search
          className="h-4 w-4 shrink-0 text-text-tertiary transition-colors duration-base ease-default group-hover/search:text-text-secondary group-focus-visible/search:text-aurora-violet"
          strokeWidth={1.5}
          aria-hidden={true}
        />
        <span className="flex-1 truncate text-left">Busca, navega o ejecuta…</span>
        <span className="flex shrink-0 items-center gap-1">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </span>
      </button>

      <div className="ml-auto flex items-center gap-2">
        <CampanitaNotificaciones />
        <AdminUserMenu onAbrirCuenta={onAbrirCuenta} />
      </div>
    </div>
  )
}
