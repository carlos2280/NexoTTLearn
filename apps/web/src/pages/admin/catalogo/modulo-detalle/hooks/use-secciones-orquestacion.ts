import {
  useActualizarSeccion,
  useCrearSeccion,
  useEliminarSeccion,
  useReordenarSecciones,
} from "@/features/catalogo/hooks/use-mutaciones-secciones"
import type { SeccionResponse } from "@nexott-learn/shared-types"
import { useState } from "react"
import { toast } from "sonner"

type ModoDialog = "cerrado" | "crear" | "editar" | "eliminar"

interface EstadoDialog {
  readonly modo: ModoDialog
  readonly seccion: SeccionResponse | null
}

const CERRADO: EstadoDialog = { modo: "cerrado", seccion: null }

export function useSeccionesOrquestacion(moduloId: string, secciones: readonly SeccionResponse[]) {
  const [dialog, setDialog] = useState<EstadoDialog>(CERRADO)
  const crear = useCrearSeccion()
  const actualizar = useActualizarSeccion()
  const reordenar = useReordenarSecciones()
  const eliminar = useEliminarSeccion()

  const abrir = (modo: ModoDialog, seccion: SeccionResponse | null = null) =>
    setDialog({ modo, seccion })
  const cerrar = () => setDialog(CERRADO)

  async function guardar(titulo: string) {
    if (dialog.modo === "crear") {
      await crear.mutateAsync({ moduloId, input: { titulo } })
      toast.success("Sección creada")
    } else if (dialog.modo === "editar" && dialog.seccion) {
      await actualizar.mutateAsync({
        moduloId,
        seccionId: dialog.seccion.id,
        input: { titulo },
      })
      toast.success("Sección actualizada")
    }
    cerrar()
  }

  async function eliminarConMotivo(motivo: string) {
    if (!dialog.seccion) {
      return
    }
    await eliminar.mutateAsync({
      moduloId,
      seccionId: dialog.seccion.id,
      motivo,
    })
    toast.success(`Sección «${dialog.seccion.titulo}» eliminada`)
    cerrar()
  }

  async function mover(seccion: SeccionResponse, direccion: -1 | 1) {
    const indiceActual = secciones.findIndex((s) => s.id === seccion.id)
    const indiceDestino = indiceActual + direccion
    if (indiceActual < 0 || indiceDestino < 0 || indiceDestino >= secciones.length) {
      return
    }
    const reordenadas = [...secciones]
    const [extraido] = reordenadas.splice(indiceActual, 1)
    if (!extraido) {
      return
    }
    reordenadas.splice(indiceDestino, 0, extraido)
    const permutacion = reordenadas.map((s, i) => ({ seccionId: s.id, orden: i + 1 }))
    await reordenar.mutateAsync({ moduloId, input: { orden: permutacion } })
  }

  return {
    dialog,
    abrir,
    cerrar,
    acciones: {
      guardar,
      eliminarConMotivo,
      mover,
    },
    estado: {
      enviandoGuardar: crear.isPending || actualizar.isPending,
      enviandoEliminar: eliminar.isPending,
      reordenando: reordenar.isPending,
    },
  }
}

export type SeccionesOrquestacion = ReturnType<typeof useSeccionesOrquestacion>
