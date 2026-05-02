import { AuthHydrationLoader } from "@/features/auth/components/auth-hydration-loader"
import { useUsuarioActual } from "@/features/auth/hooks/use-usuario-actual"
import { calcularRutaPostLogin } from "@/features/auth/lib/calcular-ruta-post-login"
import { NxtLayoutAuth } from "@carlos2280/nexott-ui/react"
import { Navigate } from "react-router-dom"
import { LoginForm } from "./components/login-form"

export function LoginPage() {
  const { data: usuario, isLoading } = useUsuarioActual()

  if (isLoading) {
    return <AuthHydrationLoader />
  }

  // Si ya hay sesion activa, redirigir segun rol/cambio de password
  if (usuario) {
    return <Navigate to={calcularRutaPostLogin(usuario)} replace={true} />
  }

  return (
    <NxtLayoutAuth
      theme="nexott-learn"
      appMark="Nx"
      appName="NexoTT"
      appSub="Learn"
      heroTitle={"Aprende. Demuestra.\nLlega listo."}
      heroSubtitle="Plataforma de capacitacion interna - NTT DATA."
      manifesto="Tu proximo nivel empieza aqui."
      version="v0.1"
    >
      <LoginForm />
    </NxtLayoutAuth>
  )
}
