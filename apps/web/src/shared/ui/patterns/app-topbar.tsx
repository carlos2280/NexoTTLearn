import { useLogout } from "@/features/auth/hooks/use-logout"
import { RUTAS } from "@/shared/constants/rutas"
import { cn } from "@/shared/lib/cn"
import { Avatar } from "@/shared/ui/primitives/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/shared/ui/primitives/dropdown-menu"
import { ThemeToggle } from "@/shared/ui/primitives/theme-toggle"
import type { UsuarioPublico } from "@nexott-learn/shared-types"
import { ChevronRight, LogOut, Search, Settings } from "lucide-react"
import type { ReactNode } from "react"
import { Link, useNavigate } from "react-router-dom"

export interface BreadcrumbCrumb {
  readonly label: string
  readonly href?: string
}

interface AppTopbarProps {
  readonly usuario: UsuarioPublico
  readonly breadcrumbs?: readonly BreadcrumbCrumb[]
  readonly onSearchClick?: () => void
  /** Slot opcional para acciones contextuales de la pagina (ej. boton primario). */
  readonly actions?: ReactNode
}

export function AppTopbar({ usuario, breadcrumbs, onSearchClick, actions }: AppTopbarProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-[var(--z-sticky)] flex h-16 items-center gap-4",
        "border-glass-border border-b bg-surface-0/70 px-6 backdrop-blur-2xl",
      )}
    >
      {/* Breadcrumb */}
      <div className="flex min-w-0 flex-1 items-center">
        {breadcrumbs && breadcrumbs.length > 0 ? <Breadcrumbs crumbs={breadcrumbs} /> : null}
      </div>

      {/* Acciones contextuales (slot) */}
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}

      {/* Search trigger */}
      <SearchTrigger onClick={onSearchClick} />

      {/* Theme toggle */}
      <ThemeToggle />

      {/* User menu */}
      <UserMenu usuario={usuario} />
    </header>
  )
}

/* ── Breadcrumbs ───────────────────────────────────────────── */
function Breadcrumbs({ crumbs }: { readonly crumbs: readonly BreadcrumbCrumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex min-w-0 items-center gap-1.5">
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1
          return (
            <li key={`${crumb.label}-${i}`} className="flex min-w-0 items-center gap-1.5">
              {i > 0 ? (
                <ChevronRight aria-hidden="true" className="size-3.5 shrink-0 text-text-faint" />
              ) : null}
              {isLast || !crumb.href ? (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className={cn(
                    "truncate font-medium text-sm",
                    isLast ? "text-text-primary" : "text-text-secondary",
                  )}
                >
                  {crumb.label}
                </span>
              ) : (
                <Link
                  to={crumb.href}
                  className="truncate font-medium text-sm text-text-secondary transition-colors hover:text-text-primary"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

/* ── Search trigger (placeholder, abre cmdk en futuro) ─────── */
function SearchTrigger({ onClick }: { readonly onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "hidden items-center gap-2.5 md:inline-flex",
        "h-9 rounded-[var(--radius-md)] border border-glass-border bg-glass-1",
        "px-3 text-text-muted text-xs",
        "transition-all duration-200 hover:border-glass-border-strong hover:bg-glass-2",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-violet",
      )}
    >
      <Search className="size-3.5" aria-hidden="true" />
      <span>Buscar...</span>
      <kbd
        className={cn(
          "ml-2 inline-flex h-5 items-center gap-0.5 rounded-[var(--radius-xs)]",
          "border border-glass-border bg-glass-2 px-1.5",
          "font-mono font-semibold text-[10px] text-text-secondary",
        )}
      >
        <span>⌘</span>K
      </kbd>
    </button>
  )
}

/* ── User menu (Radix DropdownMenu) ────────────────────────── */
function UserMenu({ usuario }: { readonly usuario: UsuarioPublico }) {
  const navigate = useNavigate()
  const logoutMutation = useLogout()
  const iniciales = `${usuario.nombre[0] ?? ""}${usuario.apellido[0] ?? ""}`.toUpperCase()
  const nombreCompleto = `${usuario.nombre} ${usuario.apellido}`.trim()

  const handleLogout = async () => {
    await logoutMutation.mutateAsync()
    navigate(RUTAS.login, { replace: true })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild={true}>
        <button
          type="button"
          aria-label="Menu de usuario"
          className={cn(
            "rounded-full ring-2 ring-transparent transition-all duration-200",
            "hover:ring-brand-violet/40",
            "focus-visible:outline-none focus-visible:ring-brand-violet",
            "data-[state=open]:ring-brand-violet/60",
          )}
        >
          <Avatar initials={iniciales} size="sm" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[240px]">
        <div className="flex items-center gap-3 px-2.5 py-2">
          <Avatar initials={iniciales} size="md" />
          <div className="flex min-w-0 flex-col leading-tight">
            <span className="truncate font-semibold text-sm text-text-primary">
              {nombreCompleto}
            </span>
            <span className="truncate text-text-muted text-xs">{usuario.email}</span>
          </div>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuLabel>Cuenta</DropdownMenuLabel>
        <DropdownMenuItem icon={Settings} onSelect={() => navigate(RUTAS.cambiarPassword)}>
          Cambiar contrasena
          <DropdownMenuShortcut>⌘,</DropdownMenuShortcut>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem icon={LogOut} tone="danger" onSelect={handleLogout}>
          Cerrar sesion
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
