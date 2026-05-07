import { useCerrarCurso } from "@/features/admin-cursos/hooks/use-cerrar-curso"
import { useCursoDetalle } from "@/features/admin-cursos/hooks/use-curso-detalle"
import { useDespublicarCurso } from "@/features/admin-cursos/hooks/use-despublicar-curso"
import { useEliminarCurso } from "@/features/admin-cursos/hooks/use-eliminar-curso"
import { useEntrevistaIa } from "@/features/admin-cursos/hooks/use-entrevista-ia"
import { useProyectoTransversal } from "@/features/admin-cursos/hooks/use-proyecto-transversal"
import { ApiError } from "@/shared/api/api-error"
import { RUTAS } from "@/shared/constants/rutas"
import {
  NxtAlert,
  NxtBreadcrumb,
  NxtBreadcrumbItem,
  NxtButton,
  NxtEmpty,
  NxtHeading,
  NxtSkeleton,
  NxtTab,
  NxtTabs,
  toast,
} from "@carlos2280/nexott-ui/react"
import { Box, Stack } from "@carlos2280/nexott-ui/react-primitives"
import type { TransicionEstadoCursoInput } from "@nexott-learn/shared-types"
import { useCallback, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { EliminarCursoDialog } from "../components/eliminar-curso-dialog"
import { TransicionCursoModal } from "../components/transicion-curso-modal"
import { AreasCard } from "./components/areas-card"
import { CursoDetalleHeader } from "./components/curso-detalle-header"
import { EntrevistaIACard } from "./components/entrevista-ia-card"
import { PesosCursoCard, PesosIntraModuloCard } from "./components/pesos-curso-card"
import { TransversalCard } from "./components/transversal-card"
import { UmbralesCard } from "./components/umbrales-card"

type TabActiva = "resumen" | "estructura" | "candidatos" | "reportes"

export function CursoDetallePage() {
  const { id: cursoId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [tabActiva, setTabActiva] = useState<TabActiva>("resumen")

  const cursoQuery = useCursoDetalle(cursoId)
  const transversalActivo = cursoQuery.data?.proyectoTransversal.activo ?? false
  const entrevistaActiva = cursoQuery.data?.entrevistaIAConfig.activa ?? false

  const transversalQuery = useProyectoTransversal(cursoId, transversalActivo)
  const entrevistaQuery = useEntrevistaIa(cursoId, entrevistaActiva)

  const [cursoTransicion, setCursoTransicion] = useState<
    { readonly variante: "despublicar" | "cerrar" } | undefined
  >()
  const [eliminarAbierto, setEliminarAbierto] = useState(false)

  const despublicarMutation = useDespublicarCurso()
  const cerrarMutation = useCerrarCurso()
  const eliminarMutation = useEliminarCurso()

  const handleEditar = useCallback(() => {
    if (!cursoId) {
      return
    }
    // Capa 3 vivirá en /admin/cursos/:id/editor cuando se implemente.
    navigate(`${RUTAS.admin.cursoDetalle(cursoId)}/editor`)
  }, [cursoId, navigate])

  const handleDuplicar = useCallback(() => {
    if (!cursoId) {
      return
    }
    navigate(`${RUTAS.admin.cursos}?duplicar=${cursoId}`)
  }, [cursoId, navigate])

  const handleConfirmarTransicion = useCallback(
    async (motivo: string | undefined) => {
      if (!(cursoId && cursoTransicion)) {
        return
      }
      const input: TransicionEstadoCursoInput = motivo ? { motivo } : {}
      try {
        if (cursoTransicion.variante === "despublicar") {
          await despublicarMutation.mutateAsync({ id: cursoId, input })
          toast.success("Curso despublicado")
        } else {
          await cerrarMutation.mutateAsync({ id: cursoId, input })
          toast.success("Curso cerrado")
        }
        setCursoTransicion(undefined)
      } catch (error) {
        const message =
          error instanceof ApiError ? error.message : "No pudimos completar la operación"
        toast.error(message)
      }
    },
    [cursoId, cursoTransicion, despublicarMutation, cerrarMutation],
  )

  const handleConfirmarEliminar = useCallback(async () => {
    if (!cursoId) {
      return
    }
    try {
      await eliminarMutation.mutateAsync(cursoId)
      toast.success("Curso eliminado")
      navigate(RUTAS.admin.cursos)
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "No pudimos eliminar el curso"
      toast.error(message)
    }
  }, [cursoId, eliminarMutation, navigate])

  if (!cursoId) {
    return (
      <Box slot="content" padding={{ base: "lg", md: "xl" }}>
        <NxtAlert variant="error" heading="Ruta inválida" message="Falta el id del curso." />
      </Box>
    )
  }

  // Estado de carga inicial.
  if (cursoQuery.isPending) {
    return (
      <Box slot="content" padding={{ base: "lg", md: "xl" }}>
        <CursoDetalleSkeleton />
      </Box>
    )
  }

  // Error 404 → curso no existe.
  if (cursoQuery.isError) {
    const apiError = cursoQuery.error instanceof ApiError ? cursoQuery.error : null
    if (apiError?.status === 404) {
      return (
        <Box slot="content" padding={{ base: "lg", md: "xl" }}>
          <Stack gap="lg">
            <BreadcrumbHeader titulo="Curso no encontrado" />
            <NxtEmpty
              icon="alert-triangle"
              title="Curso no encontrado"
              description="El curso que buscas no existe o fue eliminado."
            >
              <NxtButton
                variant="brand"
                icon="chevron-left"
                onNxtButtonClick={() => navigate(RUTAS.admin.cursos)}
              >
                Volver al listado
              </NxtButton>
            </NxtEmpty>
          </Stack>
        </Box>
      )
    }
    return (
      <Box slot="content" padding={{ base: "lg", md: "xl" }}>
        <Stack gap="lg">
          <BreadcrumbHeader titulo="Error" />
          <NxtAlert
            variant="error"
            heading="No pudimos cargar el curso"
            message={cursoQuery.error.message}
          >
            <NxtButton
              slot="action"
              variant="secondary"
              icon="refresh"
              onNxtButtonClick={() => cursoQuery.refetch()}
            >
              Reintentar
            </NxtButton>
          </NxtAlert>
        </Stack>
      </Box>
    )
  }

  const curso = cursoQuery.data

  return (
    <>
      <Box slot="content" padding={{ base: "lg", md: "xl" }}>
        <Stack gap="2xl">
          <Stack gap="md">
            <NxtBreadcrumb>
              <NxtBreadcrumbItem href={RUTAS.admin.bandeja}>Admin</NxtBreadcrumbItem>
              <NxtBreadcrumbItem href={RUTAS.admin.cursos}>Cursos</NxtBreadcrumbItem>
              <NxtBreadcrumbItem active={true}>{curso.titulo}</NxtBreadcrumbItem>
            </NxtBreadcrumb>

            <CursoDetalleHeader
              curso={curso}
              onEditar={handleEditar}
              onDuplicar={handleDuplicar}
              onDespublicar={() => setCursoTransicion({ variante: "despublicar" })}
              onCerrar={() => setCursoTransicion({ variante: "cerrar" })}
              onEliminar={() => setEliminarAbierto(true)}
            />
          </Stack>

          <NxtTabs
            variant="underline"
            onNxtTabChange={(event) => {
              const value = event.detail.value
              if (
                value === "resumen" ||
                value === "estructura" ||
                value === "candidatos" ||
                value === "reportes"
              ) {
                setTabActiva(value)
              }
            }}
          >
            <NxtTab label="Resumen" value="resumen" icon="info" active={tabActiva === "resumen"} />
            <NxtTab
              label="Estructura"
              value="estructura"
              icon="layers"
              badge={curso.contadores.modulos}
              disabled={true}
            />
            <NxtTab
              label="Candidatos"
              value="candidatos"
              icon="users"
              badge={curso.contadores.inscripcionesActivas}
              disabled={true}
            />
            <NxtTab label="Reportes" value="reportes" icon="bar-chart" disabled={true} />
          </NxtTabs>

          {tabActiva === "resumen" ? (
            <Stack gap="lg">
              <AreasCard areas={curso.cursoAreas} />
              <Stack direction="row" gap="lg" wrap={true}>
                <Box style={{ flex: "1 1 380px", minWidth: 0 }}>
                  <PesosCursoCard curso={curso} />
                </Box>
                <Box style={{ flex: "1 1 380px", minWidth: 0 }}>
                  <PesosIntraModuloCard curso={curso} />
                </Box>
              </Stack>
              <UmbralesCard curso={curso} />
              <Stack direction="row" gap="lg" wrap={true}>
                <Box style={{ flex: "1 1 380px", minWidth: 0 }}>
                  <TransversalCard
                    activo={transversalActivo}
                    transversal={transversalQuery.data}
                    loading={transversalQuery.isLoading}
                    error={transversalQuery.error}
                  />
                </Box>
                <Box style={{ flex: "1 1 380px", minWidth: 0 }}>
                  <EntrevistaIACard
                    activa={entrevistaActiva}
                    entrevista={entrevistaQuery.data}
                    loading={entrevistaQuery.isLoading}
                    error={entrevistaQuery.error}
                  />
                </Box>
              </Stack>
            </Stack>
          ) : null}
        </Stack>
      </Box>

      {cursoTransicion ? (
        <TransicionCursoModal
          abierto={true}
          variante={cursoTransicion.variante}
          cursoTitulo={curso.titulo}
          enviando={
            cursoTransicion.variante === "despublicar"
              ? despublicarMutation.isPending
              : cerrarMutation.isPending
          }
          onCerrar={() => setCursoTransicion(undefined)}
          onConfirmar={handleConfirmarTransicion}
        />
      ) : null}

      <EliminarCursoDialog
        abierto={eliminarAbierto}
        cursoTitulo={curso.titulo}
        enviando={eliminarMutation.isPending}
        onCancelar={() => setEliminarAbierto(false)}
        onConfirmar={handleConfirmarEliminar}
      />
    </>
  )
}

function BreadcrumbHeader({ titulo }: { readonly titulo: string }) {
  return (
    <NxtBreadcrumb>
      <NxtBreadcrumbItem href={RUTAS.admin.bandeja}>Admin</NxtBreadcrumbItem>
      <NxtBreadcrumbItem href={RUTAS.admin.cursos}>Cursos</NxtBreadcrumbItem>
      <NxtBreadcrumbItem active={true}>{titulo}</NxtBreadcrumbItem>
    </NxtBreadcrumb>
  )
}

function CursoDetalleSkeleton() {
  return (
    <Stack gap="2xl">
      <Stack gap="md">
        <NxtHeading level={1}>Cargando curso…</NxtHeading>
        <NxtSkeleton variant="text" lines={2} />
      </Stack>
      <NxtSkeleton variant="card" />
    </Stack>
  )
}
