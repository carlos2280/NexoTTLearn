import {
  useCrearBloque,
  useEliminarBloque,
  useReordenarBloques,
} from "@/features/catalogo/hooks/use-mutaciones-bloques"
import {
  useActualizarSeccion,
  useCrearSeccion,
  useEliminarSeccion,
  useReordenarSecciones,
} from "@/features/catalogo/hooks/use-mutaciones-secciones"
import type { BloqueResponse, SeccionResponse, TipoBloque } from "@nexott-learn/shared-types"
import { useState } from "react"
import { toast } from "sonner"
import {
  type ContextoContenidoDefecto,
  contenidoPorDefecto,
} from "../editores/shared/contenido-por-defecto"
import type { BuilderSeleccion } from "./use-builder-seleccion"

type Dialog =
  | { readonly modo: "cerrado" }
  | { readonly modo: "crear-seccion" }
  | { readonly modo: "renombrar-seccion"; readonly seccion: SeccionResponse }
  | { readonly modo: "eliminar-seccion"; readonly seccion: SeccionResponse }
  | { readonly modo: "tipos-bloque"; readonly seccionId: string }
  | { readonly modo: "eliminar-bloque"; readonly bloque: BloqueResponse }

const CERRADO: Dialog = { modo: "cerrado" }

interface UseBuilderAccionesArgs {
  readonly moduloId: string
  readonly seleccion: BuilderSeleccion
}

export function useBuilderAcciones({ moduloId, seleccion }: UseBuilderAccionesArgs) {
  const [dialog, setDialog] = useState<Dialog>(CERRADO)
  const crearSeccion = useCrearSeccion()
  const actualizarSeccion = useActualizarSeccion()
  const eliminarSeccion = useEliminarSeccion()
  const reordenarSeccionesMut = useReordenarSecciones()
  const crearBloque = useCrearBloque()
  const eliminarBloque = useEliminarBloque()
  const reordenarBloquesMut = useReordenarBloques()

  const cerrar = () => setDialog(CERRADO)
  const abrir = (siguiente: Dialog) => setDialog(siguiente)

  async function ejecutarCrearSeccion(titulo: string) {
    // No enviamos `orden`: el back asigna max(orden) + 1 dentro del tx.
    // Enviarlo desde cliente abre la puerta a duplicados con datos stale.
    const nueva = await crearSeccion.mutateAsync({
      moduloId,
      input: { titulo },
    })
    seleccion.seleccionarSeccion(nueva.id)
    toast.success("Sección creada")
    cerrar()
  }

  async function ejecutarRenombrarSeccion(titulo: string) {
    if (dialog.modo !== "renombrar-seccion") {
      return
    }
    await actualizarSeccion.mutateAsync({
      moduloId,
      seccionId: dialog.seccion.id,
      input: { titulo },
    })
    toast.success("Sección renombrada")
    cerrar()
  }

  async function ejecutarEliminarSeccion(motivo: string) {
    if (dialog.modo !== "eliminar-seccion") {
      return
    }
    const id = dialog.seccion.id
    await eliminarSeccion.mutateAsync({
      moduloId,
      seccionId: id,
      motivo,
    })
    toast.success(`Sección «${dialog.seccion.titulo}» eliminada`)
    seleccion.seleccionarModulo()
    cerrar()
  }

  async function ejecutarCrearBloque(tipo: TipoBloque, contexto?: ContextoContenidoDefecto) {
    if (dialog.modo !== "tipos-bloque") {
      return
    }
    await crearBloqueDirecto(dialog.seccionId, tipo, contexto)
    cerrar()
  }

  /**
   * Crear bloque sin pasar por el dialog (slash command). Util desde dentro
   * del editor de un bloque para insertar un hermano de tipo X.
   */
  async function crearBloqueDirecto(
    seccionId: string,
    tipo: TipoBloque,
    contexto?: ContextoContenidoDefecto,
  ) {
    const nuevo = await crearBloque.mutateAsync({
      seccionId,
      input: {
        tipo,
        esEvaluable: false,
        skillQueMideId: null,
        contenido: contenidoPorDefecto(tipo, contexto),
      },
    })

    // Un reto (código o SQL) casi siempre necesita sus tests. Creamos el bloque
    // *_TESTS ya enlazado al reto para entregar el par en un solo paso, en vez de
    // obligar al admin a crear el reto y luego el test apuntándolo.
    if (tipo === "CODIGO_PREGUNTAS") {
      await crearTestsDelReto(seccionId, "CODIGO_TESTS", { codigoPreguntasHermanoId: nuevo.id })
      seleccion.seleccionarBloque(nuevo.id)
      return
    }
    if (tipo === "SQL_EJERCICIO") {
      await crearTestsDelReto(seccionId, "SQL_TESTS", { sqlEjercicioHermanoId: nuevo.id })
      seleccion.seleccionarBloque(nuevo.id)
      return
    }

    seleccion.seleccionarBloque(nuevo.id)
    toast.success("Bloque creado")
  }

  async function crearTestsDelReto(
    seccionId: string,
    tipoTests: "CODIGO_TESTS" | "SQL_TESTS",
    contexto: ContextoContenidoDefecto,
  ) {
    try {
      await crearBloque.mutateAsync({
        seccionId,
        input: {
          tipo: tipoTests,
          esEvaluable: false,
          skillQueMideId: null,
          contenido: contenidoPorDefecto(tipoTests, contexto),
        },
      })
      toast.success("Reto y Tests creados")
    } catch {
      toast.error("Reto creado, pero no se pudo crear su bloque de Tests. Añádelo manualmente.")
    }
  }

  async function ejecutarEliminarBloque(motivo: string) {
    if (dialog.modo !== "eliminar-bloque") {
      return
    }
    await eliminarBloque.mutateAsync({
      bloqueId: dialog.bloque.id,
      motivo,
    })
    toast.success("Bloque eliminado")
    seleccion.seleccionarModulo()
    cerrar()
  }

  return {
    dialog,
    abrir,
    cerrar,
    acciones: {
      crearSeccion: ejecutarCrearSeccion,
      renombrarSeccion: ejecutarRenombrarSeccion,
      eliminarSeccion: ejecutarEliminarSeccion,
      crearBloque: ejecutarCrearBloque,
      crearBloqueDirecto,
      eliminarBloque: ejecutarEliminarBloque,
      reordenarSecciones: async (
        orden: ReadonlyArray<{ readonly seccionId: string; readonly orden: number }>,
      ) => {
        await reordenarSeccionesMut.mutateAsync({
          moduloId,
          input: { orden: [...orden] },
        })
      },
      reordenarBloques: async (
        seccionId: string,
        orden: ReadonlyArray<{ readonly bloqueId: string; readonly orden: number }>,
      ) => {
        await reordenarBloquesMut.mutateAsync({
          seccionId,
          input: { orden: [...orden] },
        })
      },
    },
    estado: {
      crearSeccion: crearSeccion.isPending,
      renombrarSeccion: actualizarSeccion.isPending,
      eliminarSeccion: eliminarSeccion.isPending,
      crearBloque: crearBloque.isPending,
      eliminarBloque: eliminarBloque.isPending,
      reordenando: reordenarSeccionesMut.isPending || reordenarBloquesMut.isPending,
    },
  }
}

export type BuilderAcciones = ReturnType<typeof useBuilderAcciones>
