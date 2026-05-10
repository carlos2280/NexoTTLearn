import { Drawer, DrawerBody, DrawerContent } from "@/shared/ui/patterns/drawer"
import { Skeleton } from "@/shared/ui/patterns/skeleton"
import { type TabItem, Tabs } from "@/shared/ui/patterns/tabs"
import type { EntregaProyectoDetalleAdmin } from "@nexott-learn/shared-types"
import { type ReactNode, useState } from "react"
import { useDrawerProyecto } from "../hooks/use-drawer-proyecto"
import { ProyectoDrawerFooter, ProyectoDrawerHeader } from "./drawer-proyecto-shell"
import { TabCapa1, TabCapa2, TabCapa3, TabFinalProyecto } from "./drawer-proyecto-tabs"
import { ModalAjustarNota } from "./modal-ajustar-nota"

type TabDrawerProyecto = "capa1" | "capa2" | "capa3" | "final"

const TABS: readonly TabItem<TabDrawerProyecto>[] = [
  { value: "final", label: "Final" },
  { value: "capa1", label: "Capa 1" },
  { value: "capa2", label: "Capa 2" },
  { value: "capa3", label: "Capa 3" },
]

const TAB_PANEL: Record<TabDrawerProyecto, (data: EntregaProyectoDetalleAdmin) => ReactNode> = {
  final: (data) => <TabFinalProyecto data={data} />,
  capa1: (data) => <TabCapa1 data={data} />,
  capa2: (data) => <TabCapa2 data={data} />,
  capa3: (data) => <TabCapa3 data={data} />,
}

interface DrawerProyectoProps {
  readonly entregaId: string | null
  readonly onCerrar: () => void
}

export function DrawerProyecto({ entregaId, onCerrar }: DrawerProyectoProps) {
  const [tabActivo, setTabActivo] = useState<TabDrawerProyecto>("final")
  const {
    data,
    isLoading,
    modalAjusteOpen,
    setModalAjusteOpen,
    handleAceptar,
    handleAjustar,
    isEvaluando,
    isAjustando,
  } = useDrawerProyecto(entregaId, onCerrar)

  const nombreCompleto = data ? `${data.participante.nombre} ${data.participante.apellido}` : ""
  const notaAgregada = data?.notaCalculadaOriginal ?? data?.notaFinal

  return (
    <>
      <Drawer
        open={entregaId !== null}
        onOpenChange={(open) => {
          if (!open) {
            onCerrar()
          }
        }}
      >
        <DrawerContent
          title="Detalle de proyecto"
          description="Revisa las 3 capas y decide la evaluación"
          header={
            data ? <ProyectoDrawerHeader data={data} nombreCompleto={nombreCompleto} /> : null
          }
          footer={
            data ? (
              <ProyectoDrawerFooter
                notaAgregada={notaAgregada}
                notaCapa1={data.notaCapa1}
                isEvaluando={isEvaluando}
                onAceptar={handleAceptar}
                onAjustar={() => setModalAjusteOpen(true)}
                onSiguiente={onCerrar}
              />
            ) : null
          }
        >
          {isLoading ? (
            <DrawerBody>
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-60 w-full" />
            </DrawerBody>
          ) : data ? (
            <>
              <div className="sticky top-0 z-10 border-glass-border border-b bg-surface-1">
                <Tabs items={TABS} value={tabActivo} onChange={setTabActivo} className="px-5" />
              </div>
              {TAB_PANEL[tabActivo](data)}
            </>
          ) : null}
        </DrawerContent>
      </Drawer>
      {data ? (
        <ModalAjustarNota
          open={modalAjusteOpen}
          onOpenChange={setModalAjusteOpen}
          notaActual={data.notaFinal}
          nombreParticipante={nombreCompleto}
          isPending={isAjustando}
          onConfirmar={handleAjustar}
        />
      ) : null}
    </>
  )
}
