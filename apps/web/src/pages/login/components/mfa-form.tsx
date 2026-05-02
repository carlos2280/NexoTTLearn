import type { PendingMfaVerify } from "@/features/auth/lib/pending-mfa-store"
import {
  NxtButton,
  NxtHeading,
  NxtIcon,
  NxtTag,
  NxtText,
  NxtTextLink,
  NxtTotp,
} from "@carlos2280/nexott-ui/react"
import { Stack } from "@carlos2280/nexott-ui/react-primitives"
import type { ComponentRef, ReactElement } from "react"
import { useRef, useState } from "react"
import { type MfaSuccess, useMfaForm } from "../hooks/use-mfa-form"

interface MfaFormProps {
  readonly initialPending: PendingMfaVerify
  readonly onSuccess: (success: MfaSuccess) => void
}

export function MfaForm({ initialPending, onSuccess }: MfaFormProps): ReactElement {
  const { isVerifying, error, verificar, cancelar } = useMfaForm(initialPending, {
    onSuccess,
  })
  const [code, setCode] = useState("")
  const totpRef = useRef<ComponentRef<typeof NxtTotp>>(null)

  const onComplete = async (value: string): Promise<void> => {
    setCode(value)
    await verificar(value)
    totpRef.current?.reset()
  }

  const onSubmit = async (): Promise<void> => {
    if (code.length === 6) {
      await verificar(code)
    }
  }

  return (
    <div className="animate-materialize">
      <Stack gap="lg">
        <Stack gap="md" align="center">
          <NxtIcon name="shield" size="lg" spectrum={true} label="Verificacion en dos pasos" />
          <Stack gap="xs" align="center">
            <NxtHeading level={2} align="center">
              Verificacion en dos pasos
            </NxtHeading>
            <NxtText size="sm" tone="dim" align="center" max-width="32ch">
              Ingresa el codigo de 6 digitos de tu app de autenticacion.
            </NxtText>
          </Stack>
        </Stack>

        <Stack align="center">
          <NxtTag variant="neutral" icon="mail" size="sm">
            {initialPending.emailEnmascarado}
          </NxtTag>
        </Stack>

        <Stack align="center">
          <NxtTotp
            ref={totpRef}
            state={error ? "error" : ""}
            helper={error ?? ""}
            disabled={isVerifying}
            onNxtTotpChange={(e) => setCode(e.detail.value)}
            onNxtTotpComplete={async (e) => {
              await onComplete(e.detail.value)
            }}
          />
        </Stack>

        <NxtButton
          variant="primary"
          full={true}
          disabled={isVerifying || code.length !== 6}
          loading={isVerifying}
          onNxtButtonClick={onSubmit}
        >
          {isVerifying ? "Verificando…" : "Verificar"}
        </NxtButton>

        <Stack gap="xs" align="center">
          <NxtTextLink tone="dim" onNxtTextLinkClick={cancelar}>
            Volver al login
          </NxtTextLink>
        </Stack>
      </Stack>
    </div>
  )
}
