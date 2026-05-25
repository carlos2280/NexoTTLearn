import { ItemNotificacion } from "@/features/notificaciones/components/item-notificacion"
import type { CopyNotif } from "@/features/notificaciones/copy-notificacion"
import { useArchivarNotificacion } from "@/features/notificaciones/hooks/use-archivar-notificacion"
import { useMarcarNotificacionLeida } from "@/features/notificaciones/hooks/use-marcar-leida"
import { useObtenerNotificacion } from "@/features/notificaciones/hooks/use-obtener-notificacion"
import type { NotificacionResumen } from "@nexott-learn/shared-types"
import { useNavigate } from "react-router-dom"

interface ItemCentroNotificacionProps {
  readonly notificacion: NotificacionResumen
}

/**
 * Item del centro `/notificaciones`. Hace un fetch al detalle del backend
 * para componer el CTA real con `payload`. Cuando el backend permita incluir
 * `payload` en el listado, este hook por item se elimina y el centro pasa a
 * trabajar con resumenes solos (un solo round-trip).
 *
 * Tanstack Query cachea por id; navegar y volver al centro no re-disparara
 * la red.
 */
export function ItemCentroNotificacion({ notificacion }: ItemCentroNotificacionProps) {
  const detalle = useObtenerNotificacion(notificacion.id)
  const marcarLeida = useMarcarNotificacionLeida()
  const archivar = useArchivarNotificacion()
  const navigate = useNavigate()

  const onClick = (notif: NotificacionResumen, copy: CopyNotif): void => {
    if (!notif.leida) {
      marcarLeida.mutate(notif.id)
    }
    const ruta = detalle.data ? copy.cta.ruta(detalle.data.payload) : null
    if (ruta) {
      navigate(ruta)
    }
  }

  return (
    <ItemNotificacion
      notificacion={notificacion}
      payload={detalle.data?.payload}
      onClick={onClick}
      variante="centro"
      acciones={{
        onMarcarLeida: notificacion.leida ? undefined : () => marcarLeida.mutate(notificacion.id),
        onArchivar: notificacion.archivada ? undefined : () => archivar.mutate(notificacion.id),
      }}
    />
  )
}
