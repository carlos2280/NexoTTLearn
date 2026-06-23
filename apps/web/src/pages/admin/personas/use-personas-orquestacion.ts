import type { ColaboradorAdminResumen } from "@nexott-learn/shared-types"
import { useState } from "react"
import {
  ESTADO_DIALOG_CERRADO,
  type EstadoDialog,
  type ModoDialogPersonas,
} from "./personas-estado.types"
import { usePersonasMutaciones } from "./use-personas-acciones"
import { buildHandlers } from "./use-personas-handlers"

export function usePersonasOrquestacion() {
  const [dialog, setDialog] = useState<EstadoDialog>(ESTADO_DIALOG_CERRADO)
  const mut = usePersonasMutaciones()
  const ejecutar = buildHandlers({ mut, dialog, setDialog })

  return {
    dialog,
    abrir: (modo: ModoDialogPersonas, persona: ColaboradorAdminResumen | null = null) =>
      setDialog({ modo, persona, credencial: null }),
    cerrar: () => setDialog(ESTADO_DIALOG_CERRADO),
    ejecutar,
    estado: {
      enviandoCrear: mut.crear.isPending,
      enviandoRegenerar: mut.regenerar.isPending,
      enviandoDesbloquear: mut.desbloquear.isPending,
      enviandoCambiarRol: mut.cambiarRol.isPending,
    },
  }
}
