import {
  useActivarMfaUsuario,
  useBloquearUsuario,
  useDesbloquearUsuario,
  useResetMfaUsuario,
  useResetPasswordUsuario,
} from "@/features/admin-usuarios/hooks/use-mutaciones-usuario"
import type { UsuarioAdmin } from "@nexott-learn/shared-types"
import { useState } from "react"
import { toast } from "sonner"

type ConfirmKind = "bloquear" | "desbloquear" | "reset-password" | "activar-mfa" | "reset-mfa"

interface PendingConfirm {
  readonly kind: ConfirmKind
  readonly usuario: UsuarioAdmin
}

interface CredencialesPayload {
  readonly email: string
  readonly passwordTemporal: string
}

export function useAccionesUsuario() {
  const [pending, setPending] = useState<PendingConfirm | undefined>()
  const [credenciales, setCredenciales] = useState<CredencialesPayload | undefined>()

  const bloquear = useBloquearUsuario()
  const desbloquear = useDesbloquearUsuario()
  const resetPassword = useResetPasswordUsuario()
  const activarMfa = useActivarMfaUsuario()
  const resetMfa = useResetMfaUsuario()

  const ejecutar = async (motivo?: string) => {
    if (!pending) {
      return
    }
    const { kind, usuario } = pending
    try {
      if (kind === "bloquear") {
        await bloquear.mutateAsync({ id: usuario.id, input: { motivo } })
        toast.success(`${usuario.nombre} fue bloqueado`)
      } else if (kind === "desbloquear") {
        await desbloquear.mutateAsync({ id: usuario.id, input: { motivo } })
        toast.success(`${usuario.nombre} fue desbloqueado`)
      } else if (kind === "reset-password") {
        const r = await resetPassword.mutateAsync({ id: usuario.id, input: { motivo } })
        setCredenciales({ email: usuario.email, passwordTemporal: r.passwordTemporal })
      } else if (kind === "activar-mfa") {
        await activarMfa.mutateAsync({ id: usuario.id, input: { motivo } })
        toast.success("MFA activado. El usuario lo configurará al ingresar.")
      } else {
        await resetMfa.mutateAsync({ id: usuario.id, input: { motivo } })
        toast.success("MFA reseteado")
      }
      setPending(undefined)
    } catch {
      toast.error("La acción falló. Reintenta.")
    }
  }

  const isPending =
    bloquear.isPending ||
    desbloquear.isPending ||
    resetPassword.isPending ||
    activarMfa.isPending ||
    resetMfa.isPending

  return {
    pending,
    request: (kind: ConfirmKind, usuario: UsuarioAdmin) => setPending({ kind, usuario }),
    cancel: () => setPending(undefined),
    ejecutar,
    isPending,
    credenciales,
    cerrarCredenciales: () => setCredenciales(undefined),
    mostrarCredenciales: (payload: CredencialesPayload) => setCredenciales(payload),
  }
}

export function describirConfirm(kind: ConfirmKind, usuario: UsuarioAdmin) {
  const nombre = `${usuario.nombre} ${usuario.apellido}`
  switch (kind) {
    case "bloquear":
      return {
        tone: "danger" as const,
        title: `Bloquear cuenta de ${nombre}`,
        description: "Mientras esté bloqueado, no podrá entrar a la plataforma.",
        confirmLabel: "Bloquear cuenta",
        reasonLabel: "Motivo (opcional)",
      }
    case "desbloquear":
      return {
        tone: "info" as const,
        title: `Desbloquear cuenta de ${nombre}`,
        description: "El usuario podrá iniciar sesión nuevamente.",
        confirmLabel: "Desbloquear",
        reasonLabel: "Motivo (opcional)",
      }
    case "reset-password":
      return {
        tone: "warning" as const,
        title: `Reset password de ${nombre}`,
        description:
          "Generaremos una password temporal nueva. La actual dejará de funcionar inmediatamente.",
        confirmLabel: "Resetear password",
        reasonLabel: "Motivo (opcional)",
      }
    case "activar-mfa":
      return {
        tone: "info" as const,
        title: `Activar MFA para ${nombre}`,
        description: "El usuario tendrá que configurar la app TOTP al próximo login.",
        confirmLabel: "Activar MFA",
        reasonLabel: undefined,
      }
    case "reset-mfa":
      return {
        tone: "warning" as const,
        title: `Reset MFA de ${nombre}`,
        description: "Se borrará la configuración actual. El usuario tendrá que reconfigurarlo.",
        confirmLabel: "Resetear MFA",
        reasonLabel: "Motivo (opcional)",
      }
    default: {
      const _exhaustive: never = kind
      return _exhaustive
    }
  }
}
