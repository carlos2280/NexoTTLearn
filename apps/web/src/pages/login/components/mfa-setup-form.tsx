import type { PendingMfaSetup } from "@/features/auth/lib/pending-mfa-store"
import { useQrCode } from "@/shared/hooks/use-qr-code"
import {
  NxtButton,
  NxtCopyField,
  NxtEyebrow,
  NxtHeading,
  NxtIcon,
  NxtText,
  NxtTextLink,
  NxtTotp,
} from "@carlos2280/nexott-ui/react"
import { Box, Stack } from "@carlos2280/nexott-ui/react-primitives"
import type { ComponentRef, ReactElement } from "react"
import { useCallback, useRef, useState } from "react"
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
  const totpRef = useRef<ComponentRef<typeof NxtTotp>>(null)

  // El pending puede cambiar a null si el flujo expira. En setup tomamos el initial
  // como fuente confiable mientras siga existiendo.
  const setupData = pending?.mode === "setup" ? pending : initialPending
  const { svg } = useQrCode(setupData.otpauthUri, 200)

  const onComplete = useCallback(
    async (value: string): Promise<void> => {
      setCode(value)
      await verificar(value)
      totpRef.current?.reset()
    },
    [verificar],
  )

  const onSubmit = async (): Promise<void> => {
    if (code.length === 6) {
      await verificar(code)
    }
  }

  return (
    <div className="animate-materialize">
      <Stack gap="lg">
        <Stack gap="sm" align="center">
          <NxtIcon name="shield" size="lg" spectrum={true} label="Configurar MFA" />
          <Stack gap="xs" align="center">
            <NxtHeading level={2} align="center">
              Configura tu MFA
            </NxtHeading>
            <NxtText size="sm" tone="dim" align="center" max-width="36ch">
              Escanea el QR con Google Authenticator, Authy o tu app preferida.
            </NxtText>
          </Stack>
        </Stack>

        {svg && (
          <Box
            surface="card"
            padding="md"
            radius="lg"
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              background: "#ffffff",
              width: "fit-content",
              margin: "0 auto",
            }}
          >
            <div
              aria-label="Codigo QR para configurar MFA"
              // biome-ignore lint/security/noDangerouslySetInnerHtml: SVG generado por la libreria qrcode en cliente, sin entrada de usuario
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          </Box>
        )}

        <Stack gap="xs" align="center">
          <NxtEyebrow accent="bar">O ingresa el codigo manualmente</NxtEyebrow>
          <NxtCopyField value={setupData.secret} label="Copiar codigo MFA" wrap={true} />
        </Stack>

        <Stack gap="xs" align="center">
          <NxtEyebrow accent="bar">Confirma con el codigo de tu app</NxtEyebrow>
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
          {isVerifying ? "Activando…" : "Activar MFA"}
        </NxtButton>

        <Stack gap="xs" align="center">
          <NxtTextLink tone="dim" onNxtTextLinkClick={cancelar}>
            Cancelar y volver al login
          </NxtTextLink>
        </Stack>
      </Stack>
    </div>
  )
}
