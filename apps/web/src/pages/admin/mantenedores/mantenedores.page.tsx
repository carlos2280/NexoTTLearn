import { RUTAS } from "@/shared/constants/rutas"
import { NxtEmpty, NxtHeading, NxtTab, NxtTabs, NxtText } from "@carlos2280/nexott-ui/react"
import { Box, Stack } from "@carlos2280/nexott-ui/react-primitives"
import { useNavigate } from "react-router-dom"
import { AreasTab } from "./components/areas-tab"

type TabActiva = "areas" | "usuarios"

interface MantenedoresPageProps {
  readonly tab?: TabActiva
}

// Pantalla unificada de mantenedores (MAESTRO §14.1).
// El tab activo se deduce del pathname para que recargas y deep-links
// funcionen. Durante la migración v2 el tab por defecto es Áreas.
// Cuando el tab Usuarios tenga implementación funcional, mover el default
// a Usuarios (se documenta así en MAESTRO §14.1).

export function MantenedoresPage(_props: MantenedoresPageProps = {}) {
  const navigate = useNavigate()
  const tabActiva = obtenerTabActiva()

  const cambiarTab = (tab: TabActiva): void => {
    if (tab === "areas") {
      navigate(RUTAS.admin.mantenedoresAreas)
    } else {
      navigate(RUTAS.admin.mantenedoresUsuarios)
    }
  }

  return (
    <Box slot="content" padding={{ base: "lg", md: "xl" }}>
      <Stack gap="2xl">
        <Stack gap="xs">
          <NxtHeading level={1}>Mantenedores</NxtHeading>
          <NxtText tone="muted">
            Catálogos base del sistema: áreas que conducen el modelo y usuarios que pueden acceder.
          </NxtText>
        </Stack>

        <NxtTabs
          variant="underline"
          onNxtTabChange={(event) => {
            const value = event.detail.value
            if (value === "areas" || value === "usuarios") {
              cambiarTab(value)
            }
          }}
        >
          <NxtTab label="Áreas" value="areas" icon="layers" active={tabActiva === "areas"} />
          <NxtTab
            label="Usuarios"
            value="usuarios"
            icon="users"
            active={tabActiva === "usuarios"}
          />
        </NxtTabs>

        {tabActiva === "areas" ? <AreasTab /> : <UsuariosTabPlaceholder />}
      </Stack>
    </Box>
  )
}

function obtenerTabActiva(): TabActiva {
  if (typeof window === "undefined") {
    return "areas"
  }
  // El path de la ruta /usuarios incluye literalmente "usuarios". Áreas es default.
  return window.location.pathname.endsWith("/usuarios") ? "usuarios" : "areas"
}

function UsuariosTabPlaceholder() {
  return (
    <NxtEmpty
      icon="users"
      title="Gestión de usuarios — Próximamente"
      description="El CRUD de usuarios admin se reescribe contra el nuevo modelo en una entrega cercana. Mientras tanto, el seed inicial provee admin@nexott.local y participante@nexott.local."
    />
  )
}
