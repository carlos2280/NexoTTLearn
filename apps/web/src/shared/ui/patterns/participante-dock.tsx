import { RUTAS } from "@/shared/constants/rutas"
import { Tooltip } from "@/shared/ui/primitives/tooltip"
import { motion } from "framer-motion"
import { Compass, GraduationCap, Inbox, type LucideIcon } from "lucide-react"
import { useMemo } from "react"
import { Link, useLocation } from "react-router-dom"
import { ThemeToggle } from "../primitives/theme-toggle"

interface DockDestino {
  readonly id: string
  readonly label: string
  readonly icono: LucideIcon
  readonly href: string | null
  readonly isActive: (pathname: string) => boolean
  readonly tooltipDisabled?: string
}

const DESTINOS: readonly DockDestino[] = [
  {
    id: "bandeja",
    label: "Bandeja",
    icono: Inbox,
    href: RUTAS.participante.bandeja,
    isActive: (p) => p === "/",
  },
  {
    id: "cursos",
    label: "Mis cursos",
    icono: GraduationCap,
    href: RUTAS.participante.misCursos,
    isActive: (p) => p.startsWith("/cursos"),
  },
  {
    id: "catalogo",
    label: "Catalogo",
    icono: Compass,
    href: null,
    isActive: (p) => p.startsWith("/catalogo"),
    tooltipDisabled: "Catalogo · proximamente",
  },
]

const EASE_SPRING: [number, number, number, number] = [0.34, 1.56, 0.64, 1]

// Dock flotante del rol PARTICIPANTE. Float pill desktop + bottom bar full
// width en mobile. Indicador deslizante con framer layoutId (firma Vercel).
// IDENTIDAD §04 — el dock vive abajo, fuera del flujo del contenido.
export function ParticipanteDock() {
  const { pathname } = useLocation()
  const activeId = useMemo(() => {
    return DESTINOS.find((d) => d.isActive(pathname))?.id ?? null
  }, [pathname])

  return (
    <motion.nav
      initial={{ y: 60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.48, ease: EASE_SPRING, delay: 0.4 }}
      aria-label="Navegacion principal"
      className="fixed inset-x-0 bottom-0 z-[var(--z-sticky)] flex justify-center px-4 pb-[max(env(safe-area-inset-bottom),16px)] sm:bottom-6 sm:px-0 sm:pb-0"
    >
      <div className="flex items-center gap-1 rounded-t-2xl border border-glass-border-strong border-b-0 bg-surface-1 p-1.5 shadow-lg sm:rounded-full sm:border-b sm:shadow-[0_18px_50px_-12px_rgb(0_0_0_/_0.45)]">
        {DESTINOS.map((destino) => (
          <DockItem key={destino.id} destino={destino} active={activeId === destino.id} />
        ))}
        <span aria-hidden="true" className="mx-1 h-7 w-px bg-[color:var(--dock-border)]" />
        <Tooltip content="Tema" side="top" sideOffset={10}>
          <span className="grid size-11 place-items-center rounded-full text-text-secondary">
            <ThemeToggle />
          </span>
        </Tooltip>
      </div>
    </motion.nav>
  )
}

interface DockItemProps {
  readonly destino: DockDestino
  readonly active: boolean
}

function DockItem({ destino, active }: DockItemProps) {
  const Icono = destino.icono
  const disabled = destino.href === null
  const tooltipText = disabled ? (destino.tooltipDisabled ?? destino.label) : destino.label

  const inner = (
    <span className="relative grid size-11 place-items-center rounded-full">
      {active ? (
        <motion.span
          layoutId="dock-active"
          aria-hidden="true"
          transition={{ duration: 0.36, ease: [0.2, 0.8, 0.2, 1] }}
          className="absolute inset-0 rounded-full bg-gradient-to-br from-brand-violet to-brand-cyan shadow-[0_0_24px_rgb(124_58_237_/_0.45)]"
        />
      ) : null}
      <Icono
        aria-hidden="true"
        strokeWidth={1.75}
        className={
          active
            ? "relative z-10 size-[18px] text-white"
            : "relative z-10 size-[18px] text-text-secondary transition-colors duration-200 group-hover/dockitem:text-text-primary"
        }
      />
      <span className="sr-only">{destino.label}</span>
    </span>
  )

  return (
    <Tooltip content={tooltipText} side="top" sideOffset={10}>
      {disabled ? (
        <button
          type="button"
          aria-disabled="true"
          disabled={true}
          className="group/dockitem rounded-full opacity-50"
        >
          {inner}
        </button>
      ) : (
        <Link
          to={destino.href ?? "/"}
          aria-current={active ? "page" : undefined}
          className="group/dockitem rounded-full transition-transform duration-200 hover:scale-[1.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-violet/60"
        >
          {inner}
        </Link>
      )}
    </Tooltip>
  )
}
