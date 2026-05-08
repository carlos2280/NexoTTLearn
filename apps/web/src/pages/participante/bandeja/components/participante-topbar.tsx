import { useLogout } from "@/features/auth/hooks/use-logout"
import { useBandeja } from "@/features/participante-bandeja/hooks/use-bandeja"
import { RUTAS } from "@/shared/constants/rutas"
import { useScrolled } from "@/shared/hooks/use-scrolled"
import { cn } from "@/shared/lib/cn"
import { Avatar } from "@/shared/ui/primitives/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/primitives/dropdown-menu"
import type { UsuarioPublico } from "@nexott-learn/shared-types"
import { Bell, LogOut } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"

interface ParticipanteTopbarProps {
  readonly usuario: UsuarioPublico
}

const RE_ESPACIOS = /\s+/

function obtenerIniciales(nombre: string): string {
  const partes = nombre.trim().split(RE_ESPACIOS)
  const a = partes[0]?.charAt(0) ?? ""
  const b = partes[1]?.charAt(0) ?? ""
  return (a + b).toUpperCase() || "??"
}

// §5 doc canonico. Logo + campanita con badge + avatar dropdown.
// Scroll-aware: transparente arriba, glass al scrollear (>16px).
export function ParticipanteTopbar({ usuario }: ParticipanteTopbarProps) {
  const navigate = useNavigate()
  const logout = useLogout()
  const isScrolled = useScrolled()
  const bandeja = useBandeja()
  const noLeidas = bandeja.data?.stream.novedadesNoLeidas ?? 0

  const handleLogout = (): void => {
    logout.mutate(undefined, {
      onSettled: () => navigate(RUTAS.login, { replace: true }),
    })
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-[var(--z-sticky)] flex h-16 items-center justify-between gap-4 border-b px-4 transition-[background,border,backdrop-filter] duration-200 ease-out md:px-6",
        isScrolled ? "border-glass-border bg-surface-0" : "border-transparent bg-transparent",
      )}
    >
      <Link
        to={RUTAS.participante.bandeja}
        aria-label="Volver a la bandeja"
        className="flex items-center gap-2"
      >
        <span className="grid size-8 place-items-center rounded-md bg-gradient-to-br from-brand-violet to-brand-cyan font-bold text-white text-xs shadow-md">
          Nx
        </span>
        <div className="flex flex-col leading-tight">
          <span className="font-semibold text-sm text-text-primary">NexoTT</span>
          <span className="text-text-muted text-xs">Learn</span>
        </div>
      </Link>

      <div className="flex items-center gap-1">
        <button
          type="button"
          className="relative grid size-9 place-items-center rounded-md text-text-secondary transition-colors hover:bg-surface-2 hover:text-text-primary"
          aria-label={noLeidas > 0 ? `Notificaciones, ${noLeidas} sin leer` : "Notificaciones"}
        >
          <Bell className="size-4" strokeWidth={1.75} />
          {noLeidas > 0 ? (
            <span className="absolute top-1.5 right-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full border border-surface-0 bg-danger px-1 font-semibold text-[9px] text-white tabular-nums">
              {noLeidas > 9 ? "9+" : noLeidas}
            </span>
          ) : null}
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild={true}>
            <button type="button" className="rounded-full" aria-label="Menu de usuario">
              <Avatar initials={obtenerIniciales(usuario.nombre)} size="sm" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{usuario.nombre}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleLogout}>
              <LogOut className="size-4" strokeWidth={1.75} />
              Cerrar sesion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
