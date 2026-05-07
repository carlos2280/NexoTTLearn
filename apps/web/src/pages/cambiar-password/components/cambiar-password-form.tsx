import { Alert } from "@/shared/ui/primitives/alert"
import { Button } from "@/shared/ui/primitives/button"
import { Input } from "@/shared/ui/primitives/input"
import { ArrowRight, Lock } from "lucide-react"
import { useCambiarPasswordForm } from "../hooks/use-cambiar-password-form"

interface CambiarPasswordFormProps {
  readonly onSuccess: (destino: string) => void
}

export function CambiarPasswordForm({ onSuccess }: CambiarPasswordFormProps) {
  const { register, handleSubmit, errors, isSubmitting } = useCambiarPasswordForm({ onSuccess })

  return (
    <form onSubmit={handleSubmit} noValidate={true} className="flex flex-col gap-6">
      <header className="flex flex-col gap-1.5">
        <h2 className="font-bold text-2xl text-text-primary tracking-tight">
          Define tu nueva contrasena
        </h2>
        <p className="text-sm text-text-secondary">
          Solo te tomara un momento. Tu sesion sigue activa.
        </p>
      </header>

      <div className="flex flex-col gap-4">
        <Input
          label="Contrasena actual"
          type="password"
          icon={Lock}
          placeholder="••••••••"
          autoComplete="current-password"
          togglePassword={true}
          {...register("passwordActual")}
          error={errors.passwordActual?.message}
        />

        <Input
          label="Contrasena nueva"
          type="password"
          icon={Lock}
          placeholder="••••••••"
          autoComplete="new-password"
          togglePassword={true}
          {...register("passwordNuevo")}
          error={errors.passwordNuevo?.message}
          helper="Minimo 8 caracteres, 1 mayuscula, 1 minuscula, 1 numero"
        />

        <Input
          label="Confirmar contrasena nueva"
          type="password"
          icon={Lock}
          placeholder="••••••••"
          autoComplete="new-password"
          togglePassword={true}
          {...register("confirmacion")}
          error={errors.confirmacion?.message}
        />
      </div>

      {errors.root ? <Alert variant="error">{errors.root.message}</Alert> : null}

      <Button type="submit" full={true} loading={isSubmitting} disabled={isSubmitting}>
        {isSubmitting ? "Guardando…" : "Cambiar contrasena"}
        {!isSubmitting && <ArrowRight aria-hidden="true" />}
      </Button>
    </form>
  )
}
