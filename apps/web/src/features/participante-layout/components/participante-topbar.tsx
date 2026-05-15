import { Button } from "@/shared/components/ui/button"
import { ThemeToggle } from "@/shared/components/ui/theme-toggle"
import { PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { useTituloPaginaParticipante } from "../hooks/use-titulo-pagina-participante"
import { ParticipanteUserMenu } from "./participante-user-menu"

interface ParticipanteTopbarProps {
  readonly sidebarColapsado: boolean
  readonly onAlternarSidebar: () => void
  readonly onAbrirCuenta: () => void
}

export function ParticipanteTopbar({
  sidebarColapsado,
  onAlternarSidebar,
  onAbrirCuenta,
}: ParticipanteTopbarProps) {
  const IconoToggle = sidebarColapsado ? PanelLeftOpen : PanelLeftClose
  const etiquetaToggle = sidebarColapsado ? "Expandir menú lateral" : "Colapsar menú lateral"
  const { eyebrow, titulo } = useTituloPaginaParticipante()

  return (
    <div className="flex h-16 items-center gap-4 px-6">
      <Button
        variant="ghost"
        size="icon"
        onClick={onAlternarSidebar}
        aria-label={etiquetaToggle}
        aria-pressed={sidebarColapsado}
      >
        <IconoToggle className="h-4 w-4" aria-hidden={true} />
      </Button>

      {titulo ? (
        <div className="flex min-w-0 flex-col gap-0">
          <span className="nx-eyebrow text-text-tertiary">{eyebrow}</span>
          <span className="truncate font-semibold text-body text-text-primary">{titulo}</span>
        </div>
      ) : null}

      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        <ParticipanteUserMenu onAbrirCuenta={onAbrirCuenta} />
      </div>
    </div>
  )
}
