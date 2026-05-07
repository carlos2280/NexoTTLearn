import { cn } from "@/shared/lib/cn"
import { Tooltip } from "@/shared/ui/primitives/tooltip"
import { motion } from "framer-motion"
import { ChevronsLeft, ChevronsRight, type LucideIcon } from "lucide-react"
import { Link, useLocation } from "react-router-dom"

export interface SidebarNavItem {
  readonly label: string
  readonly icon: LucideIcon
  readonly href: string
  readonly badge?: string | number
  /** Marca activa custom — por default compara con location.pathname (incluyendo prefijo). */
  readonly matchPrefix?: boolean
  /** Si true, se renderiza como span no clickable con estilo apagado. */
  readonly disabled?: boolean
}

export interface SidebarNavGroup {
  readonly label?: string
  readonly items: readonly SidebarNavItem[]
}

interface AppSidebarProps {
  readonly groups: readonly SidebarNavGroup[]
  readonly footer?: SidebarNavItem
  readonly collapsed: boolean
  readonly onToggle: () => void
  readonly appMark?: string
  readonly appName?: string
  readonly appSub?: string
}

export function AppSidebar({
  groups,
  footer,
  collapsed,
  onToggle,
  appMark = "Nx",
  appName = "NexoTT",
  appSub = "Learn",
}: AppSidebarProps) {
  return (
    <aside
      data-collapsed={collapsed || undefined}
      className={cn(
        "group/sidebar relative flex h-dvh flex-col",
        "border-glass-border border-r bg-surface-1/60 backdrop-blur-2xl",
        "transition-[width] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]",
        collapsed ? "w-[72px]" : "w-[264px]",
      )}
    >
      {/* ── Header (logo) ─────────────────────────────────────── */}
      <div className="flex h-16 items-center gap-3 px-4">
        <BrandMark mark={appMark} />
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
            className="flex min-w-0 flex-col leading-tight"
          >
            <span className="truncate font-semibold text-sm text-text-primary tracking-tight">
              {appName}
            </span>
            <span className="truncate text-text-muted text-xs">{appSub}</span>
          </motion.div>
        )}
      </div>

      {/* ── Nav ───────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 pb-4">
        {groups.map((group, gi) => (
          <NavGroup key={group.label ?? `group-${gi}`} group={group} collapsed={collapsed} />
        ))}
      </nav>

      {/* ── Footer (config + collapse toggle) ─────────────────── */}
      <div className="border-glass-border border-t px-3 py-3">
        {footer ? <NavItemRow item={footer} collapsed={collapsed} /> : null}
        <CollapseButton collapsed={collapsed} onToggle={onToggle} />
      </div>
    </aside>
  )
}

/* ── Brand mark con anillo gradiente y breathing ───────────── */
function BrandMark({ mark }: { readonly mark: string }) {
  return (
    <div
      className={cn(
        "relative grid size-10 shrink-0 place-items-center rounded-[var(--radius-md)]",
        "bg-[linear-gradient(135deg,var(--brand-violet)_0%,var(--brand-cyan)_100%)]",
        "shadow-[0_8px_24px_-4px_rgb(124_58_237/0.55)]",
      )}
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 animate-[breathing_4s_ease-in-out_infinite] rounded-[var(--radius-md)] bg-[linear-gradient(135deg,var(--brand-violet)_0%,var(--brand-cyan)_100%)] opacity-50 blur-md"
      />
      <span className="relative font-bold text-sm text-white tracking-tight">{mark}</span>
    </div>
  )
}

/* ── Group ─────────────────────────────────────────────────── */
function NavGroup({
  group,
  collapsed,
}: {
  readonly group: SidebarNavGroup
  readonly collapsed: boolean
}) {
  return (
    <div className="mt-4 first:mt-2">
      {group.label && !collapsed ? (
        <div className="mb-1.5 px-2.5 font-semibold text-[10px] text-text-muted uppercase tracking-[0.12em]">
          {group.label}
        </div>
      ) : null}
      {collapsed && group.label ? (
        <div className="mx-auto my-2 h-px w-6 bg-glass-border" aria-hidden="true" />
      ) : null}
      <ul className="flex flex-col gap-0.5">
        {group.items.map((item) => (
          <li key={item.href}>
            <NavItemRow item={item} collapsed={collapsed} />
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ── Item ──────────────────────────────────────────────────── */
interface NavItemRowProps {
  readonly item: SidebarNavItem
  readonly collapsed: boolean
}

function NavItemRow({ item, collapsed }: NavItemRowProps) {
  const location = useLocation()
  const isActive = item.matchPrefix
    ? location.pathname.startsWith(item.href)
    : location.pathname === item.href
  const isDisabled = item.disabled === true

  const className = navItemClasses({ isActive, isDisabled, collapsed })

  if (isDisabled) {
    return (
      <Tooltip content={`${item.label} · próximamente`} side="right" sideOffset={12}>
        <span aria-disabled="true" className={className}>
          <NavItemInner item={item} isActive={false} isDisabled={true} collapsed={collapsed} />
        </span>
      </Tooltip>
    )
  }

  return (
    <Tooltip content={item.label} side="right" sideOffset={12} disabled={!collapsed}>
      <Link to={item.href} aria-current={isActive ? "page" : undefined} className={className}>
        <NavItemInner item={item} isActive={isActive} isDisabled={false} collapsed={collapsed} />
      </Link>
    </Tooltip>
  )
}

function navItemClasses({
  isActive,
  isDisabled,
  collapsed,
}: {
  readonly isActive: boolean
  readonly isDisabled: boolean
  readonly collapsed: boolean
}): string {
  return cn(
    "group/item relative flex h-10 items-center gap-3 rounded-[var(--radius-md)]",
    "px-2.5 font-medium text-sm",
    "transition-all duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-violet",
    "focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0",
    isDisabled
      ? "cursor-not-allowed text-text-muted/60"
      : isActive
        ? "bg-glass-2 text-text-primary"
        : "text-text-secondary hover:bg-glass-1 hover:text-text-primary",
    collapsed && "justify-center px-0",
  )
}

interface NavItemInnerProps {
  readonly item: SidebarNavItem
  readonly isActive: boolean
  readonly isDisabled: boolean
  readonly collapsed: boolean
}

function NavItemInner({ item, isActive, isDisabled, collapsed }: NavItemInnerProps) {
  const Icon = item.icon
  return (
    <>
      {isActive ? (
        <span
          aria-hidden="true"
          className={cn(
            "absolute top-1.5 bottom-1.5 left-0 w-[3px] rounded-r-full",
            "bg-[linear-gradient(180deg,var(--brand-violet)_0%,var(--brand-cyan)_100%)]",
            "shadow-[0_0_10px_rgb(124_58_237/0.6)]",
          )}
        />
      ) : null}

      <Icon
        aria-hidden="true"
        className={cn(
          "size-[18px] shrink-0 transition-colors",
          isDisabled
            ? "text-text-muted/60"
            : isActive
              ? "text-brand-violet-soft"
              : "text-text-muted group-hover/item:text-text-primary",
        )}
      />

      {collapsed ? (
        item.badge != null ? (
          <span className="absolute top-1 right-1 grid size-4 place-items-center rounded-full bg-brand-violet font-semibold text-[9px] text-white">
            {item.badge}
          </span>
        ) : null
      ) : (
        <>
          <span className="flex-1 truncate">{item.label}</span>
          {item.badge != null ? <NavBadge value={item.badge} active={isActive} /> : null}
        </>
      )}
    </>
  )
}

function NavBadge({
  value,
  active,
}: {
  readonly value: string | number
  readonly active: boolean
}) {
  return (
    <span
      className={cn(
        "inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5",
        "font-semibold text-[10px] tracking-tight",
        active
          ? "bg-[linear-gradient(135deg,var(--brand-violet)_0%,var(--brand-cyan)_100%)] text-white"
          : "bg-glass-2 text-text-secondary",
      )}
    >
      {value}
    </span>
  )
}

/* ── Collapse toggle ───────────────────────────────────────── */
function CollapseButton({
  collapsed,
  onToggle,
}: {
  readonly collapsed: boolean
  readonly onToggle: () => void
}) {
  const Icon = collapsed ? ChevronsRight : ChevronsLeft
  return (
    <Tooltip content={collapsed ? "Expandir" : "Colapsar"} side="right" sideOffset={12}>
      <button
        type="button"
        onClick={onToggle}
        aria-label={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
        className={cn(
          "mt-1 flex h-9 w-full items-center justify-center gap-2",
          "rounded-[var(--radius-md)] text-text-muted",
          "transition-colors duration-200 hover:bg-glass-1 hover:text-text-primary",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-violet",
        )}
      >
        <Icon className="size-4" aria-hidden="true" />
        {!collapsed && <span className="text-xs">Colapsar</span>}
      </button>
    </Tooltip>
  )
}
