import { cn } from "@/shared/lib/cn"
import { relativizarFecha } from "@/shared/lib/relativizar-fecha"
import type { NotificacionResumen } from "@nexott-learn/shared-types"
import { ArrowUpRight } from "lucide-react"
import { type CopyNotif, type TonoNotif, copyParaTipo } from "../copy-notificacion"

interface ItemNotificacionProps {
  readonly notificacion: NotificacionResumen
  /**
   * Payload completo del backend cuando esta disponible (centro). El popover
   * trabaja con resumenes sin payload — los CTAs quedan sin ruta y el item
   * sigue siendo marcable como leido/archivado.
   */
  readonly payload?: Record<string, unknown>
  readonly onClick: (notificacion: NotificacionResumen, copy: CopyNotif) => void
  readonly variante: "popover" | "centro"
  readonly acciones?: {
    readonly onMarcarLeida?: () => void
    readonly onArchivar?: () => void
  }
}

const DOT_COLOR: Record<TonoNotif, string> = {
  neutral: "bg-aurora-violet",
  info: "bg-aurora-cyan",
  warning: "bg-warning",
}

export function ItemNotificacion({
  notificacion,
  payload,
  onClick,
  variante,
  acciones,
}: ItemNotificacionProps) {
  const copy = copyParaTipo(notificacion.tipoEvento)
  const ruta = payload ? copy.cta.ruta(payload) : null
  const subtitulo = variante === "centro" && payload ? (copy.subtitulo?.(payload) ?? null) : null

  return (
    <li
      className={cn(
        "flex flex-col gap-1.5 px-4 py-3 transition-colors duration-base ease-default",
        variante === "centro" ? "border-border border-b last:border-b-0" : "",
        !notificacion.leida && variante === "popover" ? "bg-subtle/50" : "",
      )}
    >
      <CuerpoItem
        notificacion={notificacion}
        copy={copy}
        subtitulo={subtitulo}
        ctaTexto={ruta !== null ? copy.cta.texto : null}
        onClick={() => onClick(notificacion, copy)}
      />
      {variante === "centro" && acciones ? (
        <AccionesItem notificacion={notificacion} acciones={acciones} />
      ) : null}
    </li>
  )
}

interface CuerpoItemProps {
  readonly notificacion: NotificacionResumen
  readonly copy: CopyNotif
  readonly subtitulo: string | null
  readonly ctaTexto: string | null
  readonly onClick: () => void
}

function CuerpoItem({ notificacion, copy, subtitulo, ctaTexto, onClick }: CuerpoItemProps) {
  const fecha = relativizarFecha(notificacion.fechaCreacion)
  const dotClase = notificacion.leida ? "bg-border-strong" : DOT_COLOR[copy.tono]
  return (
    <button
      type="button"
      onClick={onClick}
      className="-mx-2 -my-1 flex items-start gap-3 rounded-md px-2 py-1 text-left transition-colors duration-base ease-default hover:bg-subtle focus-visible:bg-subtle focus-visible:outline-none"
    >
      <span
        aria-hidden={true}
        className={cn("mt-1.5 block h-2 w-2 shrink-0 rounded-full", dotClase)}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span
          className={cn(
            "text-body-sm",
            notificacion.leida ? "text-text-secondary" : "font-medium text-text-primary",
          )}
        >
          {copy.titulo}
        </span>
        {subtitulo ? <span className="text-caption text-text-tertiary">{subtitulo}</span> : null}
        <span className="text-caption text-text-tertiary">{fecha}</span>
      </div>
      {ctaTexto !== null ? (
        <span
          aria-hidden={true}
          className="mt-0.5 inline-flex items-center gap-1 text-accent text-caption"
        >
          {ctaTexto}
          <ArrowUpRight className="h-3 w-3" strokeWidth={1.5} />
        </span>
      ) : null}
    </button>
  )
}

interface AccionesItemProps {
  readonly notificacion: NotificacionResumen
  readonly acciones: {
    readonly onMarcarLeida?: () => void
    readonly onArchivar?: () => void
  }
}

function AccionesItem({ notificacion, acciones }: AccionesItemProps) {
  const mostrarMarcar = !notificacion.leida && acciones.onMarcarLeida !== undefined
  const mostrarArchivar = !notificacion.archivada && acciones.onArchivar !== undefined
  if (!(mostrarMarcar || mostrarArchivar)) {
    return null
  }
  return (
    <div className="flex items-center gap-3 pl-5 text-caption">
      {mostrarMarcar ? (
        <button
          type="button"
          onClick={acciones.onMarcarLeida}
          className="text-text-tertiary underline-offset-4 transition-colors duration-base ease-default hover:text-text-secondary hover:underline"
        >
          Marcar leída
        </button>
      ) : null}
      {mostrarArchivar ? (
        <button
          type="button"
          onClick={acciones.onArchivar}
          className="text-text-tertiary underline-offset-4 transition-colors duration-base ease-default hover:text-text-secondary hover:underline"
        >
          Archivar
        </button>
      ) : null}
    </div>
  )
}
