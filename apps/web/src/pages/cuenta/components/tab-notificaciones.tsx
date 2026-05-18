import { copyParaTipo } from "@/features/notificaciones/copy-notificacion"
import { useActualizarPreferenciasNotificacion } from "@/features/notificaciones/hooks/use-actualizar-preferencias"
import { usePreferenciasNotificacion } from "@/features/notificaciones/hooks/use-preferencias-notificacion"
import { ApiError } from "@/shared/api/api-error"
import { Banner } from "@/shared/components/ui/banner"
import { Skeleton } from "@/shared/components/ui/skeleton"
import { cn } from "@/shared/lib/cn"
import type { TipoEventoNotif } from "@nexott-learn/shared-types"
import { Bell, Lock } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

const TIPOS_PARTICIPANTE: readonly TipoEventoNotif[] = [
  "PLAN_RECALCULADO",
  "RECORDATORIO_DEADLINE",
  "TRANSVERSAL_DISPONIBLE",
  "ENTREVISTA_IA_DISPONIBLE",
  "CURSO_DEADLINE",
  "ASIGNACION_CURSO",
  "CASO_REABIERTO",
  "RESULTADO_CIERRE",
]

export function TabNotificaciones() {
  const { data, isLoading, error } = usePreferenciasNotificacion()
  const mutacion = useActualizarPreferenciasNotificacion()
  const [silenciadosOptimista, setSilenciadosOptimista] =
    useState<ReadonlySet<TipoEventoNotif> | null>(null)

  if (isLoading || !data) {
    if (error instanceof ApiError) {
      return <Banner tone="danger">{error.message}</Banner>
    }
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    )
  }

  const silenciados = silenciadosOptimista ?? new Set(data.silenciados)
  const tiposCriticosSet = new Set(data.tiposCriticos)
  const silenciables = TIPOS_PARTICIPANTE.filter((t) => !tiposCriticosSet.has(t))
  const criticos = TIPOS_PARTICIPANTE.filter((t) => tiposCriticosSet.has(t))

  async function alternarSilencio(tipo: TipoEventoNotif): Promise<void> {
    const yaSilenciado = silenciados.has(tipo)
    const siguiente = new Set(silenciados)
    if (yaSilenciado) {
      siguiente.delete(tipo)
    } else {
      siguiente.add(tipo)
    }
    setSilenciadosOptimista(siguiente)

    try {
      await mutacion.mutateAsync(
        yaSilenciado
          ? { silenciar: [], desilenciar: [tipo] }
          : { silenciar: [tipo], desilenciar: [] },
      )
      setSilenciadosOptimista(null)
    } catch (err) {
      setSilenciadosOptimista(null)
      const mensaje = err instanceof ApiError ? err.message : "No se pudo guardar tu preferencia."
      toast.error(mensaje)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-5 rounded-lg border border-border bg-surface p-5">
        <header className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent-on-soft">
            <Bell className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
          </div>
          <div className="flex flex-col">
            <h2 className="text-h3 text-text-primary">Preferencias de notificación</h2>
            <p className="text-body-sm text-text-secondary">
              Recibes todas las notificaciones en la aplicación. Algunas también llegan por correo:
              aquí decides cuáles.
            </p>
          </div>
        </header>

        <fieldset className="flex flex-col gap-2">
          <legend className="nx-eyebrow mb-2 text-text-tertiary">
            Silenciar correo para estos eventos
          </legend>
          {silenciables.map((tipo) => (
            <ItemSilenciable
              key={tipo}
              tipo={tipo}
              silenciado={silenciados.has(tipo)}
              onAlternar={() => alternarSilencio(tipo)}
            />
          ))}
        </fieldset>

        <div className="-mx-5 border-border border-t" />

        <div className="flex flex-col gap-2">
          <p className="nx-eyebrow text-text-tertiary">Eventos críticos (no se pueden silenciar)</p>
          <ul className="flex flex-col gap-1.5">
            {criticos.map((tipo) => (
              <ItemCritico key={tipo} tipo={tipo} />
            ))}
          </ul>
          <p className="mt-1 flex items-center gap-1.5 text-caption text-text-tertiary">
            <Lock className="h-3 w-3" strokeWidth={1.5} aria-hidden={true} />
            Garantizan que no te pierdes lo que afecta a tu plan.
          </p>
        </div>
      </section>
    </div>
  )
}

interface ItemSilenciableProps {
  readonly tipo: TipoEventoNotif
  readonly silenciado: boolean
  readonly onAlternar: () => void
}

function ItemSilenciable({ tipo, silenciado, onAlternar }: ItemSilenciableProps) {
  const copy = copyParaTipo(tipo)
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-md border border-transparent px-2 py-2",
        "transition-colors duration-base ease-default hover:bg-subtle",
        "focus-within:outline-2 focus-within:outline-accent focus-within:outline-offset-2",
      )}
    >
      <input
        type="checkbox"
        checked={!silenciado}
        onChange={onAlternar}
        className="h-4 w-4 cursor-pointer accent-accent"
      />
      <span className="text-body-sm text-text-primary">{copy.titulo}</span>
      {silenciado ? (
        <span className="ml-auto text-caption text-text-tertiary">Solo en la app</span>
      ) : null}
    </label>
  )
}

interface ItemCriticoProps {
  readonly tipo: TipoEventoNotif
}

function ItemCritico({ tipo }: ItemCriticoProps) {
  const copy = copyParaTipo(tipo)
  const colorPunto =
    copy.tono === "warning" ? "bg-warning" : copy.tono === "info" ? "bg-info" : "bg-text-tertiary"
  return (
    <li className="flex items-center gap-3 px-2 py-1.5">
      <span
        className={cn("inline-block h-1.5 w-1.5 shrink-0 rounded-full", colorPunto)}
        aria-hidden={true}
      />
      <span className="text-body-sm text-text-secondary">{copy.titulo}</span>
    </li>
  )
}
