import { useBandeja } from "@/features/participante-bandeja/hooks/use-bandeja"
import { ApiError } from "@/shared/api/api-error"
import { EmptyState } from "@/shared/ui/patterns/empty-state"
import { Skeleton } from "@/shared/ui/patterns/skeleton"
import { Button } from "@/shared/ui/primitives/button"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { BandejaCuerpo } from "./components/bandeja-cuerpo"
import { BandejaExpedienteFooter } from "./components/bandeja-expediente-footer"
import { BandejaHeroBlock } from "./components/bandeja-hero"

// Landing post-login del PARTICIPANTE.
// Doc canonico: DOCUMENTOS/doc/v2/3-pantallas/participante/bandeja/bandeja.md
// Fase 3: ramifica el cuerpo segun bandeja.estado (§6 estados especiales).
export function BandejaParticipantePage() {
  const bandeja = useBandeja()

  if (bandeja.isLoading) {
    return <BandejaSkeleton />
  }

  if (bandeja.isError) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="No pudimos cargar tu bandeja"
        description={mensajeError(bandeja.error)}
        action={
          <Button
            onClick={() => bandeja.refetch()}
            loading={bandeja.isFetching}
            variant="secondary"
          >
            <RefreshCw className="size-4" strokeWidth={1.75} />
            Reintentar
          </Button>
        }
      />
    )
  }

  if (!bandeja.data) {
    return null
  }

  const { estado, hero, siguientePaso, stream, expediente } = bandeja.data
  // §6.1: si nunca tuvo cursos en histórico, ocultamos el footer del expediente.
  const mostrarFooter =
    estado !== "VACIO" || expediente.cursosCompletados > 0 || expediente.cursosEnCurso > 0

  return (
    <div className="mx-auto flex w-full max-w-[860px] flex-col">
      <BandejaHeroBlock hero={hero} />
      <BandejaCuerpo estado={estado} siguientePaso={siguientePaso} stream={stream} />
      {mostrarFooter ? <BandejaExpedienteFooter expediente={expediente} /> : null}
    </div>
  )
}

// Skeleton que predice el layout final (hero + card siguiente paso + tabs +
// 3 stream rows + footer). Evita layout shift al hidratar.
function BandejaSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-[860px] flex-col" aria-busy="true" aria-live="polite">
      <div className="flex flex-col gap-3 py-12 md:py-16">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-16 w-64 md:h-20" />
        <Skeleton className="mt-2 h-5 w-80" />
      </div>

      <div className="flex items-stretch gap-5 rounded-[20px] border border-glass-border bg-surface-1 p-5">
        <Skeleton className="size-24 shrink-0 rounded-2xl" />
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-6 w-3/5" />
          <Skeleton className="h-4 w-2/5" />
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-4">
        <Skeleton className="h-3 w-24" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-28 rounded-full" />
          <Skeleton className="h-8 w-28 rounded-full" />
        </div>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex items-stretch gap-4 overflow-hidden rounded-2xl border border-glass-border bg-surface-1"
          >
            <Skeleton className="w-14 shrink-0 rounded-none" />
            <div className="flex min-w-0 flex-1 items-center gap-3 py-3 pr-3">
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <Skeleton className="h-4 w-3/5" />
                <Skeleton className="h-3 w-2/5" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function mensajeError(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message
  }
  return "Intentalo de nuevo en unos segundos."
}
