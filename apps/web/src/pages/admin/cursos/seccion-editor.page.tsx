import { useCursoAdmin } from "@/features/admin-cursos/hooks/use-curso-admin"
import { useModulosAdmin } from "@/features/admin-modulos/hooks/use-modulos-admin"
import { useSeccionesAdmin } from "@/features/admin-secciones/hooks/use-secciones-admin"
import { RUTAS } from "@/shared/constants/rutas"
import {
  NxtButton,
  NxtCard,
  NxtEyebrow,
  NxtHeading,
  NxtIcon,
  NxtIconTile,
  NxtSkeleton,
  NxtText,
} from "@carlos2280/nexott-ui/react"
import { Box, Stack } from "@carlos2280/nexott-ui/react-primitives"
import { useNavigate, useParams } from "react-router-dom"

// Sprint F3: ruta destino del click en una card de seccion del Hub. La
// pantalla del lienzo (topbar + minimapa + main con bloques editables) llega
// en F4 con los componentes nuevos `nxl-section-editor-shell`,
// `nxl-section-minimap`, `nxl-section-canvas-header` y `nxl-block-shell`.
// Mientras tanto este placeholder valida la navegacion: muestra el contexto
// de la seccion (curso · modulo · seccion) y deja un CTA "Volver al hub" para
// que el flujo no quede roto.

export function SeccionEditorPage() {
  const {
    id: cursoId,
    moduloId,
    seccionId,
  } = useParams<{
    id: string
    moduloId: string
    seccionId: string
  }>()
  const navigate = useNavigate()

  const cursoQuery = useCursoAdmin(cursoId, { enabled: Boolean(cursoId) })
  const modulosQuery = useModulosAdmin(cursoId)
  const seccionesQuery = useSeccionesAdmin(cursoId, moduloId)

  const modulo = modulosQuery.data?.items.find((item) => item.id === moduloId)
  const seccion = seccionesQuery.data?.items.find((item) => item.id === seccionId)

  const cargando = cursoQuery.isLoading || modulosQuery.isLoading || seccionesQuery.isLoading

  const volverAlHub = (): void => {
    if (cursoId && moduloId) {
      navigate(RUTAS.admin.cursoModuloSecciones(cursoId, moduloId))
      return
    }
    navigate(RUTAS.admin.cursos)
  }

  return (
    <Box slot="content" padding={{ base: "lg", md: "xl" }}>
      <Stack gap="2xl">
        <Stack direction="row" align="center" justify="between" gap="md" wrap={true}>
          <Stack direction="row" align="center" gap="xs" wrap={true}>
            <NxtButton
              variant="ghost"
              size="sm"
              onNxtButtonClick={() => navigate(RUTAS.admin.cursos)}
            >
              Cursos
            </NxtButton>
            <NxtIcon name="chevron-right" size="sm" />
            <NxtButton
              variant="ghost"
              size="sm"
              onNxtButtonClick={() => (cursoId ? navigate(RUTAS.admin.cursoEditar(cursoId)) : null)}
            >
              {cursoQuery.data?.title ?? "Curso"}
            </NxtButton>
            <NxtIcon name="chevron-right" size="sm" />
            <NxtButton variant="ghost" size="sm" onNxtButtonClick={volverAlHub}>
              {modulo?.titulo ?? "Modulo"}
            </NxtButton>
            <NxtIcon name="chevron-right" size="sm" />
            <NxtText size="md" weight="bold">
              {seccion?.titulo ?? "Seccion"}
            </NxtText>
          </Stack>

          <NxtButton
            variant="secondary"
            size="sm"
            icon="chevron-left"
            onNxtButtonClick={volverAlHub}
          >
            Volver al hub
          </NxtButton>
        </Stack>

        {cargando ? (
          <NxtSkeleton variant="card" />
        ) : (
          <NxtCard variant="surface" padding="lg">
            <Stack
              align="center"
              gap="lg"
              style={{ textAlign: "center", padding: "var(--nx-space-6)" }}
            >
              <NxtIconTile name="edit" gradient="brand" size="lg" />
              <Stack gap="xs" align="center">
                <NxtEyebrow accent="bar">Proximamente</NxtEyebrow>
                <NxtHeading level={3}>Editor de seccion</NxtHeading>
                <NxtText size="md" tone="dim" style={{ maxWidth: "520px" }}>
                  Aqui vivira el lienzo de edicion de la seccion: minimapa lateral, lista de bloques
                  de contenido editables in-place (lecturas, videos, codigo, ejercicios, tests) y
                  autoguardado. Llega en el siguiente sprint.
                </NxtText>
              </Stack>
              <NxtButton variant="secondary" icon="chevron-left" onNxtButtonClick={volverAlHub}>
                Volver al hub
              </NxtButton>
            </Stack>
          </NxtCard>
        )}
      </Stack>
    </Box>
  )
}
