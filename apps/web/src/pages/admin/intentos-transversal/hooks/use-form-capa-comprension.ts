import { useCargarCapaComprension } from "@/features/transversal/hooks/use-cargar-capa-comprension"
import { type FormEvent, useEffect, useState } from "react"
import {
  ERRORES_COMPRENSION_VACIOS,
  type ErroresComprension,
  type RolTurno,
  TURNOS_MAX,
  type TurnoBorrador,
  validarComprension,
} from "./comprension-validar"

interface Params {
  readonly intentoId: string
  readonly notaActual: number | null
  readonly abierto: boolean
  readonly onCerrar: () => void
}

export function useFormCapaComprension(params: Params) {
  const { intentoId, notaActual, abierto, onCerrar } = params
  const [nota, setNota] = useState("")
  const [turnos, setTurnos] = useState<readonly TurnoBorrador[]>([
    { rol: "ASISTENTE", mensaje: "" },
  ])
  const [errores, setErrores] = useState<ErroresComprension>(ERRORES_COMPRENSION_VACIOS)
  const mutation = useCargarCapaComprension()

  useEffect(() => {
    if (!abierto) {
      return
    }
    setNota(notaActual !== null ? String(notaActual) : "")
    setTurnos([{ rol: "ASISTENTE", mensaje: "" }])
    setErrores(ERRORES_COMPRENSION_VACIOS)
  }, [abierto, notaActual])

  function agregarTurno() {
    if (turnos.length >= TURNOS_MAX) {
      return
    }
    const ultimo = turnos[turnos.length - 1]
    const sig: RolTurno = ultimo?.rol === "ASISTENTE" ? "COLABORADOR" : "ASISTENTE"
    setTurnos([...turnos, { rol: sig, mensaje: "" }])
  }
  const eliminarTurno = (i: number) => setTurnos(turnos.filter((_, k) => k !== i))
  const actualizarTurno = (i: number, parcial: Partial<TurnoBorrador>) =>
    setTurnos(turnos.map((t, k) => (k === i ? { ...t, ...parcial } : t)))

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const { errores: err, body } = validarComprension(nota, turnos)
    if (!body) {
      setErrores(err)
      return
    }
    try {
      await mutation.mutateAsync({ intentoId, body })
      onCerrar()
    } catch (e) {
      const msg = e instanceof Error ? e.message : "No se pudo cargar la capa."
      setErrores({ ...ERRORES_COMPRENSION_VACIOS, general: msg })
    }
  }

  return {
    nota,
    setNota,
    turnos,
    agregarTurno,
    eliminarTurno,
    actualizarTurno,
    errores,
    enviando: mutation.isPending,
    handleSubmit,
  }
}
