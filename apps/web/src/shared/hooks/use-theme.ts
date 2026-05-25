import { useCallback, useEffect, useSyncExternalStore } from "react"

export type Theme = "light" | "dark"
export type ThemeMode = Theme | "system"

const STORAGE_KEY = "nexott-theme"
const MEDIA_QUERY = "(prefers-color-scheme: dark)"

function obtenerTemaSistema(): Theme {
  if (typeof window === "undefined") {
    return "light"
  }
  return window.matchMedia(MEDIA_QUERY).matches ? "dark" : "light"
}

function leerModoGuardado(): ThemeMode {
  if (typeof window === "undefined") {
    return "system"
  }
  const valor = window.localStorage.getItem(STORAGE_KEY)
  if (valor === "light" || valor === "dark" || valor === "system") {
    return valor
  }
  return "system"
}

function aplicarTema(tema: Theme): void {
  document.documentElement.setAttribute("data-theme", tema)
  document.querySelector('meta[name="color-scheme"]')?.setAttribute("content", tema)
}

function subscribirseAModoYSistema(callback: () => void): () => void {
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      callback()
    }
  }
  const onSystem = () => callback()
  window.addEventListener("storage", onStorage)
  window.matchMedia(MEDIA_QUERY).addEventListener("change", onSystem)
  return () => {
    window.removeEventListener("storage", onStorage)
    window.matchMedia(MEDIA_QUERY).removeEventListener("change", onSystem)
  }
}

interface UseThemeResult {
  readonly modo: ThemeMode
  readonly temaEfectivo: Theme
  readonly setModo: (modo: ThemeMode) => void
  readonly toggle: () => void
}

export function useTheme(): UseThemeResult {
  const modo = useSyncExternalStore(
    subscribirseAModoYSistema,
    leerModoGuardado,
    () => "system" as ThemeMode,
  )

  const temaEfectivo: Theme = modo === "system" ? obtenerTemaSistema() : modo

  useEffect(() => {
    aplicarTema(temaEfectivo)
  }, [temaEfectivo])

  const setModo = useCallback((siguiente: ThemeMode) => {
    window.localStorage.setItem(STORAGE_KEY, siguiente)
    window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY, newValue: siguiente }))
  }, [])

  const toggle = useCallback(() => {
    const actual = leerModoGuardado()
    const efectivo: Theme = actual === "system" ? obtenerTemaSistema() : actual
    setModo(efectivo === "dark" ? "light" : "dark")
  }, [setModo])

  return { modo, temaEfectivo, setModo, toggle }
}
