import {
  useActualizarCliente,
  useCrearCliente,
  useEliminarCliente,
} from "@/features/catalogo/hooks/use-mutaciones-clientes"
import type { ClienteResponse } from "@nexott-learn/shared-types"
import { useState } from "react"
import { toast } from "sonner"

export type ModoDialogClientes = "cerrado" | "crear" | "editar" | "toggle-activo" | "eliminar"

export interface EstadoDialogClientes {
  readonly modo: ModoDialogClientes
  readonly cliente: ClienteResponse | null
}

const CERRADO: EstadoDialogClientes = { modo: "cerrado", cliente: null }

export function useClientesOrquestacion() {
  const [dialog, setDialog] = useState<EstadoDialogClientes>(CERRADO)
  const crear = useCrearCliente()
  const actualizar = useActualizarCliente()
  const eliminar = useEliminarCliente()

  const abrir = (modo: ModoDialogClientes, cliente: ClienteResponse | null = null) =>
    setDialog({ modo, cliente })
  const cerrar = () => setDialog(CERRADO)

  async function conCliente(op: (c: ClienteResponse) => Promise<void>) {
    if (!dialog.cliente) {
      return
    }
    await op(dialog.cliente)
    cerrar()
  }

  return {
    dialog,
    abrir,
    cerrar,
    ejecutar: {
      guardar: async (input: { nombre: string; motivo: string | undefined }) => {
        if (dialog.modo === "crear") {
          await crear.mutateAsync({ nombre: input.nombre })
          toast.success(`Cliente «${input.nombre}» creado`)
        } else if (dialog.modo === "editar" && dialog.cliente) {
          await actualizar.mutateAsync({
            id: dialog.cliente.id,
            input: { nombre: input.nombre },
            motivo: input.motivo,
          })
          toast.success(`Cliente «${input.nombre}» actualizado`)
        }
        cerrar()
      },
      toggleActivo: (motivo: string) =>
        conCliente(async (c) => {
          const nuevoActivo = !c.activo
          await actualizar.mutateAsync({
            id: c.id,
            input: { activo: nuevoActivo },
            motivo,
          })
          toast.success(`Cliente «${c.nombre}» ${nuevoActivo ? "activado" : "desactivado"}`)
        }),
      eliminar: (motivo: string) =>
        conCliente(async (c) => {
          await eliminar.mutateAsync({ id: c.id, motivo })
          toast.success(`Cliente «${c.nombre}» eliminado`)
        }),
    },
    estado: {
      enviandoGuardar: crear.isPending || actualizar.isPending,
      enviandoToggle: actualizar.isPending,
      enviandoEliminar: eliminar.isPending,
    },
  }
}
