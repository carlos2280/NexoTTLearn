import { useAdminDashboard } from "@/features/admin-dashboard/hooks/use-dashboard"
import { useUsuarioActual } from "@/features/auth/hooks/use-usuario-actual"
import { ApiError } from "@/shared/api/api-error"
import { RUTAS } from "@/shared/constants/rutas"
import { EmptyState } from "@/shared/ui/patterns/empty-state"
import { PageHeader } from "@/shared/ui/patterns/page-header"
import { Button } from "@/shared/ui/primitives/button"
import { AlertTriangle, Plus, RefreshCw } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { ActividadFeed } from "./components/actividad-feed"
import { AlertasList } from "./components/alertas-list"
import { CentroRevisionBanner } from "./components/centro-revision-banner"
import { KpiGrid } from "./components/kpi-grid"

export function BandejaAdminPage() {
  const navigate = useNavigate()
  const { data: usuario } = useUsuarioActual()
  const dashboard = useAdminDashboard()

  if (!usuario) {
    return null
  }

  return (
    <div className="flex flex-col gap-8 px-6 py-8 md:px-10 md:py-10">
      <PageHeader
        eyebrow={saludoPorHora()}
        title={`Hola, ${usuario.nombre}`}
        subtitle={subtituloContextual(dashboard.data)}
        actions={
          <>
            <Button variant="secondary" size="md" onClick={() => navigate(RUTAS.admin.cursos)}>
              <Plus className="size-4" strokeWidth={1.75} />
              Nuevo curso
            </Button>
            <Button variant="ghost" size="md" onClick={() => navigate(RUTAS.admin.seguimiento)}>
              Seguimiento
            </Button>
          </>
        }
      />

      {dashboard.isError ? (
        <ErrorBlock
          message={mensajeError(dashboard.error)}
          onRetry={() => dashboard.refetch()}
          retrying={dashboard.isFetching}
        />
      ) : (
        <>
          <KpiGrid kpis={dashboard.data?.kpis} loading={dashboard.isLoading} />

          <CentroRevisionBanner cola={dashboard.data?.colaRevision} loading={dashboard.isLoading} />

          <section className="grid gap-6 lg:grid-cols-2">
            <AlertasList alertas={dashboard.data?.alertas} loading={dashboard.isLoading} />
            <ActividadFeed actividad={dashboard.data?.actividad} loading={dashboard.isLoading} />
          </section>
        </>
      )}
    </div>
  )
}

function saludoPorHora(): string {
  const h = new Date().getHours()
  if (h < 12) {
    return "Buenos dias"
  }
  if (h < 19) {
    return "Buenas tardes"
  }
  return "Buenas noches"
}

function subtituloContextual(data: ReturnType<typeof useAdminDashboard>["data"]): string {
  if (!data) {
    return "Estado del dia."
  }
  const cola = data.colaRevision
  const total = cola?.items.reduce((acc, item) => acc + item.count, 0) ?? 0
  if (total > 0) {
    return `Tienes ${total} ${total === 1 ? "item esperando" : "items esperando"} tu revision.`
  }
  if (data.alertas.length > 0) {
    return `Tienes ${data.alertas.length} ${data.alertas.length === 1 ? "alerta nueva" : "alertas nuevas"}.`
  }
  return "Todo en orden por aqui."
}

function mensajeError(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message
  }
  return "No pudimos cargar el dashboard."
}

function ErrorBlock({
  message,
  onRetry,
  retrying,
}: {
  readonly message: string
  readonly onRetry: () => void
  readonly retrying: boolean
}) {
  return (
    <EmptyState
      icon={AlertTriangle}
      title="No pudimos cargar el dashboard"
      description={message}
      action={
        <Button onClick={onRetry} loading={retrying} variant="secondary">
          <RefreshCw className="size-4" strokeWidth={1.75} />
          Reintentar
        </Button>
      }
    />
  )
}
