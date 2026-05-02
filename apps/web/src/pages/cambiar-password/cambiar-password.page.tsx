import { AuthHydrationLoader } from "@/features/auth/components/auth-hydration-loader"
import { AuthSuccessScreen } from "@/features/auth/components/auth-success-screen"
import { useUsuarioActual } from "@/features/auth/hooks/use-usuario-actual"
import { RUTAS } from "@/shared/constants/rutas"
import { NxtLayoutAuth } from "@carlos2280/nexott-ui/react"
import { useState } from "react"
import { Navigate, useNavigate } from "react-router-dom"
import { CambiarPasswordForm } from "./components/cambiar-password-form"

export function CambiarPasswordPage() {
  const { data: usuario, isLoading } = useUsuarioActual()
  const navigate = useNavigate()
  const [destinoExito, setDestinoExito] = useState<string | null>(null)

  if (isLoading) {
    return <AuthHydrationLoader />
  }

  // Esta ruta requiere sesion. Si no hay usuario, ir a login.
  if (!usuario) {
    return <Navigate to={RUTAS.login} replace={true} />
  }

  if (destinoExito) {
    return (
      <AuthSuccessScreen
        // biome-ignore lint/nursery/noSecrets: Mensaje del manifesto en espanol, no es un secret
        heroTitle={"Contrasena\nactualizada."}
        heroSubtitle="Tu nueva contrasena ya esta activa."
        manifesto="Todo listo para empezar."
        label="Contrasena actualizada"
        sublabel="Todo listo para empezar."
        onComplete={() => {
          navigate(destinoExito, { replace: true })
        }}
      />
    )
  }

  // Si el usuario ya no requiere cambiar password, no debe poder volver aqui.
  if (!usuario.debeCambiarPassword) {
    return (
      <Navigate to={usuario.rol === "ADMIN" ? RUTAS.admin.bandeja : RUTAS.bandeja} replace={true} />
    )
  }

  return (
    <NxtLayoutAuth
      theme="nexott-learn"
      appMark="Nx"
      appName="NexoTT"
      appSub="Learn"
      heroTitle="Cambia tu contrasena"
      heroSubtitle="Por seguridad debes definir una contrasena nueva en tu primer acceso."
      manifesto="Listo para empezar."
      version="v0.1"
    >
      <CambiarPasswordForm onSuccess={setDestinoExito} />
    </NxtLayoutAuth>
  )
}
