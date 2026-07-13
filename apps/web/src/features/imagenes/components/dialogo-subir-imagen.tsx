import { Button } from "@/shared/components/ui/button"
import { Dialog } from "@/shared/components/ui/dialog"
import { Field } from "@/shared/components/ui/field"
import { Input } from "@/shared/components/ui/input"
import { Link2, UploadCloud } from "lucide-react"
import { useState } from "react"
import { BotonModoImagen } from "./boton-modo-imagen"
import { ZonaSubirArchivo } from "./zona-subir-archivo"

interface DialogoSubirImagenProps {
  readonly abierto: boolean
  readonly onCambiarAbierto: (abierto: boolean) => void
  readonly onInsertar: (datos: { readonly url: string; readonly alt: string }) => void
}

type Modo = "subir" | "url"

export function DialogoSubirImagen({
  abierto,
  onCambiarAbierto,
  onInsertar,
}: DialogoSubirImagenProps) {
  const [modo, setModo] = useState<Modo>("subir")
  const [url, setUrl] = useState("")
  const [alt, setAlt] = useState("")
  const [previewRota, setPreviewRota] = useState(false)

  function cambiarUrl(valor: string) {
    setUrl(valor)
    setPreviewRota(false)
  }

  function cerrar() {
    onCambiarAbierto(false)
    setModo("subir")
    setUrl("")
    setAlt("")
    setPreviewRota(false)
  }

  function insertar() {
    const limpia = url.trim()
    if (limpia.length === 0) {
      return
    }
    onInsertar({ url: limpia, alt: alt.trim() })
    cerrar()
  }

  return (
    <Dialog
      abierto={abierto}
      onCambiarAbierto={(v) => (v ? onCambiarAbierto(true) : cerrar())}
      titulo="Insertar imagen"
      descripcion="Sube una imagen (se guarda en el servidor) o pega la URL de una ya alojada."
    >
      <div className="flex flex-col gap-4 px-6 py-5">
        <div className="flex gap-1 rounded-lg border border-border bg-subtle/50 p-1">
          <BotonModoImagen
            activo={modo === "subir"}
            onClick={() => setModo("subir")}
            icono={UploadCloud}
          >
            Subir archivo
          </BotonModoImagen>
          <BotonModoImagen activo={modo === "url"} onClick={() => setModo("url")} icono={Link2}>
            Pegar URL
          </BotonModoImagen>
        </div>

        {modo === "subir" ? (
          <ZonaSubirArchivo onSubido={cambiarUrl} />
        ) : (
          <Field label="URL de la imagen">
            {(attrs) => (
              <Input
                {...attrs}
                type="url"
                value={url}
                onChange={(e) => cambiarUrl(e.target.value)}
                placeholder="https://…"
              />
            )}
          </Field>
        )}

        {url.length > 0 && !previewRota ? (
          <img
            src={url}
            alt={alt || "Vista previa"}
            onError={() => setPreviewRota(true)}
            className="max-h-40 w-auto rounded-lg border border-border object-contain"
          />
        ) : null}

        <Field label="Texto alternativo" hint="Describe la imagen para accesibilidad.">
          {(attrs) => (
            <Input
              {...attrs}
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              placeholder="Ej. Diagrama del flujo de login"
            />
          )}
        </Field>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={cerrar}>
            Cancelar
          </Button>
          <Button onClick={insertar} disabled={url.trim().length === 0}>
            Insertar
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
