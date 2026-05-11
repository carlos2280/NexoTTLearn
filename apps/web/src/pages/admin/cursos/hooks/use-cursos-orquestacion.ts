import {
  useArchivarCurso,
  useCrearCurso,
  useDesarchivarCurso,
  useDuplicarCurso,
  usePublicarCurso,
} from "@/features/cursos/hooks/use-mutaciones-curso"
import { RUTAS } from "@/shared/constants/rutas"
import type { CrearCursoInput, CursoResumen } from "@nexott-learn/shared-types"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

export type ModoDialogCursos =
  | "cerrado"
  | "crear"
  | "publicar"
  | "archivar"
  | "desarchivar"
  | "duplicar"

export interface EstadoDialogCursos {
  readonly modo: ModoDialogCursos
  readonly curso: CursoResumen | null
}

const CERRADO: EstadoDialogCursos = { modo: "cerrado", curso: null }

export function useCursosOrquestacion() {
  const [dialog, setDialog] = useState<EstadoDialogCursos>(CERRADO)
  const navigate = useNavigate()
  const crear = useCrearCurso()
  const publicar = usePublicarCurso()
  const archivar = useArchivarCurso()
  const desarchivar = useDesarchivarCurso()
  const duplicar = useDuplicarCurso()

  const abrir = (modo: ModoDialogCursos, curso: CursoResumen | null = null) =>
    setDialog({ modo, curso })
  const cerrar = () => setDialog(CERRADO)

  async function conCurso(op: (c: CursoResumen) => Promise<void>) {
    if (!dialog.curso) {
      return
    }
    await op(dialog.curso)
    cerrar()
  }

  return {
    dialog,
    abrir,
    cerrar,
    accionesFila: {
      verDetalle: (c: CursoResumen) => navigate(RUTAS.admin.cursoDetalle(c.id)),
      publicar: (c: CursoResumen) => abrir("publicar", c),
      archivar: (c: CursoResumen) => abrir("archivar", c),
      desarchivar: (c: CursoResumen) => abrir("desarchivar", c),
      duplicar: (c: CursoResumen) => abrir("duplicar", c),
    },
    ejecutar: {
      crear: async (input: CrearCursoInput) => {
        const creado = await crear.mutateAsync(input)
        toast.success(`Curso «${creado.titulo}» creado en borrador`)
        cerrar()
        navigate(RUTAS.admin.cursoDetalle(creado.id))
      },
      publicar: (motivo: string) =>
        conCurso(async (c) => {
          await publicar.mutateAsync({ id: c.id, motivo: motivo.trim() || undefined })
          toast.success(`Curso «${c.titulo}» publicado`)
        }),
      archivar: (motivo: string) =>
        conCurso(async (c) => {
          await archivar.mutateAsync({ id: c.id, motivo })
          toast.success(`Curso «${c.titulo}» archivado`)
        }),
      desarchivar: () =>
        conCurso(async (c) => {
          await desarchivar.mutateAsync(c.id)
          toast.success(`Curso «${c.titulo}» desarchivado`)
        }),
      duplicar: (input: { readonly tituloNuevo: string; readonly motivo: string }) =>
        conCurso(async (c) => {
          const res = await duplicar.mutateAsync({
            id: c.id,
            input: { tituloNuevo: input.tituloNuevo },
            motivo: input.motivo,
          })
          toast.success(`Curso duplicado como «${res.curso.titulo}»`)
          navigate(RUTAS.admin.cursoDetalle(res.curso.id))
        }),
    },
    estado: {
      enviandoCrear: crear.isPending,
      enviandoPublicar: publicar.isPending,
      enviandoArchivar: archivar.isPending,
      enviandoDesarchivar: desarchivar.isPending,
      enviandoDuplicar: duplicar.isPending,
    },
  }
}

export type CursosOrquestacion = ReturnType<typeof useCursosOrquestacion>
