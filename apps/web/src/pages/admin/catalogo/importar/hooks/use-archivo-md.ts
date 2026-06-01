import { useCallback, useState } from "react"

interface ArchivoMd {
  readonly nombre: string
  readonly tamanoBytes: number
  readonly contenido: string
}

interface UseArchivoMdResult {
  readonly archivo: ArchivoMd | null
  readonly error: string | null
  readonly cargarDesdeFile: (file: File) => Promise<void>
  readonly limpiar: () => void
}

const TAMANO_MAX_BYTES = 2_000_000 // 2 MB — alineado con el límite del backend.

/**
 * Estado local del archivo `.md` seleccionado por el admin. Lee el archivo
 * con `FileReader`, valida tamaño + extensión, y deja el contenido listo
 * para enviarse al endpoint de importación.
 */
export function useArchivoMd(): UseArchivoMdResult {
  const [archivo, setArchivo] = useState<ArchivoMd | null>(null)
  const [error, setError] = useState<string | null>(null)

  const cargarDesdeFile = useCallback(async (file: File) => {
    setError(null)
    if (!file.name.toLowerCase().endsWith(".md")) {
      setError("El archivo debe tener extensión .md")
      return
    }
    if (file.size > TAMANO_MAX_BYTES) {
      setError(`El archivo supera el límite de ${TAMANO_MAX_BYTES / 1_000_000} MB.`)
      return
    }
    try {
      const contenido = await file.text()
      setArchivo({ nombre: file.name, tamanoBytes: file.size, contenido })
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo leer el archivo."
      setError(msg)
    }
  }, [])

  const limpiar = useCallback(() => {
    setArchivo(null)
    setError(null)
  }, [])

  return { archivo, error, cargarDesdeFile, limpiar }
}
