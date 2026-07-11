import { DialogoSubirImagen } from "@/features/imagenes/components/dialogo-subir-imagen"
import type { Editor } from "@tiptap/react"
import { Image as ImageIcon } from "lucide-react"
import { useState } from "react"
import { Boton } from "./tiptap-toolbar-boton"

interface BotonImagenProps {
  readonly editor: Editor
}

/**
 * Botón "Imagen" de la toolbar: abre el diálogo de subida/URL y, al confirmar,
 * inserta la imagen en el editor con su `src` y `alt`. Encapsula su propio
 * estado para no engordar la toolbar.
 */
export function BotonImagen({ editor }: BotonImagenProps) {
  const [abierto, setAbierto] = useState(false)

  return (
    <>
      <Boton icono={ImageIcon} etiqueta="Imagen" onClick={() => setAbierto(true)} />
      <DialogoSubirImagen
        abierto={abierto}
        onCambiarAbierto={setAbierto}
        onInsertar={({ url, alt }) => {
          editor.chain().focus().setImage({ src: url, alt }).run()
        }}
      />
    </>
  )
}
