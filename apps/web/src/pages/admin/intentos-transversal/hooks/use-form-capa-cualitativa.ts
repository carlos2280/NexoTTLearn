import { useCargarCapaCualitativa } from "@/features/transversal/hooks/use-cargar-capa-cualitativa"
import { type FormEvent, useEffect, useState } from "react"
import {
  type Confianza,
  ERRORES_CUALITATIVA_VACIOS,
  type ErroresCualitativa,
  validarCualitativa,
} from "./cualitativa-validar"

interface Params {
  readonly intentoId: string
  readonly notaActual: number | null
  readonly abierto: boolean
  readonly onCerrar: () => void
}

export function useFormCapaCualitativa(params: Params) {
  const { intentoId, notaActual, abierto, onCerrar } = params
  const [nota, setNota] = useState("")
  const [comentario, setComentario] = useState("")
  const [confianza, setConfianza] = useState<Confianza>("MEDIA")
  const [errores, setErrores] = useState<ErroresCualitativa>(ERRORES_CUALITATIVA_VACIOS)
  const mutation = useCargarCapaCualitativa()

  useEffect(() => {
    if (!abierto) {
      return
    }
    setNota(notaActual !== null ? String(notaActual) : "")
    setComentario("")
    setConfianza("MEDIA")
    setErrores(ERRORES_CUALITATIVA_VACIOS)
  }, [abierto, notaActual])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const { errores: err, body } = validarCualitativa(nota, comentario, confianza)
    if (!body) {
      setErrores(err)
      return
    }
    try {
      await mutation.mutateAsync({ intentoId, body })
      onCerrar()
    } catch (e) {
      const msg = e instanceof Error ? e.message : "No se pudo cargar la capa."
      setErrores({ ...ERRORES_CUALITATIVA_VACIOS, general: msg })
    }
  }

  return {
    nota,
    setNota,
    comentario,
    setComentario,
    confianza,
    setConfianza,
    errores,
    enviando: mutation.isPending,
    handleSubmit,
  }
}
