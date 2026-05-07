import { useEntregaBloqueDetalle } from "@/features/admin-centro-revision/hooks/use-entregas-bloque"
import {
  useAjustarEntregaBloque,
  useEvaluarEntregaBloque,
} from "@/features/admin-centro-revision/hooks/use-evaluar-entrega-bloque"
import { useState } from "react"
import { toast } from "sonner"

export function useDrawerEntrega(entregaId: string | null, onCerrar: () => void) {
  const [modalAjusteOpen, setModalAjusteOpen] = useState(false)

  const { data, isLoading } = useEntregaBloqueDetalle(entregaId)
  const evaluar = useEvaluarEntregaBloque(entregaId ?? "")
  const ajustar = useAjustarEntregaBloque(entregaId ?? "")

  function handleAprobar() {
    if (!data || data.nota === null) {
      return
    }
    const notaAprobada = data.nota
    evaluar.mutate(
      { nota: notaAprobada },
      {
        onSuccess: () => {
          toast.success(`Aprobado · ${data.participante.nombre} (${notaAprobada})`)
          onCerrar()
        },
      },
    )
  }

  function handleAjustar(nota: number, motivoAjuste: string) {
    ajustar.mutate(
      { nota, motivoAjuste },
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
    handleAprobar,
    handleAjustar,
    isEvaluando: evaluar.isPending,
    isAjustando: ajustar.isPending,
  }
}
