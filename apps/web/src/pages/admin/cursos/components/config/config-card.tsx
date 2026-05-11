import { ApiError } from "@/shared/api/api-error"
import { Button } from "@/shared/components/ui/button"
import { Field } from "@/shared/components/ui/field"
import { Textarea } from "@/shared/components/ui/textarea"
import type { LucideIcon } from "lucide-react"
import { type ReactNode, useState } from "react"
import { toast } from "sonner"

interface ConfigCardProps {
  readonly titulo: string
  readonly descripcion: string
  readonly icono: LucideIcon
  readonly exigeMotivo: boolean
  readonly modificado: boolean
  readonly enviando: boolean
  readonly deshabilitado?: boolean
  readonly mensajeDeshabilitado?: string
  readonly onGuardar: (motivo: string | undefined) => Promise<void>
  readonly mensajeExito?: string
  readonly children: ReactNode
}

export function ConfigCard({
  titulo,
  descripcion,
  icono: Icono,
  exigeMotivo,
  modificado,
  enviando,
  deshabilitado,
  mensajeDeshabilitado,
  onGuardar,
  mensajeExito = "Cambios guardados",
  children,
}: ConfigCardProps) {
  const [motivo, setMotivo] = useState("")
  const [error, setError] = useState<string | null>(null)

  const puedeGuardar = modificado && !deshabilitado && (!exigeMotivo || motivo.trim().length > 0)

  async function manejarGuardar() {
    setError(null)
    try {
      await onGuardar(exigeMotivo ? motivo.trim() : undefined)
      setMotivo("")
      toast.success(mensajeExito)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo guardar.")
    }
  }

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-5">
      <header className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent-on-soft">
          <Icono className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
        </div>
        <div className="flex flex-col">
          <h2 className="text-h3 text-text-primary">{titulo}</h2>
          <p className="text-body-sm text-text-secondary">{descripcion}</p>
        </div>
      </header>
      <div className="flex flex-col gap-3">{children}</div>
      {exigeMotivo ? (
        <Field label="Motivo (obligatorio para curso no-borrador)">
          {(p) => (
            <Textarea {...p} value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={2} />
          )}
        </Field>
      ) : null}
      {error ? (
        <p role="alert" className="text-body-sm text-danger-on-soft">
          {error}
        </p>
      ) : null}
      {deshabilitado && mensajeDeshabilitado ? (
        <p className="text-caption text-text-tertiary">{mensajeDeshabilitado}</p>
      ) : null}
      <footer className="-mx-5 -mb-5 mt-2 flex items-center justify-end gap-2 border-border border-t bg-subtle/40 px-5 py-3">
        <Button
          variant="primary"
          size="sm"
          type="button"
          disabled={!puedeGuardar}
          isLoading={enviando}
          onClick={manejarGuardar}
        >
          Guardar
        </Button>
      </footer>
    </section>
  )
}
