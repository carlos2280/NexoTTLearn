import { Button } from "@/shared/components/ui/button"
import { PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { ParticipanteUserMenu } from "./participante-user-menu"

interface ParticipanteTopbarProps {
  readonly sidebarColapsado: boolean
  readonly onAlternarSidebar: () => void
}

export function ParticipanteTopbar({
  sidebarColapsado,
  onAlternarSidebar,
}: ParticipanteTopbarProps) {
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

      <div className="ml-auto">
        <ParticipanteUserMenu />
      </div>
    </div>
  )
}
