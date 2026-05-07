import { useCambiarPassword } from "@/features/auth/hooks/use-cambiar-password"
import { useUsuarioActual } from "@/features/auth/hooks/use-usuario-actual"
import { ApiError } from "@/shared/api/api-error"
import { RUTAS } from "@/shared/constants/rutas"
import { zodResolver } from "@hookform/resolvers/zod"
import { type CambiarPasswordInput, cambiarPasswordSchema } from "@nexott-learn/shared-types"
import { type UseFormSetError, useForm } from "react-hook-form"

interface UseCambiarPasswordFormOptions {
  readonly onSuccess?: (destino: string) => void
}

export function useCambiarPasswordForm(options?: UseCambiarPasswordFormOptions) {
  const { data: usuario } = useUsuarioActual()

  // El callback debe invocarse ANTES de que la query del usuario se invalide,
  // si no la guarda (!usuario.debeCambiarPassword) redirige antes de que el
  // setState del destino aplique. Se calcula el destino aqui usando el usuario
  // actual (todavia con debeCambiarPassword=true).
  const cambiarPasswordMutation = useCambiarPassword({
    onSuccess: () => {
      const destino = usuario?.rol === "ADMIN" ? RUTAS.admin.bandeja : RUTAS.login
      options?.onSuccess?.(destino)
    },
  })

  const form = useForm<CambiarPasswordInput>({
    resolver: zodResolver(cambiarPasswordSchema),
    defaultValues: { passwordActual: "", passwordNuevo: "", confirmacion: "" },
  })

  const onSubmit = async (input: CambiarPasswordInput): Promise<void> => {
    try {
      await cambiarPasswordMutation.mutateAsync(input)
    } catch (err) {
      manejarError(err, form.setError)
    }
  }

  return {
    register: form.register,
    handleSubmit: form.handleSubmit(onSubmit),
    errors: form.formState.errors,
    isSubmitting: form.formState.isSubmitting,
  }
}

function manejarError(err: unknown, setError: UseFormSetError<CambiarPasswordInput>): void {
  if (!(err instanceof ApiError)) {
    setError("root", { message: "Error inesperado" })
    return
  }
  if (err.status === 400 && err.message.toLowerCase().includes("actual")) {
    setError("passwordActual", { message: err.message })
    return
  }
  if (err.fieldErrors) {
    for (const [campo, mensajes] of Object.entries(err.fieldErrors)) {
      const mensaje = mensajes[0]
      if (mensaje) {
        setError(campo as keyof CambiarPasswordInput, { message: mensaje })
      }
    }
    return
  }
  setError("root", { message: err.message })
}
