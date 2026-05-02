import { RUTAS } from "@/shared/constants/rutas"
import {
  NxtAlert,
  NxtButton,
  NxtHeading,
  NxtIcon,
  NxtTag,
  NxtText,
  NxtTextLink,
} from "@carlos2280/nexott-ui/react"
import { Stack } from "@carlos2280/nexott-ui/react-primitives"
import type { ReactElement } from "react"
import { Link } from "react-router-dom"

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_CONTACT_EMAIL ?? "admin@nexott.local"

export function RecuperarInfo(): ReactElement {
  const mailto = `mailto:${ADMIN_EMAIL}?subject=${encodeURIComponent(
    "Solicitud de reseteo de contrasena",
  )}`

  return (
    <div className="animate-materialize">
      <Stack gap="lg">
        <Stack gap="md" align="center">
          <NxtIcon name="shield" size="lg" spectrum={true} label="Recuperar acceso" />
          <Stack gap="xs" align="center">
            <NxtHeading level={2} align="center">
              Necesitas ayuda?
            </NxtHeading>
            <NxtText size="sm" tone="dim" align="center" max-width="38ch">
              Por seguridad, los reseteos de contrasena los gestiona tu administrador.
            </NxtText>
          </Stack>
        </Stack>

        <NxtAlert
          variant="info"
          heading="Contacta a tu administrador"
          message="Solicitale el reseteo por un canal seguro (Teams, llamada o correo). Te entregara una contrasena temporal que deberas cambiar al ingresar."
        />

        <Stack gap="xs" align="center">
          <NxtTag variant="indigo" icon="mail" size="md">
            {ADMIN_EMAIL}
          </NxtTag>
        </Stack>

        <NxtButton
          variant="primary"
          full={true}
          onNxtButtonClick={() => {
            window.location.href = mailto
          }}
        >
          Escribir al administrador
        </NxtButton>

        <Stack gap="xs" align="center">
          <Link to={RUTAS.login}>
            <NxtTextLink tone="dim">Volver al login</NxtTextLink>
          </Link>
        </Stack>
      </Stack>
    </div>
  )
}
