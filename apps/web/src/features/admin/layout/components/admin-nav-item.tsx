import { RUTAS } from "@/shared/constants/rutas"
import { cn } from "@/shared/lib/cn"
import {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipPortal,
  TooltipTrigger,
} from "@radix-ui/react-tooltip"
import { NavLink } from "react-router-dom"
import type { NavItem } from "../types"

interface AdminNavItemProps {
  readonly item: NavItem
  readonly colapsado: boolean
}

export function AdminNavItem({ item, colapsado }: AdminNavItemProps) {
  const Icono = item.icono
  const esInicio = item.ruta === RUTAS.admin.inicio

  const enlace = (
    <NavLink
      to={item.ruta}
      end={esInicio}
      aria-label={colapsado ? item.etiqueta : undefined}
      className={({ isActive }) =>
        cn(
          "relative flex w-full items-center rounded-md py-2 text-body-sm transition-colors duration-fast ease-default",
          "focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2",
          colapsado ? "justify-center px-2" : "gap-3 px-3",
          isActive
            ? cn(
                "bg-accent-soft font-medium text-accent",
                "before:absolute before:top-1.5 before:bottom-1.5 before:left-0 before:w-[3px]",
                "before:rounded-r-pill before:bg-accent before:content-['']",
              )
            : "text-text-secondary hover:bg-subtle hover:text-text-primary",
        )
      }
    >
      <Icono className="h-5 w-5 shrink-0" aria-hidden={true} />
      {colapsado ? null : <span>{item.etiqueta}</span>}
    </NavLink>
  )

  if (!colapsado) {
    return enlace
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild={true}>{enlace}</TooltipTrigger>
      <TooltipPortal>
        <TooltipContent
          side="right"
          sideOffset={8}
          className="rounded-md bg-text-primary px-2 py-1 text-caption text-surface shadow-md"
        >
          {item.etiqueta}
          <TooltipArrow className="fill-text-primary" />
        </TooltipContent>
      </TooltipPortal>
    </Tooltip>
  )
}
