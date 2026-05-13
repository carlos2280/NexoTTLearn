import { useMarcarTodasLeidas } from "@/features/notificaciones/hooks/use-marcar-leida"
import { Button } from "@/shared/components/ui/button"
import { cn } from "@/shared/lib/cn"
import { tiempoRelativo } from "@/shared/lib/tiempo-relativo"
import type { NotificacionResumen } from "@nexott-learn/shared-types"
import { obtenerCopyNotificacion } from "../lib/copy-notificacion"
import { FilaNovedad } from "./fila-novedad"

interface BandaNovedadesProps {
  readonly notificaciones: readonly NotificacionResumen[]
  readonly totalNoLeidas: number
}

export function BandaNovedades({ notificaciones, totalNoLeidas }: BandaNovedadesProps) {
  const marcarTodas = useMarcarTodasLeidas()

  if (notificaciones.length === 0) {
    return null
  }

  const restantes = Math.max(0, totalNoLeidas - notificaciones.length)

  return (
    <section aria-labelledby="banda-novedades-titulo" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 id="banda-novedades-titulo" className="text-h3 text-text-primary">
          Novedades <span className="text-text-tertiary">({totalNoLeidas})</span>
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => marcarTodas.mutate()}
          disabled={marcarTodas.isPending}
        >
          Marcar todo como leído
        </Button>
      </div>
      <ul className="flex flex-col gap-1">
        {notificaciones.map((notif) => {
          const copy = obtenerCopyNotificacion(notif.tipoEvento)
          return (
            <FilaNovedad
              key={notif.id}
              notificacionId={notif.id}
              texto={copy.texto}
              ctaLabel={copy.cta}
              tiempoTexto={tiempoRelativo(notif.fechaCreacion)}
              esCritico={notif.esCritico}
            />
          )
        })}
      </ul>
      {restantes > 0 ? (
        <p className={cn("text-caption text-text-tertiary")}>+ {restantes} más sin leer</p>
      ) : null}
    </section>
  )
}
