import { RUTAS } from "@/shared/constants/rutas"
import { cn } from "@/shared/lib/cn"
import type { NotificacionResumen } from "@nexott-learn/shared-types"
import { Popover, PopoverContent, PopoverPortal, PopoverTrigger } from "@radix-ui/react-popover"
import { Bell } from "lucide-react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import type { CopyNotif } from "../copy-notificacion"
import { useMarcarNotificacionLeida, useMarcarTodasLeidas } from "../hooks/use-marcar-leida"
import { useNotificacionesBadge } from "../hooks/use-notificaciones-badge"
import { useNotificacionesNoLeidas } from "../hooks/use-notificaciones-no-leidas"
import { ItemNotificacion } from "./item-notificacion"

/**
 * Campanita compartida entre `ParticipanteTopbar` y `AdminTopbar`. Click abre
 * popover con top 5 no leidas (`useNotificacionesNoLeidas`). Click en una
 * notificacion ejecuta su CTA (segun `copy-notificacion`) y la marca leida.
 * "Ver todas" navega al centro `/notificaciones`.
 *
 * El popover NO trae payload del backend (el listado resumido no lo incluye
 * — decision D-S10-C6); por eso los items del popover no muestran CTA
 * inline. Para el detalle real (incluido CTA) se usa la pagina del centro.
 */
export function CampanitaNotificaciones() {
  const navigate = useNavigate()
  const [abierto, setAbierto] = useState(false)
  const badge = useNotificacionesBadge()
  const noLeidas = useNotificacionesNoLeidas(5)
  const marcarLeida = useMarcarNotificacionLeida()
  const marcarTodas = useMarcarTodasLeidas()

  const noLeidasCount = badge.data?.noLeidas ?? 0
  const tieneNoLeidas = noLeidasCount > 0

  const onClickNotif = (notif: NotificacionResumen, _copy: CopyNotif): void => {
    // El listado resumido NO trae payload — solo marcamos leida y vamos al
    // centro para que el usuario vea el detalle/cta. Cuando el backend
    // permita incluir payload en el resumen, evaluamos navegar al destino
    // directo del CTA.
    marcarLeida.mutate(notif.id)
    setAbierto(false)
    navigate(RUTAS.notificaciones)
  }

  return (
    <Popover open={abierto} onOpenChange={setAbierto}>
      <PopoverTrigger asChild={true}>
        <button
          type="button"
          aria-label={
            tieneNoLeidas
              ? `Notificaciones — ${noLeidasCount} sin leer`
              : "Notificaciones — sin novedades"
          }
          className={cn(
            "relative inline-flex h-9 w-9 items-center justify-center rounded-md",
            "text-text-tertiary transition-colors duration-base ease-default",
            "hover:bg-subtle hover:text-text-secondary",
            "focus-visible:bg-subtle focus-visible:text-text-secondary focus-visible:outline-none",
            tieneNoLeidas ? "text-text-primary" : "",
          )}
        >
          <Bell className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
          {tieneNoLeidas ? (
            <span
              aria-hidden={true}
              className="absolute top-1 right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-aurora-violet px-1 font-medium font-mono text-[10px] text-white tabular-nums leading-none"
            >
              {noLeidasCount > 9 ? "9+" : noLeidasCount}
            </span>
          ) : null}
        </button>
      </PopoverTrigger>
      <PopoverPortal>
        <PopoverContent
          side="bottom"
          align="end"
          sideOffset={8}
          collisionPadding={16}
          className="nx-motion-popover z-popover w-[360px] overflow-hidden rounded-xl border border-border bg-surface shadow-overlay"
        >
          <header className="flex items-center justify-between gap-2 border-border border-b px-4 py-3">
            <span className="nx-eyebrow text-text-tertiary">
              {tieneNoLeidas ? `Notificaciones · ${noLeidasCount} sin leer` : "Notificaciones"}
            </span>
            {tieneNoLeidas ? (
              <button
                type="button"
                onClick={() => marcarTodas.mutate()}
                className="text-caption text-text-tertiary underline-offset-4 transition-colors duration-base ease-default hover:text-text-secondary hover:underline"
              >
                Marcar todas
              </button>
            ) : null}
          </header>

          {noLeidas.isLoading ? (
            <p className="px-4 py-6 text-body-sm text-text-tertiary">Cargando…</p>
          ) : (noLeidas.data?.data.length ?? 0) === 0 ? (
            <p className="px-4 py-6 text-body-sm text-text-tertiary">
              No hay notificaciones nuevas.
            </p>
          ) : (
            <ul className="flex max-h-[60vh] flex-col overflow-y-auto">
              {noLeidas.data?.data.map((notif) => (
                <ItemNotificacion
                  key={notif.id}
                  notificacion={notif}
                  onClick={onClickNotif}
                  variante="popover"
                />
              ))}
            </ul>
          )}

          <footer className="flex justify-end border-border border-t bg-subtle/40 px-4 py-2">
            <button
              type="button"
              onClick={() => {
                setAbierto(false)
                navigate(RUTAS.notificaciones)
              }}
              className="text-accent text-body-sm hover:underline"
            >
              Ver todas →
            </button>
          </footer>
        </PopoverContent>
      </PopoverPortal>
    </Popover>
  )
}
