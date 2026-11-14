import { descargarPlantillaCurso } from "@/features/cursos/api/importar-curso.api"
import { useState } from "react"

/** Descarga la plantilla `.md` del backend como archivo `curso-plantilla.md`. */
export function useDescargarPlantilla() {
  const [descargando, setDescargando] = useState(false)

  const descargar = async () => {
    setDescargando(true)
    try {
      const md = await descargarPlantillaCurso()
      const blob = new Blob([md], { type: "text/markdown;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = "curso-plantilla.md"
      link.click()
      URL.revokeObjectURL(url)
    } finally {
      setDescargando(false)
    }
  }

  return { descargar, descargando }
}
