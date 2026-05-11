import { useUsuarioActual } from "@/features/auth/hooks/use-usuario-actual"
import { AvatarIniciales } from "@/shared/components/ui/avatar-iniciales"
import { Button } from "@/shared/components/ui/button"
import { RUTAS } from "@/shared/constants/rutas"
import { LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useSaludoTemporal } from "../hooks/use-saludo-temporal"

interface AdminTopbarProps {
  readonly sidebarColapsado: boolean
  readonly onAlternarSidebar: () => void
}

export function AdminTopbar({ sidebarColapsado, onAlternarSidebar }: AdminTopbarProps) {
  const { data: usuario } = useUsuarioActual()
  const { fechaLarga } = useSaludoTemporal()
  const navigate = useNavigate()

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
      <span className="hidden h-5 w-px bg-border sm:block" aria-hidden={true} />
      <span className="hidden truncate text-caption text-text-tertiary uppercase tracking-wide sm:inline">
        {fechaLarga}
      </span>
      <div className="ml-auto flex items-center gap-2">
        {usuario ? (
          <button
            type="button"
            onClick={() => navigate(RUTAS.cuenta)}
            aria-label="Ir a mi cuenta"
            className="flex items-center gap-2 rounded-pill border border-border bg-subtle py-1 pr-3 pl-1 transition-colors duration-fast ease-default hover:bg-subtle/60 focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
          >
            <AvatarIniciales nombre={usuario.nombre} tamano="sm" />
            <span className="hidden text-body-sm text-text-primary sm:inline">
              {usuario.nombre}
            </span>
          </button>
        ) : null}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(RUTAS.logout)}
          aria-label="Cerrar sesión"
        >
          <LogOut className="h-4 w-4" aria-hidden={true} />
        </Button>
      </div>
    </div>
  )
}
