import { AuthHydrationLoader } from "@/features/auth/components/auth-hydration-loader"
import { AuthSuccessScreen } from "@/features/auth/components/auth-success-screen"
import { useUsuarioActual } from "@/features/auth/hooks/use-usuario-actual"
import { calcularRutaPostLogin } from "@/features/auth/lib/calcular-ruta-post-login"
import { pendingMfaStore } from "@/features/auth/lib/pending-mfa-store"
import { RUTAS } from "@/shared/constants/rutas"
import { AuthShell } from "@/shared/ui/patterns/auth-shell"
import { useState } from "react"
import { Navigate, useNavigate } from "react-router-dom"
import { MfaForm } from "./components/mfa-form"
import { MfaSetupForm } from "./components/mfa-setup-form"
import type { MfaSuccess } from "./hooks/use-mfa-form"

export function MfaPage() {
  const { data: usuario, isLoading } = useUsuarioActual()
  const navigate = useNavigate()
  const [success, setSuccess] = useState<MfaSuccess | null>(null)

  if (isLoading) {
    return <AuthHydrationLoader />
  }

  // La pantalla de exito se evalua antes que el redirect por usuario/pending,
  // porque tras un MFA exitoso la cache del usuario se actualiza y pendingMfaStore
  // se limpia — sin esta prioridad, las guardas redirigen antes de mostrar la
  // pantalla intersticial.
  if (success) {
    return (
      <MfaSuccessView
        success={success}
        onComplete={() => {
          navigate(success.destino, { replace: true })
        }}
      />
    )
  }

  if (usuario) {
    return <Navigate to={calcularRutaPostLogin(usuario)} replace={true} />
  }

  const pending = pendingMfaStore.get()
  if (!pending) {
    return <Navigate to={RUTAS.login} replace={true} />
  }

  const esSetup = pending.mode === "setup"

  return (
    <AuthShell
      appMark="Nx"
      appName="NexoTT"
      appSub="Learn"
      heroEyebrow="Verificacion en dos pasos"
      heroTitle={esSetup ? "Activa tu\nMFA." : "Un paso mas\npara entrar."}
      heroSubtitle={
        esSetup
          ? "Por seguridad, configuramos verificacion en dos pasos antes del primer ingreso."
          : "Ingresa el codigo de tu app de autenticacion para confirmar que eres tu."
      }
      manifesto="Tu cuenta, tu fortaleza."
      version="v0.1"
    >
      {pending.mode === "setup" ? (
        <MfaSetupForm initialPending={pending} onSuccess={setSuccess} />
      ) : (
        <MfaForm initialPending={pending} onSuccess={setSuccess} />
      )}
    </AuthShell>
  )
}

interface MfaSuccessViewProps {
  readonly success: MfaSuccess
  readonly onComplete: () => void
}

function MfaSuccessView({ success, onComplete }: MfaSuccessViewProps) {
  const esSetup = success.mode === "setup"
  return (
    <AuthSuccessScreen
      // biome-ignore lint/nursery/noSecrets: Mensaje del manifesto en espanol, no es un secret
      heroTitle={esSetup ? "MFA\nactivado." : "Acceso\nverificado."}
      heroSubtitle={
        esSetup
          ? "Tu cuenta ahora tiene una capa extra de proteccion."
          : "Tu identidad fue confirmada correctamente."
      }
      manifesto={esSetup ? "Tu cuenta, tu fortaleza." : "Bienvenido de vuelta."}
      label={esSetup ? "MFA activado" : "Acceso verificado"}
      sublabel={esSetup ? "Listo para empezar." : "Bienvenido de vuelta."}
      onComplete={onComplete}
    />
  )
}
