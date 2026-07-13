import { Button } from "@/shared/components/ui/button"
import { ImageUp } from "lucide-react"
import { type ChangeEvent, useRef } from "react"
import { useSubirImagen } from "../hooks/use-subir-imagen"

interface ZonaSubirArchivoProps {
  /** Se llama con la URL absoluta de la imagen ya guardada en el servidor. */
  readonly onSubido: (url: string) => void
}

/**
 * Zona de subida de archivo: input file oculto + botón + estado de subida.
 * Encapsula el `useSubirImagen` para que el diálogo solo reciba la URL final.
 */
export function ZonaSubirArchivo({ onSubido }: ZonaSubirArchivoProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const subir = useSubirImagen()

  async function alElegirArchivo(evento: ChangeEvent<HTMLInputElement>) {
    const archivo = evento.target.files?.[0]
    evento.target.value = ""
    if (!archivo) {
      return
    }
    const resultado = await subir.mutateAsync(archivo).catch(() => null)
    if (resultado) {
      onSubido(resultado.url)
    }
  }

  return (
    <div className="flex flex-col items-start gap-3 rounded-lg border border-border border-dashed bg-subtle/40 p-5">
      <Button
        variant="secondary"
        size="sm"
        onClick={() => inputRef.current?.click()}
        isLoading={subir.isPending}
      >
        <ImageUp className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
        Elegir archivo
      </Button>
      <p className="text-caption text-text-tertiary">PNG · JPG · WebP · GIF · máx 5 MB</p>
      <input
        ref={inputRef}
        type="file"
        aria-label="Elegir imagen"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={alElegirArchivo}
      />
      {subir.isError ? (
        <p className="text-body-sm text-danger-on-soft">
          No pudimos subir la imagen. Revisa el formato y el tamaño, y reintenta.
        </p>
      ) : null}
    </div>
  )
}
