import { RUTAS } from "@/shared/constants/rutas"
import { Alert } from "@/shared/ui/primitives/alert"
import { Button } from "@/shared/ui/primitives/button"
import { Input } from "@/shared/ui/primitives/input"
import { ArrowRight, Lock, Mail } from "lucide-react"
import { Link } from "react-router-dom"
import { useLoginForm } from "../hooks/use-login-form"
import { LoginLocked } from "./login-locked"

export function LoginForm() {
  const { register, handleSubmit, errors, isSubmitting, locked, resetLocked } = useLoginForm()

  if (locked) {
    return <LoginLocked retryAfterSeconds={locked.retryAfter} onUnlocked={resetLocked} />
  }

  return (
    <form onSubmit={handleSubmit} noValidate={true} className="flex flex-col gap-6">
      <header className="flex flex-col gap-1.5">
        <h2 className="font-bold text-2xl text-text-primary tracking-tight">
          Bienvenido de vuelta
        </h2>
        <p className="text-sm text-text-secondary">Ingresa con tu cuenta corporativa.</p>
      </header>

      <div className="flex flex-col gap-4">
        <Input
          label="Email corporativo"
          type="email"
          icon={Mail}
          placeholder="tu@nttdata.com"
          autoComplete="email"
          autoFocus={true}
          {...register("email")}
          error={errors.email?.message}
        />

        <Input
          label="Contrasena"
          type="password"
          icon={Lock}
          placeholder="••••••••"
          autoComplete="current-password"
          togglePassword={true}
          {...register("password")}
          error={errors.password?.message}
        />
      </div>

      {errors.root ? <Alert variant="error">{errors.root.message}</Alert> : null}

      <Button type="submit" full={true} loading={isSubmitting} disabled={isSubmitting}>
        {isSubmitting ? "Ingresando…" : "Ingresar"}
        {!isSubmitting && <ArrowRight aria-hidden="true" />}
      </Button>

      <div className="flex items-center justify-center pt-1">
        <Link
          to={RUTAS.recuperarPassword}
          className="font-medium text-text-muted text-xs transition-colors hover:text-brand-violet-soft focus-visible:text-brand-violet-soft focus-visible:outline-none"
        >
          Olvidaste tu contrasena?
        </Link>
      </div>
    </form>
  )
}
