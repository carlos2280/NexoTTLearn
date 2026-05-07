import { Drawer, DrawerBody, DrawerContent } from "@/shared/ui/patterns/drawer"
import { Skeleton } from "@/shared/ui/patterns/skeleton"
import { type TabItem, Tabs } from "@/shared/ui/patterns/tabs"
import { useState } from "react"
import { useDrawerEntrega } from "../hooks/use-drawer-entrega"
import { EntregaDrawerFooter, EntregaDrawerHeader } from "./drawer-entrega-shell"
import { TabContenidoEntrega, TabHistorico } from "./drawer-entrega-tabs"
import { ModalAjustarNota } from "./modal-ajustar-nota"

type TabDrawer = "entrega" | "historico"

const TABS: readonly TabItem<TabDrawer>[] = [
  { value: "entrega", label: "Entrega" },
  { value: "historico", label: "Histórico" },
]

interface DrawerEntregaProps {
  readonly entregaId: string | null
  readonly onCerrar: () => void
}

export function DrawerEntrega({ entregaId, onCerrar }: DrawerEntregaProps) {
  const [tabActivo, setTabActivo] = useState<TabDrawer>("entrega")
  const {
    data,
    isLoading,
    modalAjusteOpen,
    setModalAjusteOpen,
    handleAprobar,
    handleAjustar,
    isEvaluando,
    isAjustando,
  } = useDrawerEntrega(entregaId, onCerrar)

  const nombreCompleto = data ? `${data.participante.nombre} ${data.participante.apellido}` : ""

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
          title="Detalle de entrega"
          description="Revisa la entrega y decide la evaluación"
          header={data ? <EntregaDrawerHeader data={data} nombreCompleto={nombreCompleto} /> : null}
          footer={
            data ? (
              <EntregaDrawerFooter
                nota={data.nota}
                isEvaluando={isEvaluando}
                onAprobar={handleAprobar}
                onAjustar={() => setModalAjusteOpen(true)}
                onSiguiente={onCerrar}
              />
            ) : null
          }
        >
          {isLoading ? (
            <DrawerBody>
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-40 w-full" />
            </DrawerBody>
          ) : data ? (
            <>
              <div className="sticky top-0 z-10 border-glass-border border-b bg-surface-1">
                <Tabs items={TABS} value={tabActivo} onChange={setTabActivo} className="px-5" />
              </div>
              {tabActivo === "entrega" ? (
                <TabContenidoEntrega data={data} />
              ) : (
                <TabHistorico intentos={data.intentos} intentoActual={data.intento} />
              )}
            </>
          ) : null}
        </DrawerContent>
      </Drawer>
      {data ? (
        <ModalAjustarNota
          open={modalAjusteOpen}
          onOpenChange={setModalAjusteOpen}
          notaActual={data.nota}
          nombreParticipante={nombreCompleto}
          isPending={isAjustando}
          onConfirmar={handleAjustar}
        />
      ) : null}
    </>
  )
}
