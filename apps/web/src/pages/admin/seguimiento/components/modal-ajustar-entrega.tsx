import { useAjustarEntregaBloque } from "@/features/admin-centro-revision/hooks/use-evaluar-entrega-bloque"
import { useAjustarEntregaProyecto } from "@/features/admin-centro-revision/hooks/use-evaluar-entrega-proyecto"
import { SEGUIMIENTO_CELDA_KEY } from "@/features/admin-seguimiento/hooks/use-celda-seguimiento"
import { SEGUIMIENTO_KPIS_KEY } from "@/features/admin-seguimiento/hooks/use-kpis-seguimiento"
import { SEGUIMIENTO_MATRIZ_KEY } from "@/features/admin-seguimiento/hooks/use-matriz-seguimiento"
import { ModalAjustarNota } from "@/pages/admin/centro-revision/components/modal-ajustar-nota"
import { useQueryClient } from "@tanstack/react-query"

export type TipoEntregaAjustar = "bloque" | "proyecto"

interface ModalAjustarEntregaProps {
  readonly entregaId: string | null
  readonly tipo: TipoEntregaAjustar
  readonly notaActual: number | null
  readonly nombreParticipante: string
  readonly onClose: () => void
}

export function ModalAjustarEntrega({
  entregaId,
  tipo,
  notaActual,
  nombreParticipante,
  onClose,
}: ModalAjustarEntregaProps) {
  const open = Boolean(entregaId)
  return tipo === "bloque" ? (
    <AjusteBloque
      entregaId={entregaId}
      open={open}
      notaActual={notaActual}
      nombreParticipante={nombreParticipante}
      onClose={onClose}
    />
  ) : (
    <AjusteProyecto
      entregaId={entregaId}
      open={open}
      notaActual={notaActual}
      nombreParticipante={nombreParticipante}
      onClose={onClose}
    />
  )
}

interface AjusteVariantProps {
  readonly entregaId: string | null
  readonly open: boolean
  readonly notaActual: number | null
  readonly nombreParticipante: string
  readonly onClose: () => void
}

function AjusteBloque({
  entregaId,
  open,
  notaActual,
  nombreParticipante,
  onClose,
}: AjusteVariantProps) {
  const qc = useQueryClient()
  const ajustar = useAjustarEntregaBloque(entregaId ?? "")
  const handleConfirmar = (nota: number, motivoAjuste: string) => {
    if (!entregaId) {
      return
    }
    ajustar.mutate(
      { nota, motivoAjuste },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: SEGUIMIENTO_MATRIZ_KEY })
          qc.invalidateQueries({ queryKey: SEGUIMIENTO_KPIS_KEY })
          qc.invalidateQueries({ queryKey: SEGUIMIENTO_CELDA_KEY })
          onClose()
        },
      },
    )
  }
  return (
    <ModalAjustarNota
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          onClose()
        }
      }}
      notaActual={notaActual}
      nombreParticipante={nombreParticipante}
      isPending={ajustar.isPending}
      onConfirmar={handleConfirmar}
    />
  )
}

function AjusteProyecto({
  entregaId,
  open,
  notaActual,
  nombreParticipante,
  onClose,
}: AjusteVariantProps) {
  const qc = useQueryClient()
  const ajustar = useAjustarEntregaProyecto(entregaId ?? "")
  const handleConfirmar = (notaFinal: number, motivoAjuste: string) => {
    if (!entregaId) {
      return
    }
    ajustar.mutate(
      { notaFinal, motivoAjuste },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: SEGUIMIENTO_MATRIZ_KEY })
          qc.invalidateQueries({ queryKey: SEGUIMIENTO_KPIS_KEY })
          qc.invalidateQueries({ queryKey: SEGUIMIENTO_CELDA_KEY })
          onClose()
        },
      },
    )
  }
  return (
    <ModalAjustarNota
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          onClose()
        }
      }}
      notaActual={notaActual}
      nombreParticipante={nombreParticipante}
      isPending={ajustar.isPending}
      onConfirmar={handleConfirmar}
    />
  )
}
