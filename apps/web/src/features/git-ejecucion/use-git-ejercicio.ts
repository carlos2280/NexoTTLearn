import type { ObjetivoGit } from "@nexott-learn/shared-types"
import { useMemo, useRef, useState } from "react"
import { ejecutarComando } from "./ejecutar-comando"
import { type EstadoGit, estadoInicial } from "./motor-git"
import { objetivoCumplido } from "./objetivo-git"

export interface LineaTerminal {
  /** Id monotónico para usar como `key` estable (el historial es append-only). */
  readonly id: number
  readonly comando: string
  readonly salida: string
  readonly error: boolean
}

interface UseGitEjercicioResult {
  readonly estado: EstadoGit
  readonly historial: readonly LineaTerminal[]
  readonly logrado: boolean
  readonly ejecutar: (linea: string) => void
  readonly reiniciar: () => void
}

/**
 * Estado del bloque de git: repo simulado en memoria + historial del terminal +
 * detección de "logrado" contra el objetivo declarativo del ejercicio. Sin
 * efectos externos: el bloque es autocontenido (no registra intento ni nota).
 */
export function useGitEjercicio(objetivo: ObjetivoGit): UseGitEjercicioResult {
  const [estado, setEstado] = useState<EstadoGit>(estadoInicial)
  const [historial, setHistorial] = useState<readonly LineaTerminal[]>([])
  const siguienteId = useRef(0)
  const logrado = useMemo(() => objetivoCumplido(estado, objetivo), [estado, objetivo])

  const ejecutar = (linea: string): void => {
    const r = ejecutarComando(estado, linea)
    // Línea vacía (sin comando ni mensaje): no ensucia el terminal.
    if (!r.reconocido && r.salida === "") {
      return
    }
    const nueva: LineaTerminal = {
      id: siguienteId.current++,
      comando: linea,
      salida: r.salida,
      error: r.error,
    }
    setEstado(r.estado)
    setHistorial((h) => [...h, nueva])
  }

  const reiniciar = (): void => {
    siguienteId.current = 0
    setEstado(estadoInicial())
    setHistorial([])
  }

  return { estado, historial, logrado, ejecutar, reiniciar }
}
