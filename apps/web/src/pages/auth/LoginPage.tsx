import { NxtButton, NxtInputField, NxtLayoutAuth } from "@carlos2280/nexott-ui/react"
import { Box, Stack } from "@carlos2280/nexott-ui/react-primitives"
import { zodResolver } from "@hookform/resolvers/zod"
import { type LoginInput, loginSchema } from "@nexott-learn/shared-types"
import { type UseFormSetError, useForm } from "react-hook-form"
import { Navigate, useLocation, useNavigate } from "react-router-dom"
import { useLogin, useSesion } from "../../hooks/useSesion"
import { ApiError } from "../../lib/api"

function obtenerDestinoRedirect(state: unknown): string {
  if (
    typeof state === "object" &&
    state !== null &&
    "from" in state &&
    typeof state.from === "string"
  ) {
    return state.from
  }
  return "/"
}

function manejarErrorLogin(err: unknown, setError: UseFormSetError<LoginInput>): void {
  if (!(err instanceof ApiError)) {
    setError("root", { message: "Error inesperado" })
    return
  }
  if (err.status === 401) {
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

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { data: sesion, isLoading: cargandoSesion } = useSesion()
  const login = useLogin()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  if (cargandoSesion) {
    return null
  }

  if (sesion) {
    return <Navigate to={obtenerDestinoRedirect(location.state)} replace={true} />
  }

  const onSubmit = async (input: LoginInput) => {
    try {
      await login.mutateAsync(input)
      navigate("/", { replace: true })
    } catch (err) {
      manejarErrorLogin(err, setError)
    }
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
      <form onSubmit={handleSubmit(onSubmit)} noValidate={true}>
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

          {errors.root && (
            <Box role="alert" surface="card" padding="md" radius="md">
              <span style={{ color: "var(--nx-rose-400)", fontSize: "var(--nx-text-sm)" }}>
                {errors.root.message}
              </span>
            </Box>
          )}

          <NxtButton
            variant="primary"
            full={true}
            disabled={isSubmitting}
            loading={isSubmitting}
            onNxtButtonClick={async () => {
              await handleSubmit(onSubmit)()
            }}
          >
            {isSubmitting ? "Ingresando…" : "Ingresar"}
          </NxtButton>
        </Stack>
      </form>
    </NxtLayoutAuth>
  )
}
