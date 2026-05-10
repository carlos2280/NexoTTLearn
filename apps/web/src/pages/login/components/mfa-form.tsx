import type { PendingMfaVerify } from "@/features/auth/lib/pending-mfa-store"
import { Button } from "@/shared/ui/primitives/button"
import { Totp, type TotpHandle } from "@/shared/ui/primitives/totp"
import { ArrowRight, Mail, ShieldCheck } from "lucide-react"
import { type FormEvent, type ReactElement, useRef, useState } from "react"
import { type MfaSuccess, useMfaForm } from "../hooks/use-mfa-form"

interface MfaFormProps {
  readonly initialPending: PendingMfaVerify
  readonly onSuccess: (success: MfaSuccess) => void
}

export function MfaForm({ initialPending, onSuccess }: MfaFormProps): ReactElement {
  const { isVerifying, error, verificar, cancelar } = useMfaForm(initialPending, { onSuccess })
  const [code, setCode] = useState("")
  const totpRef = useRef<TotpHandle>(null)

  const onComplete = async (value: string): Promise<void> => {
    setCode(value)
    await verificar(value)
    totpRef.current?.reset()
  }

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
          <h2 className="font-bold text-2xl text-text-primary tracking-tight">
            Verificacion en dos pasos
          </h2>
          <p className="max-w-[32ch] text-sm text-text-secondary leading-relaxed">
            Ingresa el codigo de 6 digitos de tu app de autenticacion.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-glass-border bg-glass-1 px-3 py-1 text-text-secondary text-xs">
          <Mail className="size-3.5 text-text-muted" aria-hidden="true" />
          <span className="font-mono">{initialPending.emailEnmascarado}</span>
        </span>
      </header>

      <Totp
        ref={totpRef}
        value={code}
        onChange={setCode}
        onComplete={onComplete}
        disabled={isVerifying}
        autoFocus={true}
        state={error ? "error" : "default"}
        helper={error ?? undefined}
      />

      <Button type="submit" full={true} loading={isVerifying} disabled={!isReady}>
        {isVerifying ? "Verificando…" : "Verificar"}
        {isReady ? <ArrowRight aria-hidden="true" /> : null}
      </Button>

      <div className="flex items-center justify-center pt-1">
        <button
          type="button"
          onClick={cancelar}
          className="font-medium text-text-muted text-xs transition-colors hover:text-brand-violet-soft focus-visible:text-brand-violet-soft focus-visible:outline-none"
        >
          Volver al login
        </button>
      </div>
    </form>
  )
}
