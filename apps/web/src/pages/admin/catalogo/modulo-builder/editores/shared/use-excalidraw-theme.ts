import { useEffect, useState } from "react"

type ExcalidrawTheme = "light" | "dark"

/**
 * Lee `data-theme` del `<html>` y se suscribe a sus cambios con
 * MutationObserver. Devuelve el tema vigente como literal "light" | "dark"
 * para pasarlo directamente a Excalidraw via props.
 *
 * Sin polling: solo se re-renderiza cuando el atributo cambia (el toggle
 * de tema lo hace via `document.documentElement.setAttribute`).
 */
export function useExcalidrawTheme(): ExcalidrawTheme {
  const [theme, setTheme] = useState<ExcalidrawTheme>(() => leerTema())

  useEffect(() => {
    const root = document.documentElement
    const observer = new MutationObserver(() => {
      setTheme(leerTema())
    })
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] })
    return () => observer.disconnect()
  }, [])

  return theme
}

function leerTema(): ExcalidrawTheme {
  if (typeof document === "undefined") {
    return "light"
  }
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light"
}
