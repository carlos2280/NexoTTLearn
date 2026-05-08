import { useEliminarArea, useRestaurarArea } from "@/features/admin-areas/hooks/use-mutaciones-area"
import type { Area, AreaDeleteResponse } from "@nexott-learn/shared-types"
import { useState } from "react"
import { toast } from "sonner"

type ConfirmKind = "eliminar" | "restaurar"

interface PendingConfirm {
  readonly kind: ConfirmKind
  readonly area: Area
}

export function useAccionesArea() {
  const [pending, setPending] = useState<PendingConfirm | undefined>()
  const eliminar = useEliminarArea()
  const restaurar = useRestaurarArea()

  const ejecutar = async () => {
    if (!pending) {
      return
    }
    const { kind, area } = pending
    try {
      if (kind === "eliminar") {
        const response: AreaDeleteResponse = await eliminar.mutateAsync(area.id)
        if (response.tipo === "OBSOLETADA") {
          toast.success(
            `${area.nombre} fue marcada como obsoleta (la usan cursos o módulos activos)`,
          )
        } else {
          toast.success(`${area.nombre} fue eliminada`)
        }
      } else {
        await restaurar.mutateAsync(area.id)
        toast.success(`${area.nombre} fue restaurada`)
      }
      setPending(undefined)
    } catch {
      toast.error("La acción falló. Reintenta.")
    }
  }

  const isPending = eliminar.isPending || restaurar.isPending

  return {
    pending,
    request: (kind: ConfirmKind, area: Area) => setPending({ kind, area }),
    cancel: () => setPending(undefined),
    ejecutar,
    isPending,
  }
}

export function describirAreaConfirm(kind: ConfirmKind, area: Area) {
  if (kind === "restaurar") {
    return {
      tone: "info" as const,
      title: `Restaurar ${area.nombre}`,
      description: "El área volverá a estar disponible para nuevos cursos.",
      confirmLabel: "Restaurar",
    }
  }
  return {
    tone: "danger" as const,
    title: `Eliminar ${area.nombre}`,
    description:
      "Si ningún curso o módulo la usa se elimina definitivamente. En caso contrario se marca como obsoleta y deja de estar disponible para nuevos cursos.",
    confirmLabel: "Continuar",
  }
}
