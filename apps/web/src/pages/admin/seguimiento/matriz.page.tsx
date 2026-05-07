import { useKpisSeguimiento } from "@/features/admin-seguimiento/hooks/use-kpis-seguimiento"
import { useMatrizSeguimiento } from "@/features/admin-seguimiento/hooks/use-matriz-seguimiento"
import { RUTAS } from "@/shared/constants/rutas"
import { PageHeader } from "@/shared/ui/patterns/page-header"
import { Button } from "@/shared/ui/primitives/button"
import type { FiltroEstadoSeguimiento } from "@nexott-learn/shared-types"
import { ArrowLeft } from "lucide-react"
import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { DrawerAreaCross } from "./components/drawer-area-cross"
import { DrawerCelda } from "./components/drawer-celda"
import { MatrizCuerpo, filtrarBusqueda } from "./components/matriz-cuerpo"
import { MatrizKpis } from "./components/matriz-kpis"
import { MatrizTabs } from "./components/matriz-tabs"
import { MatrizToolbar } from "./components/matriz-toolbar"
import { ModalAjustarEntrega } from "./components/modal-ajustar-entrega"
import { useAjusteEntrega } from "./lib/use-ajuste-entrega"
import { useCeldaAbierta } from "./lib/use-celda-abierta"
import { useTabMatriz } from "./lib/use-tab-matriz"

type EstadoNoAll = Exclude<FiltroEstadoSeguimiento, "all">

interface MatrizSeguimientoPageProps {
  readonly cursoId: string
}

export function MatrizSeguimientoPage({ cursoId }: MatrizSeguimientoPageProps) {
  const navigate = useNavigate()
  const { tab, setTab } = useTabMatriz()
  const [search, setSearch] = useState("")
  const [estado, setEstado] = useState<EstadoNoAll | null>(null)

  const matrizQuery = useMatrizSeguimiento(cursoId, {
    tab,
    estado: estado ?? undefined,
  })
  const kpisQuery = useKpisSeguimiento(cursoId, tab)

  const filas = useMemo(() => filtrarBusqueda(matrizQuery.data, search), [matrizQuery.data, search])
  const drawer = useCeldaAbierta()
  const ajuste = useAjusteEntrega()

  const nombreParticipante = drawer.celda
    ? `${drawer.celda.fila.participante.nombre} ${drawer.celda.fila.participante.apellido}`
    : ""

  const handleClickFila = (participanteId: string) => {
    navigate(RUTAS.admin.seguimientoParticipante(participanteId))
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 md:py-10 lg:px-8">
      <div className="flex flex-col gap-6">
        <PageHeader
          eyebrow="Seguimiento"
          title={matrizQuery.data ? `Curso · ${cursoId.slice(0, 8)}` : "Matriz del curso"}
          subtitle="Lectura cohorte · candidatos × áreas."
          actions={
            <Button variant="ghost" size="sm" onClick={() => navigate(RUTAS.admin.seguimiento)}>
              <ArrowLeft className="size-4" strokeWidth={2} aria-hidden="true" />
              Volver al hub
            </Button>
          }
        />
        <MatrizTabs value={tab} onChange={setTab} />
        <MatrizKpis data={kpisQuery.data} isLoading={kpisQuery.isLoading} />
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
        onClose={drawer.cerrar}
        onAbrirFicha={(id) => {
          drawer.cerrar()
          navigate(RUTAS.admin.seguimientoParticipante(id))
        }}
        onAjustarEntrega={ajuste.abrir}
      />
      <DrawerAreaCross area={drawer.areaCross} matriz={matrizQuery.data} onClose={drawer.cerrar} />
      <ModalAjustarEntrega
        entregaId={ajuste.entrega?.id ?? null}
        tipo={ajuste.entrega?.tipo ?? "bloque"}
        notaActual={ajuste.entrega?.nota ?? null}
        nombreParticipante={nombreParticipante}
        onClose={ajuste.cerrar}
      />
    </main>
  )
}
