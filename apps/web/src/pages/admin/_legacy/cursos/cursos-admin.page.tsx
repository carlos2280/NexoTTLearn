import { useCursosAdmin } from "@/features/admin-cursos/hooks/use-cursos-admin"
import { RUTAS } from "@/shared/constants/rutas"
import { NxlCourseCardAdmin } from "@carlos2280/nexott-ui/learn/react"
import {
  NxtButton,
  NxtCard,
  NxtEmpty,
  NxtHeading,
  NxtIconTile,
  NxtSkeleton,
  NxtText,
} from "@carlos2280/nexott-ui/react"
import { Box, Grid, Stack } from "@carlos2280/nexott-ui/react-primitives"
import type { CursoAdminItem } from "@nexott-learn/shared-types"
import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { CursosToolbar, type FiltroEstado } from "./components/cursos-toolbar"

const SKELETON_KEYS = ["sk-1", "sk-2", "sk-3", "sk-4"] as const

export function CursosAdminPage() {
  const { data, isLoading, isError, refetch } = useCursosAdmin()
  const navigate = useNavigate()
  const [filtro, setFiltro] = useState<FiltroEstado>("all")

  const items: readonly CursoAdminItem[] = data?.items ?? []

  const conteos = useMemo(
    () => ({
      all: items.length,
      published: items.filter((c) => c.status === "published").length,
      draft: items.filter((c) => c.status === "draft").length,
      disabled: items.filter((c) => c.status === "disabled").length,
    }),
    [items],
  )

  const itemsFiltrados = useMemo(
    () => (filtro === "all" ? items : items.filter((curso) => curso.status === filtro)),
    [items, filtro],
  )

  const sinResultados = !(isLoading || isError) && itemsFiltrados.length === 0

  const irACrear = (): void => navigate(RUTAS.admin.cursoNuevo)
  const irAEditar = (cursoId: string): void => navigate(RUTAS.admin.cursoEditar(cursoId))

  return (
    <Box slot="content" padding={{ base: "lg", md: "xl" }}>
      <Stack gap="2xl">
        <Stack direction={{ base: "column", md: "row" }} align="center" justify="between" gap="md">
          <NxtHeading level={1}>Cursos</NxtHeading>
          <NxtButton variant="primary" size="md" icon="plus" onNxtButtonClick={irACrear}>
            Nuevo curso
          </NxtButton>
        </Stack>

        {/* Renderizar el toolbar solo cuando ya hay datos: nxt-tabs lee los
            props badge en su firstUpdated y no recompone si cambian despues
            (limita relectura a attribute mutations, no a property changes). */}
        {!isLoading && (
          <CursosToolbar filtro={filtro} conteos={conteos} onFiltroChange={setFiltro} />
        )}

        {isLoading && (
          <Grid columns={{ base: 1, md: 2 }} gap="lg">
            {SKELETON_KEYS.map((key) => (
              <NxtSkeleton key={key} variant="card" />
            ))}
          </Grid>
        )}

        {isError && (
          <NxtCard variant="surface" padding="lg">
            <Stack direction="row" align="center" gap="md">
              <NxtIconTile name="alert-triangle" gradient="rose" size="md" />
              <Stack gap="xs" style={{ flex: 1 }}>
                <NxtText size="md" weight="semibold">
                  No pudimos cargar los cursos
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

        {sinResultados && (
          <CursosEmpty
            haCatalogo={items.length > 0}
            onLimpiarFiltro={() => setFiltro("all")}
            onCrear={irACrear}
          />
        )}

        {!isLoading && itemsFiltrados.length > 0 && (
          <Grid columns={{ base: 1, md: 2 }} gap="lg">
            {itemsFiltrados.map((curso) => (
              <NxlCourseCardAdmin
                key={curso.id}
                title={curso.title}
                description={curso.description}
                iconInitials={curso.iconInitials}
                iconColor={curso.iconColor}
                modules={String(curso.modules)}
                courseId={curso.id}
                slug={curso.slug}
                status={curso.status}
                participantsCount={curso.participantsCount}
                completionRate={curso.completionRate}
                onNxlAdminCourseClick={(event) => irAEditar(event.detail.courseId)}
                onNxlAdminCourseDuplicate={(_event) => {
                  // TODO(api): conectar mutation cuando exista POST /admin/cursos/:id/duplicar
                }}
                onNxlAdminCourseDisable={(_event) => {
                  // TODO(api): conectar mutation cuando exista PATCH /admin/cursos/:id/deshabilitar (toggle)
                }}
                onNxlAdminCourseDelete={(_event) => {
                  // TODO(api): conectar mutation cuando exista DELETE /admin/cursos/:id
                }}
              />
            ))}
          </Grid>
        )}
      </Stack>
    </Box>
  )
}

type CursosEmptyProps = {
  readonly haCatalogo: boolean
  readonly onLimpiarFiltro: () => void
  readonly onCrear: () => void
}

function CursosEmpty({ haCatalogo, onLimpiarFiltro, onCrear }: CursosEmptyProps) {
  if (haCatalogo) {
    return (
      <NxtEmpty
        icon="search"
        title="Sin resultados"
        description="Ningun curso coincide con el filtro seleccionado."
        mood="neutral"
      >
        <NxtButton variant="ghost" size="md" onNxtButtonClick={onLimpiarFiltro}>
          Limpiar filtro
        </NxtButton>
      </NxtEmpty>
    )
  }

  return (
    <NxtEmpty
      icon="book"
      title="No hay cursos todavia"
      description="Crea el primer curso y empieza a capacitar a tu equipo."
      mood="brand"
      dashed={true}
    >
      <NxtButton variant="primary" size="md" icon="plus" onNxtButtonClick={onCrear}>
        Crear primer curso
      </NxtButton>
    </NxtEmpty>
  )
}
