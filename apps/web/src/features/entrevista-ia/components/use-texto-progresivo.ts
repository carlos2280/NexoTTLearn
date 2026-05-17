import { useEffect, useState } from "react"

const RGX_ESPACIOS = /\s+/

/**
 * Reproduce un texto palabra-a-palabra simulando que la IA "habla" en tiempo
 * real. Usado para que `MensajeEvaluador` aparezca con streaming visual aunque
 * el mock no soporte SSE/streaming real (B-17). Cuando el backend implemente
 * streaming, este hook se reemplaza por una suscripcion al stream.
 *
 *  - `texto`: el mensaje completo final.
 *  - `velocidadMs`: ms entre palabras (default 45 — sensacion natural).
 *  - `activado`: si false, el texto se muestra de golpe (respeta reduced-motion
 *    y el caso "ya estaba en transcripcion al cargar la pantalla").
 *
 * Devuelve la porcion progresiva del texto y un flag `terminado`.
 */
export function useTextoProgresivo(input: {
  readonly texto: string
  readonly velocidadMs?: number
  readonly activado: boolean
}): { readonly visible: string; readonly terminado: boolean } {
  const { texto, velocidadMs = 45, activado } = input
  const [palabrasVisibles, setPalabrasVisibles] = useState<number>(
    activado ? 0 : Number.POSITIVE_INFINITY,
  )

  useEffect(() => {
    if (!activado) {
      setPalabrasVisibles(Number.POSITIVE_INFINITY)
      return
    }
    setPalabrasVisibles(0)
    const palabras = texto.split(RGX_ESPACIOS)
    let i = 0
    const id = window.setInterval(() => {
      i += 1
      setPalabrasVisibles(i)
      if (i >= palabras.length) {
        window.clearInterval(id)
      }
    }, velocidadMs)
    return () => window.clearInterval(id)
  }, [texto, velocidadMs, activado])

  const palabras = texto.split(RGX_ESPACIOS)
  const visible = palabras.slice(0, palabrasVisibles).join(" ")
  const terminado = palabrasVisibles >= palabras.length
  return { visible, terminado }
}
