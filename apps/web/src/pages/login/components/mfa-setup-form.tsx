import type { PendingMfaSetup } from "@/features/auth/lib/pending-mfa-store"
import { useQrCode } from "@/shared/hooks/use-qr-code"
import { CopyField } from "@/shared/ui/patterns/copy-field"
import { Button } from "@/shared/ui/primitives/button"
import { Totp, type TotpHandle } from "@/shared/ui/primitives/totp"
import { ArrowRight, ShieldCheck } from "lucide-react"
import { type FormEvent, type ReactElement, useCallback, useRef, useState } from "react"
import { type MfaSuccess, useMfaForm } from "../hooks/use-mfa-form"

interface MfaSetupFormProps {
  readonly initialPending: PendingMfaSetup
  readonly onSuccess: (success: MfaSuccess) => void
}

export function MfaSetupForm({ initialPending, onSuccess }: MfaSetupFormProps): ReactElement {
  const { pending, isVerifying, error, verificar, cancelar } = useMfaForm(initialPending, {
    onSuccess,
  })
  const [code, setCode] = useState("")
  const totpRef = useRef<TotpHandle>(null)

  const setupData = pending?.mode === "setup" ? pending : initialPending
  const { svg } = useQrCode(setupData.otpauthUri, 184)

  const onComplete = useCallback(
    async (value: string): Promise<void> => {
      setCode(value)
      await verificar(value)
      totpRef.current?.reset()
    },
    [verificar],
  )

  const onSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault()
    if (code.length === 6) {
      await verificar(code)
    }
  }

  const isReady = code.length === 6 && !isVerifying

  return (
    <form onSubmit={onSubmit} noValidate={true} className="flex flex-col gap-6">
      <header className="flex flex-col items-center gap-4">
        <span className="relative grid size-14 place-items-center rounded-[var(--radius-xl)] border border-glass-border bg-[linear-gradient(135deg,rgb(124_58_237/0.18),rgb(34_211_238/0.14))]">
          <span
            aria-hidden="true"
            className="absolute inset-0 animate-[breathing_4s_ease-in-out_infinite] rounded-[var(--radius-xl)] bg-[linear-gradient(135deg,rgb(124_58_237/0.25),rgb(34_211_238/0.2))] opacity-60 blur-md"
          />
          <ShieldCheck className="relative size-7 text-brand-cyan" aria-hidden="true" />
        </span>
        <div className="flex flex-col items-center gap-1.5 text-center">
          <h2 className="font-bold text-2xl text-text-primary tracking-tight">Configura tu MFA</h2>
          <p className="max-w-[36ch] text-sm text-text-secondary leading-relaxed">
            Escanea el QR con Google Authenticator, Authy o tu app preferida.
          </p>
        </div>
      </header>

      {svg ? (
        <div className="mx-auto rounded-[var(--radius-lg)] border border-glass-border bg-white p-3">
          <div
            aria-label="Codigo QR para configurar MFA"
            className="grid place-items-center"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: SVG generado por la libreria qrcode en cliente, sin entrada de usuario
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <SectionLabel>O ingresa el codigo manualmente</SectionLabel>
        <CopyField value={setupData.secret} label="Copiar codigo MFA" wrap={true} />
      </div>

      <div className="flex flex-col gap-3">
        <SectionLabel>Confirma con el codigo de tu app</SectionLabel>
        <Totp
          ref={totpRef}
          value={code}
          onChange={setCode}
          onComplete={onComplete}
          disabled={isVerifying}
          state={error ? "error" : "default"}
          helper={error ?? undefined}
        />
      </div>

      <Button type="submit" full={true} loading={isVerifying} disabled={!isReady}>
        {isVerifying ? "Activando…" : "Activar MFA"}
        {isReady ? <ArrowRight aria-hidden="true" /> : null}
      </Button>

      <div className="flex items-center justify-center pt-1">
        <button
          type="button"
          onClick={cancelar}
          className="font-medium text-text-muted text-xs transition-colors hover:text-brand-violet-soft focus-visible:text-brand-violet-soft focus-visible:outline-none"
        >
          Cancelar y volver al login
        </button>
      </div>
    </form>
  )
}

function SectionLabel({ children }: { readonly children: string }) {
  return (
    <span className="flex items-center gap-2 font-medium text-text-muted text-xs uppercase tracking-widest">
      <span
        aria-hidden="true"
        className="h-px w-4 bg-gradient-to-r from-brand-violet to-brand-cyan"
      />
      {children}
    </span>
  )
}
