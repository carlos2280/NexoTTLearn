import { useEffect, useState } from "react"

export type Theme = "dark" | "light"

const STORAGE_KEY = "nx-theme"

function readTheme(): Theme {
  if (typeof document === "undefined") {
    return "dark"
  }
  const attr = document.documentElement.getAttribute("data-theme")
  return attr === "light" ? "light" : "dark"
}

function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute("data-theme", theme)
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // ignorar (modo privado / sin permisos)
  }
}

export interface UseThemeResult {
  readonly theme: Theme
  readonly toggle: () => void
  readonly setTheme: (next: Theme) => void
}

export function useTheme(): UseThemeResult {
  const [theme, setThemeState] = useState<Theme>(() => readTheme())

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  return {
    theme,
    setTheme: setThemeState,
    toggle: () => setThemeState((t) => (t === "dark" ? "light" : "dark")),
  }
}
