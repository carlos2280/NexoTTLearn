import { Button } from "@/shared/components/ui/button"
import { Dialog, DialogFooter } from "@/shared/components/ui/dialog"
import { TextField } from "@/shared/components/ui/text-field"
import { type FormEvent, useEffect, useState } from "react"

interface BuilderSeccionDialogProps {
  readonly abierto: boolean
  readonly onCambiarAbierto: (abierto: boolean) => void
  readonly modo: "crear" | "renombrar"
  readonly tituloInicial?: string
  readonly enviando: boolean
  readonly onGuardar: (titulo: string) => Promise<void> | void
}

export function BuilderSeccionDialog({
  abierto,
  onCambiarAbierto,
  modo,
  tituloInicial,
  enviando,
  onGuardar,
}: BuilderSeccionDialogProps) {
  const [titulo, setTitulo] = useState(tituloInicial ?? "")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (abierto) {
      setTitulo(tituloInicial ?? "")
      setError(null)
    }
  }, [abierto, tituloInicial])

  async function manejarSubmit(e: FormEvent) {
    e.preventDefault()
    const limpio = titulo.trim()
    if (limpio.length === 0) {
      setError("El título no puede estar vacío.")
      return
    }
    setError(null)
    await onGuardar(limpio)
  }

  return (
    <Dialog
      abierto={abierto}
      onCambiarAbierto={onCambiarAbierto}
      titulo={modo === "crear" ? "Nueva sección" : "Renombrar sección"}
      descripcion={
        modo === "crear"
          ? "Las secciones agrupan los bloques que enseñan una skill concreta."
          : "Cambia el título visible para los participantes."
      }
    >
      <form onSubmit={manejarSubmit} className="flex flex-col gap-3">
        <TextField
          label="Título"
          autoFocus={true}
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          error={error ?? undefined}
          placeholder="Ej. Tipos y narrowing"
          maxLength={200}
        />
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onCambiarAbierto(false)}
            disabled={enviando}
          >
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={enviando}>
            {modo === "crear" ? "Crear sección" : "Guardar"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
