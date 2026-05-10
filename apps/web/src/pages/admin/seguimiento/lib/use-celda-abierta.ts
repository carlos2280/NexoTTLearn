import type { MatrizAreaHeader, MatrizFila } from "@nexott-learn/shared-types"
import { useCallback, useState } from "react"

export interface CeldaSeleccion {
  readonly inscripcionId: string
  readonly areaId: string
  readonly fila: MatrizFila
  readonly area: MatrizAreaHeader
}

export function useCeldaAbierta() {
  const [celda, setCelda] = useState<CeldaSeleccion | null>(null)
  const [areaCross, setAreaCross] = useState<MatrizAreaHeader | null>(null)

  const abrirCelda = useCallback((fila: MatrizFila, area: MatrizAreaHeader) => {
    setAreaCross(null)
    setCelda({ inscripcionId: fila.inscripcionId, areaId: area.id, fila, area })
  }, [])

  const abrirAreaCross = useCallback((area: MatrizAreaHeader) => {
    setCelda(null)
    setAreaCross(area)
  }, [])

  const cerrar = useCallback(() => {
    setCelda(null)
    setAreaCross(null)
  }, [])

  const cerrarCelda = useCallback(() => {
    setCelda(null)
  }, [])

  const cerrarAreaCross = useCallback(() => {
    setAreaCross(null)
  }, [])

  return { celda, areaCross, abrirCelda, abrirAreaCross, cerrar, cerrarCelda, cerrarAreaCross }
}
