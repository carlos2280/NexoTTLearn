import { RUTAS } from "@/shared/constants/rutas"
import { useCountdown } from "@/shared/hooks/use-countdown"
import { NxtButton, NxtEmpty, NxtText, NxtTextLink } from "@carlos2280/nexott-ui/react"
import { Stack } from "@carlos2280/nexott-ui/react-primitives"
import type { ReactElement } from "react"
import { Link } from "react-router-dom"

interface LoginLockedProps {
  readonly retryAfterSeconds: number
  readonly onUnlocked: () => void
}

export function LoginLocked({ retryAfterSeconds, onUnlocked }: LoginLockedProps): ReactElement {
  const { mmss, ended } = useCountdown(retryAfterSeconds)

  return (
    <Stack gap="lg" align="stretch">
      <NxtEmpty
        icon="lock"
        mood="error"
        title="Cuenta bloqueada temporalmente"
        description={
          ended
            ? "Ya puedes intentarlo nuevamente."
            : `Has superado el limite de intentos. Podras intentarlo en ${mmss}.`
        }
      />

      {ended ? (
        <NxtButton variant="primary" full={true} onNxtButtonClick={onUnlocked}>
          Volver a intentar
        </NxtButton>
      ) : (
        <Stack gap="sm" align="center">
          <NxtText size="sm" tone="dim" align="center">
            Si necesitas acceso urgente, contacta a tu administrador.
          </NxtText>
          <Link to={RUTAS.recuperarPassword}>
            <NxtTextLink tone="brand">Recuperar acceso</NxtTextLink>
          </Link>
        </Stack>
      )}
    </Stack>
  )
}
