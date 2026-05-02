import { AuthHydrationLoader } from "@/features/auth/components/auth-hydration-loader"
import { useUsuarioActual } from "@/features/auth/hooks/use-usuario-actual"
import { calcularRutaPostLogin } from "@/features/auth/lib/calcular-ruta-post-login"
import { NxtLayoutAuth } from "@carlos2280/nexott-ui/react"
import { Navigate } from "react-router-dom"
import { RecuperarInfo } from "./components/recuperar-info"

export function RecuperarPasswordPage() {
  const { data: usuario, isLoading } = useUsuarioActual()

  if (isLoading) {
    return <AuthHydrationLoader />
  }

  // Si ya hay sesion, no tiene sentido la pantalla informativa
  if (usuario) {
    return <Navigate to={calcularRutaPostLogin(usuario)} replace={true} />
  }

  return (
    <NxtLayoutAuth
      theme="nexott-learn"
      appMark="Nx"
      appName="NexoTT"
      appSub="Learn"
      heroTitle={"Recupera el\nacceso."}
      heroSubtitle="Tu administrador puede reestablecer tu contrasena."
      manifesto="Aqui estamos para ayudarte."
      version="v0.1"
    >
      <RecuperarInfo />
    </NxtLayoutAuth>
  )
}
