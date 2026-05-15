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
import type { ParticipanteNavItem } from "../types"

interface ParticipanteNavItemProps {
  readonly item: ParticipanteNavItem
  readonly colapsado: boolean
}

export function ParticipanteNavItemRow({ item, colapsado }: ParticipanteNavItemProps) {
  const Icono = item.icono
  const esBandeja = item.ruta === RUTAS.bandeja

  const enlace = (
    <NavLink
      to={item.ruta}
      end={esBandeja}
      aria-label={colapsado ? item.etiqueta : undefined}
      className={({ isActive }) =>
        cn(
          "relative flex w-full items-center rounded-md py-2 text-body-sm",
          "transition-[background-color,color,box-shadow,transform] duration-fast ease-default",
          "focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2",
          colapsado ? "justify-center px-2" : "gap-3 px-3",
          isActive
            ? "bg-surface font-medium text-text-primary shadow-xs [&_svg]:text-accent"
            : cn(
                "text-text-secondary hover:bg-surface/60 hover:text-text-primary",
                colapsado ? "" : "hover:translate-x-0.5",
              ),
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
