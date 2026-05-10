import { useEntregaProyectoDetalle } from "@/features/admin-centro-revision/hooks/use-entregas-proyecto"
import {
  useAjustarEntregaProyecto,
  useEvaluarEntregaProyecto,
} from "@/features/admin-centro-revision/hooks/use-evaluar-entrega-proyecto"
import { useState } from "react"
import { toast } from "sonner"

export function useDrawerProyecto(entregaId: string | null, onCerrar: () => void) {
  const [modalAjusteOpen, setModalAjusteOpen] = useState(false)

  const { data, isLoading } = useEntregaProyectoDetalle(entregaId)
  const evaluar = useEvaluarEntregaProyecto(entregaId ?? "")
  const ajustar = useAjustarEntregaProyecto(entregaId ?? "")

  function handleAceptar() {
    if (!data || data.notaCapa1 === null || data.notaCapa2 === null || data.notaCapa3 === null) {
      return
    }
    evaluar.mutate(
      { notaCapa1: data.notaCapa1, notaCapa2: data.notaCapa2, notaCapa3: data.notaCapa3 },
      {
        onSuccess: () => {
          toast.success(`Proyecto aprobado · ${data.participante.nombre}`)
          onCerrar()
        },
      },
    )
  }

  function handleAjustar(nota: number, motivoAjuste: string) {
    ajustar.mutate(
      { notaFinal: nota, motivoAjuste },
      {
        onSuccess: () => {
          toast.success(`Nota ajustada a ${nota}`)
          setModalAjusteOpen(false)
          onCerrar()
        },
      },
    )
  }

  return {
    data,
    isLoading,
    modalAjusteOpen,
    setModalAjusteOpen,
    handleAceptar,
    handleAjustar,
    isEvaluando: evaluar.isPending,
    isAjustando: ajustar.isPending,
  }
}
