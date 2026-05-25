import { Banner } from "@/shared/components/ui/banner"
import { Button } from "@/shared/components/ui/button"
import type { PreviewResponse } from "@nexott-learn/shared-types"
import { UploadCloud } from "lucide-react"
import { type ChangeEvent, useRef, useState } from "react"
import { useCrearPreview } from "../hooks/use-mutaciones-evaluacion"

interface FlujoPasoSubirProps {
  readonly cursoId: string
  readonly onPreview: (preview: PreviewResponse) => void
  readonly onAtras: () => void
}

const MAX_BYTES = 10 * 1024 * 1024

export function FlujoPasoSubir({ cursoId, onPreview, onAtras }: FlujoPasoSubirProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [archivo, setArchivo] = useState<File | null>(null)
  const [errorLocal, setErrorLocal] = useState<string | null>(null)
  const crear = useCrearPreview()

  function manejarCambio(event: ChangeEvent<HTMLInputElement>): void {
    const seleccionado = event.target.files?.[0] ?? null
    setErrorLocal(null)
    if (!seleccionado) {
      setArchivo(null)
      return
    }
    if (seleccionado.size > MAX_BYTES) {
      setErrorLocal("El archivo supera los 10 MB permitidos.")
      setArchivo(null)
      return
    }
    if (!seleccionado.name.toLowerCase().endsWith(".xlsx")) {
      setErrorLocal("Solo se acepta formato .xlsx")
      setArchivo(null)
      return
    }
    setArchivo(seleccionado)
  }

  async function manejarSubir(): Promise<void> {
    if (!archivo) {
      return
    }
    try {
      const preview = await crear.mutateAsync({ cursoId, archivo })
      onPreview(preview)
    } catch {
      // queda expuesto en crear.error
    }
  }

  const errorApi = crear.error

  return (
    <div className="flex flex-col gap-4">
      <p className="text-body-sm text-text-secondary">
        Sube el archivo .xlsx relleno. El sistema validará celda a celda antes de aplicar nada.
      </p>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex flex-col items-center gap-2 rounded-md border-2 border-border border-dashed bg-subtle/40 px-6 py-8 text-center transition-colors duration-fast ease-default hover:border-accent hover:bg-accent-soft/30 focus-visible:outline-2 focus-visible:outline-accent"
      >
        <UploadCloud className="h-6 w-6 text-text-tertiary" strokeWidth={1.5} aria-hidden={true} />
        <span className="text-body-sm text-text-primary">
          {archivo ? archivo.name : "Haz click para seleccionar el .xlsx"}
        </span>
        <span className="text-caption text-text-tertiary">Máx. 10 MB</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        onChange={manejarCambio}
        className="hidden"
      />

      {errorLocal ? (
        <Banner tone="warning" title="Archivo no válido">
          {errorLocal}
        </Banner>
      ) : null}

      {errorApi ? (
        <Banner tone="danger" title="No se pudo procesar el archivo">
          {errorApi.message}
        </Banner>
      ) : null}

      <div className="flex items-center justify-between gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onAtras}>
          Atrás
        </Button>
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={manejarSubir}
          disabled={!archivo}
          isLoading={crear.isPending}
        >
          Subir y generar preview
        </Button>
      </div>
    </div>
  )
}
