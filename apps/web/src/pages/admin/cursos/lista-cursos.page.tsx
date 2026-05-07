import { useCursos } from "@/features/admin-cursos/hooks/use-cursos"
import { ApiError } from "@/shared/api/api-error"
import { RUTAS } from "@/shared/constants/rutas"
import { ConfirmDialog } from "@/shared/ui/patterns/confirm-dialog"
import { EmptyState } from "@/shared/ui/patterns/empty-state"
import { PageHeader } from "@/shared/ui/patterns/page-header"
import { SearchInput } from "@/shared/ui/patterns/search-input"
import { SegmentedControl, type SegmentedOption } from "@/shared/ui/patterns/segmented-control"
import { Toolbar } from "@/shared/ui/patterns/toolbar"
import { Button } from "@/shared/ui/primitives/button"
import type { CursoListItem, FiltroEstadoCurso } from "@nexott-learn/shared-types"
import { TooltipProvider } from "@radix-ui/react-tooltip"
import { LayoutGrid, List, Lock, Plus, RefreshCw } from "lucide-react"
import { useCallback, useState } from "react"
import { useNavigate } from "react-router-dom"
import { CrearCursoDialog } from "./components/crear-curso-dialog"
import { CursosContent } from "./components/cursos-content"
import { useAccionesCurso } from "./hooks/use-acciones-curso"
import { useFiltrosCursos } from "./hooks/use-filtros-cursos"
import { useShortcut } from "./hooks/use-shortcut"

const ESTADO_OPTIONS: readonly SegmentedOption<FiltroEstadoCurso>[] = [
  { value: "all", label: "Todos" },
  { value: "BORRADOR", label: "Borradores" },
  { value: "ACTIVO", label: "Activos" },
  { value: "CERRADO", label: "Cerrados" },
]

const VIEW_OPTIONS = [
  { value: "cards" as const, label: "Tarjetas", icon: LayoutGrid, hideLabel: true },
  { value: "table" as const, label: "Tabla", icon: List, hideLabel: true },
]

interface CreateConfig {
  readonly mode: "scratch" | "duplicate"
  readonly duplicateFromId?: string
}

export function ListaCursosPage() {
  const navigate = useNavigate()
  const filters = useFiltrosCursos()
  const actions = useAccionesCurso()

  const { data, isLoading, isFetching, isError, error, refetch } = useCursos(filters.query)
  const items: readonly CursoListItem[] = data?.items ?? []
  const total = data?.total ?? 0

  const [createConfig, setCreateConfig] = useState<CreateConfig | undefined>()
  const openCreate = useCallback(() => setCreateConfig({ mode: "scratch" }), [])
  const openDuplicate = useCallback(
    (curso: CursoListItem) => setCreateConfig({ mode: "duplicate", duplicateFromId: curso.id }),
    [],
  )

  useShortcut("n", openCreate, !createConfig)

  const goToEditor = useCallback(
    (curso: CursoListItem) => navigate(RUTAS.admin.cursoEditor(curso.id)),
    [navigate],
  )
  const goToSeguimiento = useCallback(
    (curso: CursoListItem) => navigate(`${RUTAS.admin.seguimiento}?curso=${curso.id}`),
    [navigate],
  )
  const goToCandidatos = useCallback(
    (curso: CursoListItem) => navigate(RUTAS.admin.cursoCandidatos(curso.id)),
    [navigate],
  )

  if (error instanceof ApiError && error.status === 403) {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <EmptyState
          icon={Lock}
          title="Acceso restringido"
          description="Tu cuenta no tiene permisos para administrar cursos."
        />
      </main>
    )
  }

  const showSkeleton = isLoading
  const showEmptyAll = !isLoading && items.length === 0 && !filters.hasActiveFilters && !isError
  const showNoResults = !isLoading && items.length === 0 && filters.hasActiveFilters && !isError

  return (
    <TooltipProvider delayDuration={200}>
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 md:py-10 lg:px-8">
        <div className="flex flex-col gap-8">
          <PageHeader
            eyebrow="Admin"
            title="Cursos"
            subtitle="Cada curso es la solicitud de un cliente. Define áreas, asigna candidatos y nivélalos hasta la entrevista."
            actions={
              <Button onClick={openCreate}>
                <Plus className="size-4" strokeWidth={2} aria-hidden="true" />
                Nuevo curso
                <kbd className="ml-1 hidden rounded-[var(--radius-xs)] border border-white/20 bg-white/10 px-1.5 py-0.5 font-mono text-[10px] sm:inline">
                  N
                </kbd>
              </Button>
            }
          />

          <Toolbar
            search={
              <SearchInput
                value={filters.busquedaInput}
                onChange={filters.setBusquedaInput}
                placeholder="Buscar curso o cliente..."
                globalShortcut={true}
                aria-label="Buscar cursos"
              />
            }
            filters={
              <SegmentedControl<FiltroEstadoCurso>
                value={filters.estado}
                onChange={filters.setEstado}
                options={ESTADO_OPTIONS}
                ariaLabel="Filtrar por estado"
                size="sm"
              />
            }
            viewToggle={
              <SegmentedControl
                value={filters.view}
                onChange={filters.setView}
                options={VIEW_OPTIONS}
                ariaLabel="Cambiar vista"
                size="sm"
              />
            }
          />

          <ResultsMeta
            total={total}
            visible={items.length}
            hasFilters={filters.hasActiveFilters}
            isFetching={isFetching && !isLoading}
          />

          <CursosContent
            items={items}
            view={filters.view}
            isLoading={showSkeleton}
            isError={isError}
            error={error}
            isEmpty={showEmptyAll}
            isNoResults={showNoResults}
            onRetry={refetch}
            onClearFilters={filters.clear}
            onCreate={openCreate}
            onOpen={goToEditor}
            onEdit={goToEditor}
            onDuplicate={openDuplicate}
            onSeguimiento={goToSeguimiento}
            onCandidatos={goToCandidatos}
            onUnpublish={actions.requestUnpublish}
            onClose={actions.requestClose}
            onDelete={actions.requestDelete}
          />
        </div>

        <CrearCursoDialog
          open={createConfig !== undefined}
          onOpenChange={(open) => {
            if (!open) {
              setCreateConfig(undefined)
            }
          }}
          initialMode={createConfig?.mode ?? "scratch"}
          initialDuplicateFromId={createConfig?.duplicateFromId}
        />

        <ConfirmDialog
          open={actions.transition !== undefined}
          onOpenChange={(open) => {
            if (!open) {
              actions.cancelTransition()
            }
          }}
          tone="warning"
          title={
            actions.transition?.variant === "close"
              ? `Cerrar ${actions.transition.curso.titulo}`
              : `Despublicar ${actions.transition?.curso.titulo ?? ""}`
          }
          description={
            actions.transition?.variant === "close"
              ? "El curso pasará a estado cerrado. Las inscripciones activas se cerrarán y no se podrá editar el contenido."
              : "El curso volverá a estado borrador. Conservará todo su contenido y candidatos, pero dejará de estar activo."
          }
          confirmLabel={actions.transition?.variant === "close" ? "Cerrar curso" : "Despublicar"}
          reasonLabel="Motivo (opcional)"
          loading={actions.transitionPending}
          onConfirm={(motivo) => actions.confirmTransition(motivo)}
        />

        <ConfirmDialog
          open={actions.toDelete !== undefined}
          onOpenChange={(open) => {
            if (!open) {
              actions.cancelDelete()
            }
          }}
          tone="danger"
          title={`Eliminar ${actions.toDelete?.titulo ?? ""}`}
          description="Esta acción no se puede deshacer. El borrador se eliminará permanentemente."
          confirmLabel="Eliminar curso"
          loading={actions.deletePending}
          onConfirm={() => actions.confirmDelete()}
        />
      </main>
    </TooltipProvider>
  )
}

interface ResultsMetaProps {
  readonly total: number
  readonly visible: number
  readonly hasFilters: boolean
  readonly isFetching: boolean
}

function ResultsMeta({ total, visible, hasFilters, isFetching }: ResultsMetaProps) {
  if (visible === 0) {
    return null
  }
  return (
    <div className="-mt-2 flex items-center justify-between text-text-muted text-xs">
      <span>{hasFilters ? `${visible} de ${total} resultados` : `${total} cursos`}</span>
      {isFetching ? (
        <span className="inline-flex items-center gap-1.5">
          <RefreshCw className="size-3 animate-spin" strokeWidth={1.75} aria-hidden="true" />
          Actualizando
        </span>
      ) : null}
    </div>
  )
}
