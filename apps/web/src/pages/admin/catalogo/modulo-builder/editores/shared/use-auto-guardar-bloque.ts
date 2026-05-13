import { usePatchBloque } from "@/features/catalogo/hooks/use-mutaciones-bloques"
import { useEffect, useRef, useState } from "react"
import { useGuardadoBuilder } from "../../contexto-guardado"

const DEBOUNCE_MS = 800

export type EstadoGuardado = "limpio" | "pendiente" | "guardando" | "guardado" | "error"

interface UseAutoGuardarBloqueArgs {
  readonly bloqueId: string
  /**
   * Reconstruye el `contenido` a persistir cuando el debounce vence.
   * Devuelve null si no hay cambios reales (skip).
   */
  readonly construirContenido: () => Record<string, unknown> | null
}

/**
 * Autoguardado en modo COSMETICO con debounce. La clasificacion
 * COSMETICO/CAMBIA_EVALUACION explicita llega en B5; por ahora todos los
 * editores que NO afectan a la evaluacion (PARRAFO, TIP) son cosmeticos.
 */
export function useAutoGuardarBloque({ bloqueId, construirContenido }: UseAutoGuardarBloqueArgs) {
  const patch = usePatchBloque()
  const guardadoBuilder = useGuardadoBuilder()
  const [estado, setEstadoLocal] = useState<EstadoGuardado>("limpio")
  const timerRef = useRef<number | null>(null)
  const construirRef = useRef(construirContenido)

  function setEstado(siguiente: EstadoGuardado) {
    setEstadoLocal(siguiente)
    guardadoBuilder.reportar(siguiente)
  }

  // Reset estado global al desmontar (cambiar de bloque)
  // biome-ignore lint/correctness/useExhaustiveDependencies: bloqueId dispara el reset; guardadoBuilder.reset es estable y se omite del array intencionalmente
  useEffect(() => {
    return () => {
      guardadoBuilder.reset()
    }
  }, [bloqueId])

  // Mantener la referencia actualizada sin re-disparar el timer
  useEffect(() => {
    construirRef.current = construirContenido
  })

  // Limpiar timer al desmontar
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current)
      }
    }
  }, [])

  function marcarSucio() {
    setEstado("pendiente")
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
    }
    timerRef.current = window.setTimeout(() => {
      guardar().catch(() => {
        // el error ya se captura dentro de guardar() — noop aquí
      })
    }, DEBOUNCE_MS)
  }

  async function guardar() {
    const contenido = construirRef.current()
    if (!contenido) {
      setEstado("limpio")
      return
    }
    setEstado("guardando")
    try {
      await patch.mutateAsync({
        bloqueId,
        input: { tipoEdicion: "COSMETICO", contenido },
      })
      setEstado("guardado")
    } catch {
      setEstado("error")
    }
  }

  return {
    estado,
    marcarSucio,
    forzarGuardado: guardar,
  }
}
