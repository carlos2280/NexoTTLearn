import { Button } from "@/shared/components/ui/button"
import { Check, Copy } from "lucide-react"
import { useEffect, useRef, useState } from "react"

interface BotonCopiarProps {
  readonly texto: string
  readonly etiqueta: string
  readonly etiquetaCopiado: string
}

/**
 * Copia un texto al portapapeles y confirma en el propio botón. Existe porque
 * quien detecta un reto roto en esta pantalla casi nunca es quien puede
 * arreglarlo: el valor está en poder pegar el contexto completo en un chat.
 */
export function BotonCopiar({ texto, etiqueta, etiquetaCopiado }: BotonCopiarProps) {
  const [copiado, setCopiado] = useState(false)
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (temporizador.current !== null) {
        clearTimeout(temporizador.current)
      }
    }
  }, [])

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto)
      setCopiado(true)
      temporizador.current = setTimeout(() => setCopiado(false), 1800)
    } catch {
      // Si el navegador bloquea el portapapeles, no rompemos el flujo.
    }
  }

  return (
    <Button variant="secondary" size="sm" onClick={copiar}>
      {copiado ? (
        <Check className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden={true} />
      ) : (
        <Copy className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden={true} />
      )}
      {copiado ? etiquetaCopiado : etiqueta}
    </Button>
  )
}
