import QRCode from "qrcode"
import { useEffect, useState } from "react"

interface QrCodeState {
  readonly svg: string | null
  readonly error: string | null
}

/**
 * Genera un QR como string SVG inline. Util para incrustar sin <img>:
 *   <div dangerouslySetInnerHTML={{ __html: svg }} />
 *
 * El SVG es accesible y escalable sin perdida.
 */
export function useQrCode(value: string, size = 224): QrCodeState {
  const [state, setState] = useState<QrCodeState>({ svg: null, error: null })

  useEffect(() => {
    let cancelled = false
    QRCode.toString(value, {
      type: "svg",
      errorCorrectionLevel: "M",
      margin: 1,
      width: size,
      color: {
        dark: "#0f0f0f",
        light: "#ffffff",
      },
    })
      .then((svg) => {
        if (!cancelled) {
          setState({ svg, error: null })
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({
            svg: null,
            error: err instanceof Error ? err.message : "No se pudo generar el QR",
          })
        }
      })
    return () => {
      cancelled = true
    }
  }, [value, size])

  return state
}
