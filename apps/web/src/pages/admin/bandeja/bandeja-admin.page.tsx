import { useAdminDashboard } from "@/features/admin-dashboard/hooks/use-admin-dashboard"
import { useUsuarioActual } from "@/features/auth/hooks/use-usuario-actual"
import { RUTAS } from "@/shared/constants/rutas"
import { obtenerSaludo } from "@/shared/lib/saludo"
import {
  NxtBadge,
  NxtButton,
  NxtCard,
  NxtEyebrow,
  NxtHeading,
  NxtIconTile,
  type NxtIconTileGradient,
  type NxtIconoNombre,
  NxtKpi,
  NxtStream,
  type NxtStreamHighlightTone,
  type NxtStreamTagVariant,
  NxtTag,
  NxtText,
} from "@carlos2280/nexott-ui/react"
import { Box, Grid, Stack } from "@carlos2280/nexott-ui/react-primitives"
import { useNavigate } from "react-router-dom"

// Acciones rapidas: navegacion estatica, no depende del backend.
type AccionRapida = {
  id: string
  label: string
  icon: NxtIconoNombre
  href: string
}

const ACCIONES_RAPIDAS: AccionRapida[] = [
  { id: "qa-1", label: "Nuevo curso", icon: "plus-circle", href: RUTAS.admin.cursoNuevo },
  { id: "qa-2", label: "Crear diagnostico", icon: "compass", href: RUTAS.admin.diagnosticoNuevo },
  {
    id: "qa-3",
    label: "Centro de revision",
    icon: "check-circle",
    href: RUTAS.admin.centroRevision,
  },
  { id: "qa-4", label: "Gestionar personas", icon: "users", href: RUTAS.admin.personas },
]

export function BandejaAdminPage() {
  const { data: usuario } = useUsuarioActual()
  const { data: dashboard, isLoading, isError, refetch } = useAdminDashboard()
  const navigate = useNavigate()

  if (!usuario) {
    return null
  }

  const saludo = obtenerSaludo()

  return (
    <Box slot="content" padding={{ base: "lg", md: "xl" }}>
      <Stack gap="2xl">
        {/* Hero saludo */}
        <Stack gap="xs">
          <NxtText size="md" tone="dim">
            {saludo}
          </NxtText>
          <NxtHeading level={1} size="hero">
            {usuario.nombre}
          </NxtHeading>
          <Box py="xs">
            <NxtBadge variant="brand" soft={true} size="md" icon="shield" label="Administrador" />
          </Box>
        </Stack>

        {isLoading && (
          <NxtText size="md" tone="dim">
            Cargando metricas...
          </NxtText>
        )}

        {isError && (
          <NxtCard variant="surface" padding="lg">
            <Stack direction="row" align="center" gap="md">
              <NxtIconTile name="alert-triangle" gradient="rose" size="md" />
              <Stack gap="xs" style={{ flex: 1 }}>
                <NxtText size="md" weight="semibold">
                  No pudimos cargar la bandeja
                </NxtText>
                <NxtText size="sm" tone="dim">
                  Reintenta en unos segundos. Si persiste, revisa el estado de la API.
                </NxtText>
              </Stack>
              <NxtButton variant="ghost" size="md" onNxtButtonClick={() => refetch()}>
                Reintentar
              </NxtButton>
            </Stack>
          </NxtCard>
        )}

        {dashboard && (
          <>
            {/* KPIs */}
            <Stack gap="md">
              <NxtEyebrow accent="bar">Metricas globales</NxtEyebrow>
              <Grid columns={{ base: 1, sm: 2, lg: 4 }} gap="md">
                {dashboard.kpis.map((kpi) => (
                  <NxtKpi
                    key={kpi.id}
                    variant="metric"
                    label={kpi.label}
                    value={kpi.value}
                    delta={kpi.delta}
                    trend={kpi.trend}
                    color={kpi.color}
                    helper={kpi.helper}
                    trendData={kpi.trendData}
                    clickable={!!kpi.href}
                    href={kpi.href}
                    onNxtKpiClick={(event) => navigate(event.detail.value)}
                  />
                ))}
              </Grid>
            </Stack>

            {/* Centro de revision (banner-CTA) */}
            <Stack gap="md">
              <NxtEyebrow accent="bar">{dashboard.colaRevision.title}</NxtEyebrow>
              <NxtCard
                variant="surface"
                padding="lg"
                clickable={true}
                onNxtCardClick={() => navigate(dashboard.colaRevision.href)}
              >
                <Stack direction={{ base: "column", md: "row" }} align="center" gap="md">
                  <Stack direction="row" align="center" gap="md" style={{ flex: 1 }}>
                    <NxtIconTile name="check-circle" gradient="indigo" size="md" />
                    <Stack gap="xs">
                      <NxtText size="md" weight="semibold">
                        {dashboard.colaRevision.description}
                      </NxtText>
                      <Stack direction="row" gap="sm" wrap={true}>
                        {dashboard.colaRevision.items.map((item) => (
                          <NxtTag
                            key={item.id}
                            variant={item.tone}
                            size="md"
                            icon={item.icon as NxtIconoNombre}
                            clickable={true}
                            value={item.href}
                            onNxtTagClick={(event) => {
                              event.stopPropagation()
                              navigate(event.detail.value)
                            }}
                          >
                            {item.count} {item.label}
                          </NxtTag>
                        ))}
                      </Stack>
                    </Stack>
                  </Stack>
                  <NxtButton
                    variant="ghost"
                    size="md"
                    icon="chevron-right"
                    onNxtButtonClick={() => navigate(dashboard.colaRevision.href)}
                  >
                    Ir al centro
                  </NxtButton>
                </Stack>
              </NxtCard>
            </Stack>

            {/* Alertas */}
            {dashboard.alertas.length > 0 && (
              <Stack gap="md">
                <NxtEyebrow accent="bar">Alertas pendientes</NxtEyebrow>
                <Stack gap="sm">
                  {dashboard.alertas.map((alerta) => (
                    <NxtStream
                      key={alerta.id}
                      title={alerta.title}
                      meta={alerta.meta}
                      action={alerta.action}
                      iconTile={alerta.icon as NxtIconoNombre}
                      iconGradient={alerta.gradient as NxtIconTileGradient}
                      tag={alerta.tag}
                      tagVariant={alerta.tagVariant as NxtStreamTagVariant}
                      value={alerta.href}
                      onNxtStreamClick={(event) => navigate(event.detail.value)}
                    />
                  ))}
                </Stack>
              </Stack>
            )}

            {/* Actividad reciente */}
            {dashboard.actividad.length > 0 && (
              <Stack gap="md">
                <NxtEyebrow accent="bar">Actividad reciente</NxtEyebrow>
                <Stack gap="sm">
                  {dashboard.actividad.map((item) => (
                    <NxtStream
                      key={item.id}
                      iconTile={item.icon as NxtIconoNombre}
                      iconGradient={item.gradient as NxtIconTileGradient}
                      title={item.title}
                      highlight={item.highlight}
                      highlightTone={item.highlightTone as NxtStreamHighlightTone | undefined}
                      meta={item.meta}
                    />
                  ))}
                </Stack>
              </Stack>
            )}
          </>
        )}

        {/* Acciones rapidas */}
        <Stack gap="md">
          <NxtEyebrow accent="bar">Acciones rapidas</NxtEyebrow>
          <Stack direction="row" gap="sm" wrap={true}>
            {ACCIONES_RAPIDAS.map((accion) => (
              <NxtButton
                key={accion.id}
                variant="ghost"
                size="md"
                icon={accion.icon}
                onNxtButtonClick={() => navigate(accion.href)}
              >
                {accion.label}
              </NxtButton>
            ))}
          </Stack>
        </Stack>
      </Stack>
    </Box>
  )
}
