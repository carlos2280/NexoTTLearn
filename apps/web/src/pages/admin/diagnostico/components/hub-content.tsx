import { EmptyState } from "@/shared/ui/patterns/empty-state"
import { Skeleton } from "@/shared/ui/patterns/skeleton"
import { Button } from "@/shared/ui/primitives/button"
import type { HubDiagnosticoItem } from "@nexott-learn/shared-types"
import { CheckCircle2, ChevronDown, Compass, RefreshCw } from "lucide-react"
import { useState } from "react"
import { TarjetaCursoHub } from "./tarjeta-curso-hub"

interface HubContentProps {
  readonly items: readonly HubDiagnosticoItem[]
  readonly isLoading: boolean
  readonly isError: boolean
  readonly onRetry: () => void
  readonly onIr: (item: HubDiagnosticoItem) => void
  readonly onIrSeguimiento: () => void
}

export function HubContent({
  items,
  isLoading,
  isError,
  onRetry,
  onIr,
  onIrSeguimiento,
}: HubContentProps) {
  if (isLoading) {
    return <SkeletonGrid />
  }
  if (isError) {
    return (
      <EmptyState
        icon={Compass}
        title="No pudimos cargar el hub"
        description="Reintenta o vuelve más tarde."
        action={
          <Button variant="secondary" size="sm" onClick={onRetry}>
            <RefreshCw className="size-4" strokeWidth={2} aria-hidden="true" />
            Reintentar
          </Button>
        }
      />
    )
  }

  const conInvitados = items.filter((item) => item.estadoDiagnostico !== "sin-invitados")
  const sinInvitados = items.filter((item) => item.estadoDiagnostico === "sin-invitados")
  const haypendientes = conInvitados.some((item) => item.estadoDiagnostico === "pendiente")

  if (conInvitados.length === 0 && sinInvitados.length === 0) {
    return (
      <EmptyState
        icon={CheckCircle2}
        title="No hay diagnósticos pendientes"
        description="Todos tus cursos activos tienen candidatos invitados, evaluados y asignados."
        action={
          <Button variant="secondary" size="sm" onClick={onIrSeguimiento}>
            Ver Seguimiento
          </Button>
        }
      />
    )
  }

  return (
    <div className="flex flex-col gap-8">
      {conInvitados.length > 0 ? (
        <Grid items={conInvitados} onIr={onIr} />
      ) : (
        <EmptyState
          variant="inline"
          icon={CheckCircle2}
          title={haypendientes ? "Sin pendientes urgentes" : "Sin cursos con candidatos invitados"}
          description="Los cursos sin invitados aparecen abajo."
        />
      )}
      {sinInvitados.length > 0 ? <SinInvitadosBlock items={sinInvitados} onIr={onIr} /> : null}
    </div>
  )
}

function Grid({
  items,
  onIr,
}: {
  readonly items: readonly HubDiagnosticoItem[]
  readonly onIr: (item: HubDiagnosticoItem) => void
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <TarjetaCursoHub key={item.cursoId} item={item} onIr={onIr} />
      ))}
    </div>
  )
}

function SinInvitadosBlock({
  items,
  onIr,
}: {
  readonly items: readonly HubDiagnosticoItem[]
  readonly onIr: (item: HubDiagnosticoItem) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <section className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-left text-sm text-text-secondary hover:text-text-primary"
      >
        <ChevronDown
          className={`size-4 transition-transform ${open ? "" : "-rotate-90"}`}
          strokeWidth={1.75}
          aria-hidden="true"
        />
        Cursos sin candidatos invitados ({items.length})
      </button>
      {open ? <Grid items={items} onIr={onIr} /> : null}
    </section>
  )
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-48 w-full rounded-[var(--radius-lg)]" />
      ))}
    </div>
  )
}
