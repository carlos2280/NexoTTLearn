import { useLogin } from "@/features/auth/hooks/use-login"
import { calcularRutaPostLogin } from "@/features/auth/lib/calcular-ruta-post-login"
import { pendingMfaStore } from "@/features/auth/lib/pending-mfa-store"
import { ApiError } from "@/shared/api/api-error"
import { RUTAS } from "@/shared/constants/rutas"
import { zodResolver } from "@hookform/resolvers/zod"
import { type LoginInput, loginSchema } from "@nexott-learn/shared-types"
import { useState } from "react"
import { type UseFormSetError, useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"

interface LockedState {
  readonly retryAfter: number
}

interface UseLoginFormResult {
  readonly register: ReturnType<typeof useForm<LoginInput>>["register"]
  readonly handleSubmit: () => Promise<void>
  readonly errors: ReturnType<typeof useForm<LoginInput>>["formState"]["errors"]
  readonly isSubmitting: boolean
  readonly locked: LockedState | null
  readonly resetLocked: () => void
}

export function useLoginForm(): UseLoginFormResult {
  const navigate = useNavigate()
  const loginMutation = useLogin()
  const [locked, setLocked] = useState<LockedState | null>(null)

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  const onSubmit = async (input: LoginInput): Promise<void> => {
    try {
      const resultado = await loginMutation.mutateAsync(input)

      if (resultado.status === "mfa-setup") {
        pendingMfaStore.set({
          mode: "setup",
          challengeId: resultado.challengeId,
          emailEnmascarado: resultado.emailEnmascarado,
          secret: resultado.secret,
          otpauthUri: resultado.otpauthUri,
        })
        navigate(RUTAS.loginMfa, { replace: true })
        return
      }

      if (resultado.status === "mfa-verify") {
        pendingMfaStore.set({
          mode: "verify",
          challengeId: resultado.challengeId,
          emailEnmascarado: resultado.emailEnmascarado,
        })
        navigate(RUTAS.loginMfa, { replace: true })
        return
      }

      navigate(calcularRutaPostLogin(resultado.usuario), { replace: true })
    } catch (err) {
      if (err instanceof ApiError && err.code === "ACCOUNT_LOCKED") {
        setLocked({ retryAfter: err.retryAfter ?? 0 })
        return
      }
      manejarErrorLogin(err, form.setError)
    }
  }

  return {
    register: form.register,
    handleSubmit: form.handleSubmit(onSubmit),
    errors: form.formState.errors,
    isSubmitting: form.formState.isSubmitting,
    locked,
    resetLocked: () => setLocked(null),
  }
}

function manejarErrorLogin(err: unknown, setError: UseFormSetError<LoginInput>): void {
  if (!(err instanceof ApiError)) {
    setError("root", { message: "Error inesperado" })
    return
  }
  if (err.code === "INVALID_CREDENTIALS") {
    setError("password", { message: "Credenciales invalidas" })
    return
  }
  if (err.fieldErrors) {
    for (const [campo, mensajes] of Object.entries(err.fieldErrors)) {
      const mensaje = mensajes[0]
      if (mensaje) {
        setError(campo as keyof LoginInput, { message: mensaje })
      }
    }
    return
  }
  setError("root", { message: err.message })
}
