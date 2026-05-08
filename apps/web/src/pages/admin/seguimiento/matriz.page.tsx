import { useDescargarPlantilla } from "@/features/admin-seguimiento/hooks/use-descargar-plantilla"
import { useKpisSeguimiento } from "@/features/admin-seguimiento/hooks/use-kpis-seguimiento"
import { useMatrizSeguimiento } from "@/features/admin-seguimiento/hooks/use-matriz-seguimiento"
import { RUTAS } from "@/shared/constants/rutas"
import { PageHeader } from "@/shared/ui/patterns/page-header"
import { Button } from "@/shared/ui/primitives/button"
import type { FiltroEstadoSeguimiento } from "@nexott-learn/shared-types"
import { ArrowLeft, Download, Upload } from "lucide-react"
import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { GraficoBarrasAreas } from "./components/charts/grafico-barras-areas"
import { GraficoDonutEstados } from "./components/charts/grafico-donut-estados"
import { GraficoLineaCohorte } from "./components/charts/grafico-linea-cohorte"
import { DrawerAreaCross } from "./components/drawer-area-cross"
import { DrawerCelda } from "./components/drawer-celda"
import { DrawerCargarExcel } from "./components/excel/drawer-cargar-excel"
import { MatrizCuerpo, filtrarBusqueda } from "./components/matriz-cuerpo"
import { MatrizKpis } from "./components/matriz-kpis"
import { MatrizToolbar } from "./components/matriz-toolbar"
import { ModalAjustarEntrega } from "./components/modal-ajustar-entrega"
import { SelectorCurso } from "./components/selector-curso"
import { useAjusteEntrega } from "./lib/use-ajuste-entrega"
import { useCeldaAbierta } from "./lib/use-celda-abierta"

type EstadoNoAll = Exclude<FiltroEstadoSeguimiento, "all">

interface MatrizSeguimientoPageProps {
  readonly cursoId: string
}

export function MatrizSeguimientoPage({ cursoId }: MatrizSeguimientoPageProps) {
  const navigate = useNavigate()
  const tab = "actual" as const
  const [search, setSearch] = useState("")
  const [estado, setEstado] = useState<EstadoNoAll | null>(null)
  const [cargandoExcel, setCargandoExcel] = useState(false)

  const matrizQuery = useMatrizSeguimiento(cursoId, {
    tab,
    estado: estado ?? undefined,
  })
  const kpisQuery = useKpisSeguimiento(cursoId, tab)
  const descargarPlantillaMut = useDescargarPlantilla()

  const filas = useMemo(() => filtrarBusqueda(matrizQuery.data, search), [matrizQuery.data, search])
  const drawer = useCeldaAbierta()
  const ajuste = useAjusteEntrega()

  const nombreParticipante = drawer.celda
    ? `${drawer.celda.fila.participante.nombre} ${drawer.celda.fila.participante.apellido}`
    : ""

  const handleClickFila = (participanteId: string) => {
    navigate(RUTAS.admin.seguimientoParticipante(participanteId))
  }

  const handleDescargarPlantilla = () => {
    descargarPlantillaMut.mutate(
      { cursoId },
      {
        onSuccess: () => toast.success("Plantilla descargada"),
        onError: (e) => toast.error(e.message),
      },
    )
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 md:py-10 lg:px-8">
      <div className="flex flex-col gap-6">
        <PageHeader
          eyebrow="Seguimiento"
          title="Matriz de progreso"
          subtitle="Evolución de la cohorte · candidatos × áreas"
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <SelectorCurso cursoIdActual={cursoId} />
              <Button variant="secondary" size="sm" onClick={handleDescargarPlantilla}>
                <Download className="size-4" strokeWidth={2} aria-hidden="true" />
                Plantilla
              </Button>
              <Button variant="primary" size="sm" onClick={() => setCargandoExcel(true)}>
                <Upload className="size-4" strokeWidth={2} aria-hidden="true" />
                Cargar Excel
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate(RUTAS.admin.seguimiento)}>
                <ArrowLeft className="size-4" strokeWidth={2} aria-hidden="true" />
                Hub
              </Button>
            </div>
          }
        />
        <MatrizKpis data={kpisQuery.data} isLoading={kpisQuery.isLoading} />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <GraficoLineaCohorte cursoId={cursoId} />
          </div>
          <GraficoDonutEstados cursoId={cursoId} />
        </div>
        <GraficoBarrasAreas cursoId={cursoId} />
        <MatrizToolbar
          search={search}
          onChangeSearch={setSearch}
          estado={estado}
          onChangeEstado={setEstado}
        />
        <MatrizCuerpo
          query={matrizQuery}
          filas={filas}
          onClickCelda={drawer.abrirCelda}
          onClickFila={handleClickFila}
          onClickHeaderArea={drawer.abrirAreaCross}
        />
      </div>
      <DrawerCelda
        cursoId={cursoId}
        tab={tab}
        fila={drawer.celda?.fila ?? null}
        area={drawer.celda?.area ?? null}
        onClose={drawer.cerrarCelda}
        onAbrirFicha={(id) => {
          drawer.cerrar()
          navigate(RUTAS.admin.seguimientoParticipante(id))
        }}
        onAjustarEntrega={ajuste.abrir}
      />
      <DrawerAreaCross
        area={drawer.areaCross}
        matriz={matrizQuery.data}
        onClose={drawer.cerrarAreaCross}
      />
      <ModalAjustarEntrega
        entregaId={ajuste.entrega?.id ?? null}
        tipo={ajuste.entrega?.tipo ?? "bloque"}
        notaActual={ajuste.entrega?.nota ?? null}
        nombreParticipante={nombreParticipante}
        onClose={ajuste.cerrar}
      />
      <DrawerCargarExcel
        open={cargandoExcel}
        onClose={() => setCargandoExcel(false)}
        cursoId={cursoId}
        onConfirmado={() => {
          toast.success("Evaluación inicial aplicada")
        }}
      />
    </main>
  )
}
