import { RUTAS } from "@/shared/constants/rutas"
import { NxtAlert, NxtButton, NxtInputField, NxtTextLink } from "@carlos2280/nexott-ui/react"
import { Stack } from "@carlos2280/nexott-ui/react-primitives"
import { Link } from "react-router-dom"
import { useLoginForm } from "../hooks/use-login-form"
import { LoginLocked } from "./login-locked"

export function LoginForm() {
  const { register, handleSubmit, errors, isSubmitting, locked, resetLocked } = useLoginForm()

  if (locked) {
    return (
      <div className="animate-materialize">
        <LoginLocked retryAfterSeconds={locked.retryAfter} onUnlocked={resetLocked} />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate={true} className="animate-materialize">
      <Stack gap="lg">
        <NxtInputField
          variant="filled"
          label="Email corporativo"
          type="email"
          icon="mail"
          placeholder="tu@nttdata.com"
          autocomplete="email"
          {...register("email")}
          state={errors.email ? "error" : ""}
          helper={errors.email?.message ?? ""}
        />

        <NxtInputField
          variant="filled"
          label="Contrasena"
          type="password"
          icon="lock"
          autocomplete="current-password"
          toggle-password={true}
          {...register("password")}
          state={errors.password ? "error" : ""}
          helper={errors.password?.message ?? ""}
        />

        {errors.root && <NxtAlert variant="error" message={errors.root.message ?? ""} />}

        <NxtButton
          variant="primary"
          full={true}
          disabled={isSubmitting}
          loading={isSubmitting}
          onNxtButtonClick={async () => {
            await handleSubmit()
          }}
        >
          {isSubmitting ? "Ingresando…" : "Ingresar"}
        </NxtButton>

        <Stack gap="xs" align="center">
          <Link to={RUTAS.recuperarPassword}>
            <NxtTextLink tone="dim">Olvidaste tu contrasena?</NxtTextLink>
          </Link>
        </Stack>
      </Stack>
    </form>
  )
}
