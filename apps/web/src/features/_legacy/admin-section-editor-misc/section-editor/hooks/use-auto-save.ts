import { useCallback, useEffect, useRef, useState } from "react"

export type AutoSaveState = "idle" | "saving" | "saved" | "error"

interface UseAutoSaveOptions<T> {
  /** Valor controlado a observar. Cuando cambia, se programa el save. */
  readonly value: T
  /** Valor inicial (hidrata el ref para no disparar al montar). */
  readonly initial: T
  /** Comparador de igualdad. Default: Object.is. */
  readonly equals?: (a: T, b: T) => boolean
  /** Funcion de save. Recibe el valor mas reciente. */
  readonly save: (value: T) => Promise<void>
  /** Debounce en ms. Default 800. */
  readonly debounceMs?: number
}

export interface UseAutoSaveResult {
  readonly state: AutoSaveState
  /** Timestamp del ultimo save exitoso (Date.now()), o null. */
  readonly lastSavedAt: number | null
  /** Forzar guardado inmediato (cancela debounce). Util en blur. */
  readonly flush: () => void
}

/**
 * Auto-save con debounce. Observa `value`; cuando cambia, programa un save
 * tras `debounceMs`. Si llega un cambio mas reciente, cancela el pendiente.
 *
 * El estado expuesto sirve para alimentar un indicador "Guardado · hace Xs"
 * en la UI. El consumidor puede llamar `flush()` en blur para forzar el save
 * sin esperar el debounce.
 *
 * No persiste fuera del ciclo del componente — si el usuario navega antes de
 * que el debounce dispare, el cambio se pierde. Para evitarlo, llamar `flush`
 * en el unmount o antes del navigate.
 */
export function useAutoSave<T>({
  value,
  initial,
  equals,
  save,
  debounceMs = 800,
}: UseAutoSaveOptions<T>): UseAutoSaveResult {
  const [state, setState] = useState<AutoSaveState>("idle")
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null)

  const eq = equals ?? Object.is
  const lastSavedValueRef = useRef<T>(initial)
  const pendingValueRef = useRef<T>(initial)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const saveRef = useRef(save)

  // Mantenemos `save` siempre actual sin re-disparar el efecto del debounce.
  useEffect(() => {
    saveRef.current = save
  }, [save])

  const doSave = useCallback(
    async (next: T) => {
      setState("saving")
      try {
        await saveRef.current(next)
        // Solo aceptamos el resultado si el valor que guardamos sigue siendo
        // el ultimo intentado. Si entre tanto cambio, dejamos que el siguiente
        // ciclo lo maneje.
        if (eq(pendingValueRef.current, next)) {
          lastSavedValueRef.current = next
          setLastSavedAt(Date.now())
          setState("saved")
        }
      } catch {
        setState("error")
      }
    },
    [eq],
  )

  const flush = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    const pending = pendingValueRef.current
    if (eq(pending, lastSavedValueRef.current)) {
      return
    }
    doSave(pending).catch(() => {
      // Errores se reflejan en `state` via doSave; aqui silenciamos el reject.
    })
  }, [doSave, eq])

  useEffect(() => {
    pendingValueRef.current = value
    if (eq(value, lastSavedValueRef.current)) {
      return
    }
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    timerRef.current = setTimeout(() => {
      timerRef.current = null
      doSave(value).catch(() => {
        // Errores se reflejan en `state` via doSave.
      })
    }, debounceMs)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [value, debounceMs, doSave, eq])

  return { state, lastSavedAt, flush }
}
