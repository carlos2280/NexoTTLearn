import { useDesactivarMfaPropio } from "@/features/auth/hooks/use-mfa-desactivar-propio"
import { ApiError } from "@/shared/api/api-error"
import { Banner } from "@/shared/components/ui/banner"
import { Button } from "@/shared/components/ui/button"
import { Dialog, DialogFooter } from "@/shared/components/ui/dialog"
import { Field } from "@/shared/components/ui/field"
import { Input } from "@/shared/components/ui/input"
import { Textarea } from "@/shared/components/ui/textarea"
import { type FormEvent, useEffect, useState } from "react"
import { toast } from "sonner"

const REGEX_TOTP = /^\d{6}$/u
const REGEX_NO_DIGITO = /\D/g

interface MfaDesactivarDialogProps {
  readonly abierto: boolean
  readonly onCambiarAbierto: (abierto: boolean) => void
}

export function MfaDesactivarDialog({ abierto, onCambiarAbierto }: MfaDesactivarDialogProps) {
  const [codigo, setCodigo] = useState("")
  const [motivo, setMotivo] = useState("")
  const [errorCodigo, setErrorCodigo] = useState<string | null>(null)
  const mutacion = useDesactivarMfaPropio()
  const apiError = mutacion.error instanceof ApiError ? mutacion.error : null

  useEffect(() => {
    if (!abierto) {
      setCodigo("")
      setMotivo("")
      setErrorCodigo(null)
      mutacion.reset()
    }
  }, [abierto, mutacion])

  const motivoValido = motivo.trim().length > 0
  const codigoValido = REGEX_TOTP.test(codigo)

  async function manejarSubmit(event: FormEvent) {
    event.preventDefault()
    setErrorCodigo(null)
    if (!codigoValido) {
      setErrorCodigo("Debe ser un código de 6 dígitos.")
      return
    }
    if (!motivoValido) {
      return
    }
    try {
      await mutacion.mutateAsync({ codigo, motivo: motivo.trim() })
      toast.success("Doble factor desactivado")
      onCambiarAbierto(false)
    } catch {
      // apiError muestra el detalle
    }
  }

  return (
    <Dialog
      abierto={abierto}
      onCambiarAbierto={onCambiarAbierto}
      titulo="Desactivar verificación en dos pasos"
      descripcion="Tu cuenta dejará de pedir código tras el login. Introduce un código válido y el motivo para el log auditable."
    >
      <form onSubmit={manejarSubmit} className="flex flex-col gap-4">
        {apiError ? <Banner tone="danger">{apiError.message}</Banner> : null}
        <Field label="Código de 6 dígitos" error={errorCodigo ?? undefined}>
          {(p) => (
            <Input
              {...p}
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.replace(REGEX_NO_DIGITO, "").slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="000000"
              hasError={Boolean(errorCodigo)}
            />
          )}
        </Field>
        <Field label="Motivo (obligatorio)">
          {(p) => (
            <Textarea
              {...p}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={2}
              placeholder="Por qué desactivas el doble factor…"
            />
          )}
        </Field>
        <DialogFooter>
          <Button
            variant="secondary"
            size="sm"
            type="button"
            onClick={() => onCambiarAbierto(false)}
          >
            Cancelar
          </Button>
          <Button
            variant="danger"
            size="sm"
            type="submit"
            disabled={!(codigoValido && motivoValido)}
            isLoading={mutacion.isPending}
          >
            Desactivar
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
