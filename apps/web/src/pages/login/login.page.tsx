import { AuthHydrationLoader } from "@/features/auth/components/auth-hydration-loader"
import { useUsuarioActual } from "@/features/auth/hooks/use-usuario-actual"
import { calcularRutaPostLogin } from "@/features/auth/lib/calcular-ruta-post-login"
import { AuthShell } from "@/shared/ui/patterns/auth-shell"
import { Navigate } from "react-router-dom"
import { LoginForm } from "./components/login-form"

export function LoginPage() {
  const { data: usuario, isLoading } = useUsuarioActual()

  if (isLoading) {
    return <AuthHydrationLoader />
  }

  if (usuario) {
    return <Navigate to={calcularRutaPostLogin(usuario)} replace={true} />
  }

  return (
    <AuthShell
      appMark="Nx"
      appName="NexoTT"
      appSub="Learn"
      heroEyebrow="Plataforma de capacitacion"
      heroTitle={"Aprende. Demuestra.\nLlega listo."}
      manifesto="El conocimiento que aplicas es el unico que cuenta."
      version="v0.1"
    >
      <LoginForm />
    </AuthShell>
  )
}
