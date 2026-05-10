import { useCeldaSeguimiento } from "@/features/admin-seguimiento/hooks/use-celda-seguimiento"
import { Drawer, DrawerBody, DrawerContent, DrawerHeader } from "@/shared/ui/patterns/drawer"
import { Skeleton } from "@/shared/ui/patterns/skeleton"
import { Button } from "@/shared/ui/primitives/button"
import type { MatrizAreaHeader, MatrizFila, SeguimientoTab } from "@nexott-learn/shared-types"
import { Eye } from "lucide-react"
import { DrawerCeldaActual } from "./drawer-celda-actual"
import { DrawerCeldaInicial } from "./drawer-celda-inicial"
import type { EntregaAjustable } from "./fila-entrega-reciente"

interface DrawerCeldaProps {
  readonly cursoId: string
  readonly tab: SeguimientoTab
  readonly fila: MatrizFila | null
  readonly area: MatrizAreaHeader | null
  readonly onClose: () => void
  readonly onAbrirFicha: (participanteId: string) => void
  readonly onAjustarEntrega: (e: EntregaAjustable) => void
}

export function DrawerCelda({
  cursoId,
  tab,
  fila,
  area,
  onClose,
  onAbrirFicha,
  onAjustarEntrega,
}: DrawerCeldaProps) {
  const open = Boolean(fila && area)
  const { data, isLoading } = useCeldaSeguimiento({
    cursoId: open ? cursoId : undefined,
    inscripcionId: fila?.inscripcionId,
    areaId: area?.id,
    tab,
  })

  const tituloPersona = fila ? `${fila.participante.nombre} ${fila.participante.apellido}` : ""
  const tituloArea = area?.nombre ?? ""

  return (
    <Drawer
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          onClose()
        }
      }}
    >
      <DrawerContent
        title={`${tituloPersona} · ${tituloArea}`}
        header={
          <DrawerHeader>
            <div className="flex flex-col gap-1">
              <span className="text-text-muted text-xs uppercase tracking-wider">
                {tituloArea} · umbral {area?.umbral ?? "—"}
              </span>
              <h3 className="font-semibold text-base text-text-primary tracking-tight">
                {tituloPersona || "Detalle"}
              </h3>
              <span className="text-text-muted text-xs">{fila?.participante.email}</span>
            </div>
          </DrawerHeader>
        }
        footer={
          fila ? (
            <div className="flex justify-end px-5 py-4">
              <Button size="sm" variant="ghost" onClick={() => onAbrirFicha(fila.participante.id)}>
                <Eye className="size-4" strokeWidth={2} aria-hidden="true" />
                Ver ficha completa
              </Button>
            </div>
          ) : null
        }
      >
        <DrawerBody>
          {isLoading || !data ? (
            <Skeleton className="h-64 w-full rounded-[var(--radius-lg)]" />
          ) : data.tab === "actual" && fila && area ? (
            <DrawerCeldaActual
              detalle={data}
              cursoId={cursoId}
              inscripcionId={fila.inscripcionId}
              areaId={area.id}
              umbralArea={area.umbral}
              onAjustarEntrega={onAjustarEntrega}
            />
          ) : data.tab === "actual" ? null : (
            <DrawerCeldaInicial detalle={data} />
          )}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  )
}
