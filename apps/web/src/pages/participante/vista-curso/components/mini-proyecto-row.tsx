import type { VistaMiniProyecto } from "@nexott-learn/shared-types"
import { CheckCircle2, ChevronRight, Clock, Lock, Rocket, XCircle } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Link } from "react-router-dom"
import { miniProyectoIconColor } from "./modulo-presets"

interface MiniProyectoRowProps {
  readonly mini: VistaMiniProyecto
}

// §4.3.4 sub-fila del mini proyecto del modulo. Indentado 48px para alinear
// con el body del modulo. Bloqueado: NO navega.
export function MiniProyectoRow({ mini }: MiniProyectoRowProps) {
  const Icono = iconoMini(mini.estado)
  const colorIcono = miniProyectoIconColor(mini.estado)
  const navegable = mini.href !== null && mini.estado !== "BLOQUEADO"

  const inner = (
    <div className="flex items-center gap-2 border-glass-border border-t pt-3 pl-[60px]">
      <Icono className={`size-4 shrink-0 ${colorIcono}`} strokeWidth={1.75} />
      <span className="min-w-0 flex-1 truncate text-[13px] text-text-secondary">
        Mini Proyecto:{" "}
        <span className={mini.titulo.length === 0 ? "text-text-muted italic" : "text-text-primary"}>
          {mini.titulo.length === 0 ? "Sin titulo" : mini.titulo}
        </span>{" "}
        <span className={colorIcono}>· {mini.textoEstado}</span>
      </span>
      {navegable ? (
        <ChevronRight
          className="size-4 shrink-0 text-brand-violet transition-transform group-hover/mini:translate-x-[2px]"
          strokeWidth={2}
        />
      ) : null}
    </div>
  )

  if (!navegable || mini.href === null) {
    return <div className="px-5 pb-3">{inner}</div>
  }
  return (
    <Link
      to={mini.href}
      className="group/mini block px-5 pb-3 transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-violet/40"
    >
      {inner}
    </Link>
  )
}

function iconoMini(estado: VistaMiniProyecto["estado"]): LucideIcon {
  switch (estado) {
    case "BLOQUEADO":
      return Lock
    case "DISPONIBLE":
      return Rocket
    case "EN_REVISION":
      return Clock
    case "APROBADO":
      return CheckCircle2
    case "REPROBADO":
      return XCircle
    default: {
      const _exhaustive: never = estado
      return _exhaustive
    }
  }
}
