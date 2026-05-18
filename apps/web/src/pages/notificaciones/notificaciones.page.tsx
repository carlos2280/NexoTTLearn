import { useMarcarTodasLeidas } from "@/features/notificaciones/hooks/use-marcar-leida"
import {
  type FiltroCentro,
  useNotificaciones,
} from "@/features/notificaciones/hooks/use-notificaciones"
import { useNotificacionesBadge } from "@/features/notificaciones/hooks/use-notificaciones-badge"
import { type TabItem, Tabs } from "@/shared/components/ui/tabs"
import { RUTAS } from "@/shared/constants/rutas"
import { ArrowUpRight } from "lucide-react"
import { useState } from "react"
import { Link } from "react-router-dom"
import { ItemCentroNotificacion } from "./components/item-centro-notificacion"
import { ETIQUETA_GRUPO, agruparTemporal } from "./notificaciones.helpers"

/**
 * Centro completo de notificaciones (spec 10 pieza 3). Tabs sobrios + lista
 * agrupada por bucket temporal (hoy / esta semana / anterior). Sin busqueda
 * y sin acciones bulk en MVP.
 *
 * Tab por defecto: "no-leidas" — al llegar el usuario quiere ver lo nuevo,
 * coherente con la ley "cumplido se desvanece, pendiente respira".
 */
export function NotificacionesPage() {
  const [filtro, setFiltro] = useState<FiltroCentro>("no-leidas")
  const notificaciones = useNotificaciones({ filtro })
  const badge = useNotificacionesBadge()
  const marcarTodas = useMarcarTodasLeidas()

  const noLeidas = badge.data?.noLeidas ?? 0
  const items = notificaciones.data?.data ?? []
  const grupos = agruparTemporal(items)

  const tabs: readonly TabItem<FiltroCentro>[] = [
    { id: "todas", etiqueta: "Todas" },
    { id: "no-leidas", etiqueta: "No leídas", contador: noLeidas > 0 ? noLeidas : undefined },
    { id: "archivadas", etiqueta: "Archivadas" },
  ]

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10 lg:px-8">
      <header className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="nx-eyebrow text-text-tertiary">Notificaciones</span>
            <h1 className="text-h1 text-text-primary">Tu centro de avisos</h1>
          </div>
          <Link
            to={RUTAS.cuenta}
            className="mt-2 inline-flex items-center gap-1 text-body-sm text-text-tertiary underline-offset-4 transition-colors duration-base ease-default hover:text-text-secondary hover:underline"
          >
            Preferencias
            <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden={true} />
          </Link>
        </div>
      </header>

      <div className="flex items-center justify-between gap-4">
        <Tabs
          items={tabs}
          activa={filtro}
          onCambiar={(id) => setFiltro(id)}
          etiquetaAria="Filtrar notificaciones"
          className="flex-1"
        />
        {filtro !== "archivadas" && noLeidas > 0 ? (
          <button
            type="button"
            onClick={() => marcarTodas.mutate()}
            className="shrink-0 text-body-sm text-text-tertiary underline-offset-4 transition-colors duration-base ease-default hover:text-text-secondary hover:underline"
          >
            Marcar todas como leídas
          </button>
        ) : null}
      </div>

      <ListadoCentro
        cargando={notificaciones.isLoading}
        error={notificaciones.error !== null}
        grupos={grupos}
        filtro={filtro}
      />
    </main>
  )
}

interface ListadoCentroProps {
  readonly cargando: boolean
  readonly error: boolean
  readonly grupos: ReturnType<typeof agruparTemporal>
  readonly filtro: FiltroCentro
}

function ListadoCentro({ cargando, error, grupos, filtro }: ListadoCentroProps) {
  if (cargando) {
    return <p className="py-12 text-center text-body-sm text-text-tertiary">Cargando…</p>
  }
  if (error) {
    return (
      <p className="py-12 text-center text-body-sm text-danger-on-soft">
        No pudimos cargar las notificaciones. Reintenta en un momento.
      </p>
    )
  }
  if (grupos.length === 0) {
    return <VacioCentro filtro={filtro} />
  }
  return (
    <div className="flex flex-col gap-8">
      {grupos.map(({ grupo, items }) => (
        <section key={grupo} className="flex flex-col gap-2" aria-labelledby={`grupo-${grupo}`}>
          <h2 id={`grupo-${grupo}`} className="nx-eyebrow text-text-tertiary">
            {ETIQUETA_GRUPO[grupo]}
          </h2>
          <ul className="flex flex-col rounded-xl border border-border bg-surface">
            {items.map((notif) => (
              <ItemCentroNotificacion key={notif.id} notificacion={notif} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

function VacioCentro({ filtro }: { readonly filtro: FiltroCentro }) {
  const mensaje =
    filtro === "no-leidas"
      ? "No tienes notificaciones sin leer."
      : filtro === "archivadas"
        ? "Aún no archivaste ninguna notificación."
        : "No hay notificaciones todavía."
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-subtle/40 px-6 py-12 text-center">
      <p className="text-body-sm text-text-secondary">{mensaje}</p>
    </div>
  )
}
