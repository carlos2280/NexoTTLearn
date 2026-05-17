import { useHabilitarMfa } from "@/features/auth/hooks/use-mfa-habilitar"
import { useIniciarMfaSetup } from "@/features/auth/hooks/use-mfa-setup"
import { ApiError } from "@/shared/api/api-error"
import { Banner } from "@/shared/components/ui/banner"
import { Button } from "@/shared/components/ui/button"
import { Dialog, DialogFooter } from "@/shared/components/ui/dialog"
import { Field } from "@/shared/components/ui/field"
import { Input } from "@/shared/components/ui/input"
import { Skeleton } from "@/shared/components/ui/skeleton"
import type { MfaSetupResponse } from "@nexott-learn/shared-types"
import { type FormEvent, useEffect, useState } from "react"
import { toast } from "sonner"

const REGEX_TOTP = /^\d{6}$/u
const REGEX_NO_DIGITO = /\D/g

interface MfaActivarDialogProps {
  readonly abierto: boolean
  readonly onCambiarAbierto: (abierto: boolean) => void
}

export function MfaActivarDialog({ abierto, onCambiarAbierto }: MfaActivarDialogProps) {
  const [setupData, setSetupData] = useState<MfaSetupResponse | null>(null)
  const [codigo, setCodigo] = useState("")
  const [errorCodigo, setErrorCodigo] = useState<string | null>(null)
  const iniciar = useIniciarMfaSetup()
  const habilitar = useHabilitarMfa()

  // Dispara el setup al abrir. `iniciar` y `habilitar` cambian de referencia
  // en cada render (objetos de Tanstack Query); meterlos en deps + llamar a
  // `reset()` causaba loop infinito. Usamos solo los flags primitivos como
  // triggers — los metodos se leen siempre por referencia actual.
  // biome-ignore lint/correctness/useExhaustiveDependencies: triggers primitivos, no reads de iniciar/habilitar.
  useEffect(() => {
    if (!(abierto && !setupData && !iniciar.isPending)) {
      return
    }
    iniciar
      .mutateAsync()
      .then(setSetupData)
      .catch(() => undefined)
  }, [abierto, setupData, iniciar.isPending])

  // Limpia al cerrar — corre SOLO cuando `abierto` cambia. Mismo motivo que
  // arriba para no meter `iniciar`/`habilitar` en deps.
  // biome-ignore lint/correctness/useExhaustiveDependencies: limpieza ligada solo al cierre del dialog.
  useEffect(() => {
    if (abierto) {
      return
    }
    setSetupData(null)
    setCodigo("")
    setErrorCodigo(null)
    iniciar.reset()
    habilitar.reset()
  }, [abierto])

  const errorSetup = iniciar.error instanceof ApiError ? iniciar.error : null
  const errorHabilitar = habilitar.error instanceof ApiError ? habilitar.error : null

  async function manejarConfirmar(event: FormEvent) {
    event.preventDefault()
    setErrorCodigo(null)
    if (!REGEX_TOTP.test(codigo)) {
      setErrorCodigo("Debe ser un código de 6 dígitos.")
      return
    }
    try {
      await habilitar.mutateAsync({ codigo })
      toast.success("Doble factor activado")
      onCambiarAbierto(false)
    } catch {
      // se muestra en errorHabilitar
    }
  }

  return (
    <Dialog
      abierto={abierto}
      onCambiarAbierto={onCambiarAbierto}
      titulo="Activar verificación en dos pasos"
      descripcion="Escanea el QR con tu app autenticadora (Google Authenticator, 1Password, Authy…) e introduce el código de 6 dígitos para confirmar."
    >
      <form onSubmit={manejarConfirmar} className="flex flex-col gap-4">
        {errorSetup ? <Banner tone="danger">{errorSetup.message}</Banner> : null}
        {iniciar.isPending || !(setupData || errorSetup) ? (
          <Skeleton className="h-48 w-48 self-center" />
        ) : null}
        {setupData ? (
          <div className="flex flex-col items-center gap-3">
            <img
              src={setupData.qrCodeDataUrl}
              alt="Código QR para configurar el autenticador"
              className="h-48 w-48 rounded-md border border-border bg-surface p-2"
            />
            <details className="text-caption text-text-tertiary">
              <summary className="cursor-pointer">¿No puedes escanear?</summary>
              <p className="mt-2 break-all font-mono text-text-secondary">{setupData.secret}</p>
            </details>
          </div>
        ) : null}
        {errorHabilitar ? <Banner tone="danger">{errorHabilitar.message}</Banner> : null}
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
              hasError={Boolean(errorCodigo) || Boolean(errorHabilitar)}
              disabled={!setupData || habilitar.isPending}
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
            variant="primary"
            size="sm"
            type="submit"
            disabled={!setupData || codigo.length !== 6}
            isLoading={habilitar.isPending}
          >
            Confirmar y activar
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
