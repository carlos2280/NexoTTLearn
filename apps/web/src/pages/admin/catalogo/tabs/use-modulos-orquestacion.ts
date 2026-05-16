import {
  useActualizarModulo,
  useArchivarModulo,
  useCrearModulo,
  useDesarchivarModulo,
  useEliminarModulo,
} from "@/features/catalogo/hooks/use-mutaciones-modulos"
import type { ModuloResponse } from "@nexott-learn/shared-types"
import { useState } from "react"
import { toast } from "sonner"

export type ModoDialogModulos =
  | "cerrado"
  | "crear"
  | "editar"
  | "archivar"
  | "desarchivar"
  | "eliminar"

export interface EstadoDialogModulos {
  readonly modo: ModoDialogModulos
  readonly modulo: ModuloResponse | null
}

const CERRADO: EstadoDialogModulos = { modo: "cerrado", modulo: null }

export function useModulosOrquestacion() {
  const [dialog, setDialog] = useState<EstadoDialogModulos>(CERRADO)
  const crear = useCrearModulo()
  const actualizar = useActualizarModulo()
  const archivar = useArchivarModulo()
  const desarchivar = useDesarchivarModulo()
  const eliminar = useEliminarModulo()

  const abrir = (modo: ModoDialogModulos, modulo: ModuloResponse | null = null) =>
    setDialog({ modo, modulo })
  const cerrar = () => setDialog(CERRADO)

  async function conModulo(op: (m: ModuloResponse) => Promise<void>) {
    if (!dialog.modulo) {
      return
    }
    await op(dialog.modulo)
    cerrar()
  }

  return {
    dialog,
    abrir,
    cerrar,
    ejecutar: {
      guardar: async (input: {
        titulo: string
        descripcion: string | null
        motivo: string | undefined
      }) => {
        if (dialog.modo === "crear") {
          await crear.mutateAsync({
            titulo: input.titulo,
            descripcion: input.descripcion ?? undefined,
          })
          toast.success(`Módulo «${input.titulo}» creado`)
        } else if (dialog.modo === "editar" && dialog.modulo) {
          await actualizar.mutateAsync({
            id: dialog.modulo.id,
            input: { titulo: input.titulo, descripcion: input.descripcion },
            motivo: input.motivo,
          })
          toast.success(`Módulo «${input.titulo}» actualizado`)
        }
        cerrar()
      },
      archivar: (motivo: string) =>
        conModulo(async (m) => {
          await archivar.mutateAsync({ id: m.id, motivo })
          toast.success(`Módulo «${m.titulo}» archivado`)
        }),
      desarchivar: (motivo: string) =>
        conModulo(async (m) => {
          await desarchivar.mutateAsync({ id: m.id, motivo })
          toast.success(`Módulo «${m.titulo}» desarchivado`)
        }),
      eliminar: (motivo: string) =>
        conModulo(async (m) => {
          await eliminar.mutateAsync({ id: m.id, motivo })
          toast.success(`Módulo «${m.titulo}» eliminado`)
        }),
    },
    estado: {
      enviandoGuardar: crear.isPending || actualizar.isPending,
      enviandoArchivar: archivar.isPending,
      enviandoDesarchivar: desarchivar.isPending,
      enviandoEliminar: eliminar.isPending,
    },
  }
}
