import { useAsignacionesMatriz } from "@/features/admin-diagnostico/hooks/use-asignaciones"
import { useDiagnosticoMatriz } from "@/features/admin-diagnostico/hooks/use-diagnostico-matriz"
import { useInscripcionesCurso } from "@/features/admin-diagnostico/hooks/use-inscripciones-curso"
import { calcularProgreso } from "@/features/admin-diagnostico/lib/progreso"
import { getDiagnosticoMock } from "@/features/admin-diagnostico/mocks/mock-candidatos"
import { RUTAS } from "@/shared/constants/rutas"
import { useBreadcrumbOverride } from "@/shared/hooks/use-breadcrumb-override"
import { ConfirmDialog } from "@/shared/ui/patterns/confirm-dialog"
import { PageHeader } from "@/shared/ui/patterns/page-header"
import { Button } from "@/shared/ui/primitives/button"
import { TooltipProvider } from "@radix-ui/react-tooltip"
import { ArrowLeft } from "lucide-react"
import { useMemo } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { BotonIrSeguimiento } from "./components/boton-ir-seguimiento"
import { DiagnosticoTabs } from "./components/diagnostico-tabs"
import { DrawerCapturaCelda } from "./components/drawer-captura-celda"
import { DrawerInvitarCandidatos } from "./components/drawer-invitar/drawer-invitar-candidatos"
import { ProgresoDiagnostico } from "./components/progreso-diagnostico"
import { TabAsignacion } from "./components/tab-asignacion"
import { TabEvaluacion } from "./components/tab-evaluacion"
import { TabInvitados } from "./components/tab-invitados"
import { mapMockInscripciones } from "./lib/adapters"
import { useCapturaCelda } from "./lib/use-captura-celda"
import { useDrawerInvitar } from "./lib/use-drawer-invitar"
import { useQuitarDialog } from "./lib/use-quitar-dialog"
import { useTabActiva } from "./lib/use-tab-activa"

export function CursoCandidatosPage() {
  const { id: cursoId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const inscripcionesQuery = useInscripcionesCurso(cursoId)
  const matrizQuery = useDiagnosticoMatriz(cursoId)
  const asignacionesQuery = useAsignacionesMatriz(cursoId)
  const inscripciones = inscripcionesQuery.data?.items ?? []
  const matriz = matrizQuery.data
  const mock = useMemo(() => getDiagnosticoMock(cursoId ?? "demo"), [cursoId])
  const progreso = useMemo(
    () => calcularProgreso({ ...mock, inscripciones: mapMockInscripciones(inscripciones) }),
    [mock, inscripciones],
  )
  const { tabActiva, setTabActiva } = useTabActiva(progreso.tabSugerido)
  const quitar = useQuitarDialog()
  const captura = useCapturaCelda()
  const drawerInvitar = useDrawerInvitar(cursoId)

  useBreadcrumbOverride([
    { label: "Diagnóstico", href: RUTAS.admin.diagnosticos },
    { label: mock.curso.titulo },
  ])

  const badges = {
    invitados: inscripciones.length,
    evaluacion: `${progreso.pasos[1].hechos}/${progreso.pasos[1].total}`,
    asignacion: `${progreso.pasos[2].hechos}/${progreso.pasos[2].total}`,
  }

  const onCeldaClick = (inscripcionId: string, areaId: string) => {
    if (!matriz) {
      return
    }
    const fila = matriz.filas.find((f) => f.inscripcionId === inscripcionId)
    const area = matriz.areas.find((a) => a.id === areaId)
    if (fila && area) {
      captura.abrir({ fila, area })
    }
  }

  return (
    <TooltipProvider delayDuration={200}>
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 md:py-10 lg:px-8">
        <div className="flex flex-col gap-6">
          <PageHeader
            eyebrow={`${mock.curso.empresaCliente} · ${mock.curso.estado}`}
            title={mock.curso.titulo}
            subtitle="Diagnóstico inicial: invita candidatos, captura su evaluación y asigna módulos."
            actions={
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => cursoId && navigate(RUTAS.admin.cursoEditor(cursoId))}
                >
                  <ArrowLeft className="size-4" aria-hidden="true" />
                  Volver al curso
                </Button>
                <BotonIrSeguimiento
                  cursoId={cursoId}
                  habilitado={progreso.listoParaSeguimiento}
                  onClick={(id) => navigate(`${RUTAS.admin.seguimiento}?curso=${id}`)}
                />
              </div>
            }
          />

          <ProgresoDiagnostico
            pasos={progreso.pasos}
            diasRestantes={mock.curso.diasRestantes}
            onPasoClick={setTabActiva}
          />

          <DiagnosticoTabs value={tabActiva} onChange={setTabActiva} badges={badges} />

          {tabActiva === 1 ? (
            <TabInvitados
              inscripciones={inscripciones}
              onQuitar={quitar.pedirQuitar}
              onInvitar={drawerInvitar.abrir}
              cargando={inscripcionesQuery.isLoading}
            />
          ) : tabActiva === 2 ? (
            <TabEvaluacion
              areas={matriz?.areas ?? []}
              filas={matriz?.filas ?? []}
              cargando={matrizQuery.isLoading}
              onCeldaClick={onCeldaClick}
            />
          ) : (
            <TabAsignacion
              cursoId={cursoId}
              data={asignacionesQuery.data}
              cargando={asignacionesQuery.isLoading}
            />
          )}
        </div>
      </main>

      <ConfirmDialog
        open={quitar.objetivo !== undefined}
        onOpenChange={(open) => !open && quitar.cancelar()}
        tone="danger"
        title={`Quitar a ${quitar.objetivo?.participante.nombre ?? ""} del curso`}
        description="Su inscripción pasará a ABANDONADA. Podrás volver a invitarlo después si fuera necesario."
        confirmLabel="Quitar del curso"
        loading={quitar.enviando}
        onConfirm={() => (cursoId ? quitar.confirmar(cursoId) : undefined)}
      />

      <DrawerCapturaCelda
        fila={captura.fila}
        area={captura.area}
        enviando={captura.enviando}
        onCerrar={captura.cerrar}
        onGuardar={captura.guardar}
      />

      <DrawerInvitarCandidatos cursoId={cursoId} controller={drawerInvitar} />
    </TooltipProvider>
  )
}
