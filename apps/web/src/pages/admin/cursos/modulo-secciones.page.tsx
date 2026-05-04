import { useCursoAdmin } from "@/features/admin-cursos/hooks/use-curso-admin"
import { useModulosAdmin } from "@/features/admin-modulos/hooks/use-modulos-admin"
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

// Placeholder navegable de la pantalla "Secciones y contenidos" de un modulo.
// Es la pantalla destino del click en una card de modulo dentro del Tab
// "Modulos" de la edicion de curso. La construccion completa (acordeon de
// secciones, contenidos arrastrables, editor inline) queda para un sprint
// dedicado; mientras tanto cumple dos funciones:
//   1. Que el click en la card tenga un destino real (no quede roto).
//   2. Que el admin entienda que aqui "vivira" el editor de contenidos.

export function ModuloSeccionesPage() {
  const { id: cursoId, moduloId } = useParams<{ id: string; moduloId: string }>()
  const navigate = useNavigate()

  const cursoQuery = useCursoAdmin(cursoId, { enabled: Boolean(cursoId) })
  const modulosQuery = useModulosAdmin(cursoId)

  const modulo = modulosQuery.data?.items.find((item) => item.id === moduloId)

  const volverAlCurso = (): void => {
    if (cursoId) {
      navigate(RUTAS.admin.cursoEditar(cursoId))
      return
    }
    navigate(RUTAS.admin.cursos)
  }

  const cargando = cursoQuery.isLoading || modulosQuery.isLoading

  return (
    <Box slot="content" padding={{ base: "lg", md: "xl" }}>
      <Stack gap="2xl">
        <Breadcrumb
          cursoTitulo={cursoQuery.data?.title ?? ""}
          moduloTitulo={modulo?.titulo ?? ""}
          onCursos={() => navigate(RUTAS.admin.cursos)}
          onCurso={volverAlCurso}
        />

        {cargando ? <Skeleton /> : <Placeholder onVolver={volverAlCurso} />}
      </Stack>
    </Box>
  )
}

interface BreadcrumbProps {
  readonly cursoTitulo: string
  readonly moduloTitulo: string
  readonly onCursos: () => void
  readonly onCurso: () => void
}

function Breadcrumb({ cursoTitulo, moduloTitulo, onCursos, onCurso }: BreadcrumbProps) {
  return (
    <Stack
      direction={{ base: "column", md: "row" }}
      align={{ base: "start", md: "center" }}
      justify="between"
      gap="md"
    >
      <Stack direction="row" align="center" gap="xs" wrap={true}>
        <NxtButton variant="ghost" size="sm" onNxtButtonClick={onCursos}>
          Cursos
        </NxtButton>
        <NxtIcon name="chevron-right" size="sm" />
        <NxtButton variant="ghost" size="sm" onNxtButtonClick={onCurso}>
          {cursoTitulo || "Curso"}
        </NxtButton>
        <NxtIcon name="chevron-right" size="sm" />
        <NxtHeading level={3}>{moduloTitulo || "Modulo"}</NxtHeading>
      </Stack>

      <NxtButton variant="secondary" size="sm" icon="chevron-left" onNxtButtonClick={onCurso}>
        Volver al curso
      </NxtButton>
    </Stack>
  )
}

function Placeholder({ onVolver }: { readonly onVolver: () => void }) {
  return (
    <NxtCard variant="surface" padding="lg">
      <Stack align="center" gap="lg" style={{ textAlign: "center", padding: "var(--nx-space-6)" }}>
        <NxtIconTile name="layers" gradient="brand" size="lg" />
        <Stack gap="xs" align="center">
          <NxtEyebrow accent="bar">Proximamente</NxtEyebrow>
          <NxtHeading level={3}>Editor de secciones y contenidos</NxtHeading>
          <NxtText size="md" tone="dim" style={{ maxWidth: "520px" }}>
            Aqui vivira el editor para organizar secciones del modulo, agregar contenidos (lecturas,
            videos, ejercicios, tests) y reordenarlos con arrastrar y soltar.
          </NxtText>
        </Stack>
        <NxtButton variant="secondary" icon="chevron-left" onNxtButtonClick={onVolver}>
          Volver al curso
        </NxtButton>
      </Stack>
    </NxtCard>
  )
}

const SKELETON_KEYS = ["sec-sk-1", "sec-sk-2", "sec-sk-3"] as const

function Skeleton() {
  return (
    <Stack gap="md">
      {SKELETON_KEYS.map((key) => (
        <NxtSkeleton key={key} variant="card" />
      ))}
    </Stack>
  )
}
