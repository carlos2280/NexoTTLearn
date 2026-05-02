import { useConfirmMfaSetup } from "@/features/auth/hooks/use-confirm-mfa-setup"
import { useVerifyMfa } from "@/features/auth/hooks/use-verify-mfa"
import { calcularRutaPostLogin } from "@/features/auth/lib/calcular-ruta-post-login"
import { type PendingMfa, pendingMfaStore } from "@/features/auth/lib/pending-mfa-store"
import { ApiError } from "@/shared/api/api-error"
import { RUTAS } from "@/shared/constants/rutas"
import type { UsuarioPublico } from "@nexott-learn/shared-types"
import { useState } from "react"
import { useNavigate } from "react-router-dom"

export interface MfaSuccess {
  readonly mode: "setup" | "verify"
  readonly destino: string
}

interface UseMfaFormOptions {
  readonly onSuccess?: (success: MfaSuccess) => void
}

interface UseMfaFormResult {
  readonly pending: PendingMfa | null
  readonly isVerifying: boolean
  readonly error: string | null
  readonly verificar: (code: string) => Promise<void>
  readonly cancelar: () => void
}

export function useMfaForm(
  initialPending: PendingMfa | null,
  options?: UseMfaFormOptions,
): UseMfaFormResult {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState<PendingMfa | null>(initialPending)

  // El callback se dispara desde el onSuccess de la mutation, ANTES de
  // que la cache del usuario se actualice. Si esperaramos al `await
  // mutateAsync`, el re-render por cache redirige antes de que setSuccess
  // aplique.
  const handleMutationSuccess = (data: { usuario: UsuarioPublico }) => {
    if (!pending) {
      return
    }
    pendingMfaStore.clear()
    options?.onSuccess?.({
      mode: pending.mode,
      destino: calcularRutaPostLogin(data.usuario),
    })
  }

  const verifyMutation = useVerifyMfa({ onSuccess: handleMutationSuccess })
  const confirmSetupMutation = useConfirmMfaSetup({ onSuccess: handleMutationSuccess })

  const verificar = async (code: string): Promise<void> => {
    if (!pending) {
      return
    }
    setError(null)
    try {
      const mutation = pending.mode === "setup" ? confirmSetupMutation : verifyMutation
      await mutation.mutateAsync({
        challengeId: pending.challengeId,
        code,
      })
    } catch (err) {
      if (err instanceof ApiError && err.code === "MFA_EXPIRED") {
        pendingMfaStore.clear()
        setPending(null)
        navigate(RUTAS.login, { replace: true })
        return
      }
      if (err instanceof ApiError) {
        setError(err.message)
        return
      }
      setError("Error inesperado al verificar el codigo")
    }
  }

  const cancelar = (): void => {
    pendingMfaStore.clear()
    setPending(null)
    navigate(RUTAS.login, { replace: true })
  }

  return {
    pending,
    isVerifying: verifyMutation.isPending || confirmSetupMutation.isPending,
    error,
    verificar,
    cancelar,
  }
}
