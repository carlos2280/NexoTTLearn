import { useCargarCapaTests } from "@/features/transversal/hooks/use-cargar-capa-tests"
import { type FormEvent, useEffect, useState } from "react"

export const NOTA_MIN = 0
export const NOTA_MAX = 100

interface Params {
  readonly intentoId: string
  readonly notaActual: number | null
  readonly abierto: boolean
  readonly onCerrar: () => void
}

interface Errores {
  readonly nota: string | null
  readonly detalle: string | null
  readonly general: string | null
}

export function useFormCapaTests(params: Params) {
  const { intentoId, notaActual, abierto, onCerrar } = params
  const [nota, setNota] = useState("")
  const [detalleTxt, setDetalleTxt] = useState("")
  const [errores, setErrores] = useState<Errores>({ nota: null, detalle: null, general: null })
  const mutation = useCargarCapaTests()

  useEffect(() => {
    if (!abierto) {
      return
    }
    setNota(notaActual !== null ? String(notaActual) : "")
    setDetalleTxt("")
    setErrores({ nota: null, detalle: null, general: null })
  }, [abierto, notaActual])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const notaNum = Number(nota)
    if (!Number.isInteger(notaNum) || notaNum < NOTA_MIN || notaNum > NOTA_MAX) {
      setErrores({
        nota: `Ingresa un entero entre ${NOTA_MIN} y ${NOTA_MAX}.`,
        detalle: null,
        general: null,
      })
      return
    }
    let detalleObj: Record<string, unknown>
    try {
      const parsed: unknown = JSON.parse(detalleTxt.trim() || "{}")
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        setErrores({ nota: null, detalle: "El detalle debe ser un objeto JSON.", general: null })
        return
      }
      detalleObj = parsed as Record<string, unknown>
    } catch {
      setErrores({ nota: null, detalle: "JSON inválido. Revisa la sintaxis.", general: null })
      return
    }
    try {
      await mutation.mutateAsync({ intentoId, body: { nota: notaNum, detalle: detalleObj } })
      onCerrar()
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo cargar la capa."
      setErrores({ nota: null, detalle: null, general: msg })
    }
  }

  return {
    nota,
    setNota,
    detalleTxt,
    setDetalleTxt,
    errores,
    enviando: mutation.isPending,
    handleSubmit,
  }
}
