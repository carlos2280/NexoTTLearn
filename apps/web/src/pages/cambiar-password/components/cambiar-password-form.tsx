import { NxtButton, NxtInputField } from "@carlos2280/nexott-ui/react"
import { Box, Stack } from "@carlos2280/nexott-ui/react-primitives"
import { useCambiarPasswordForm } from "../hooks/use-cambiar-password-form"

interface CambiarPasswordFormProps {
  readonly onSuccess: (destino: string) => void
}

export function CambiarPasswordForm({ onSuccess }: CambiarPasswordFormProps) {
  const { register, handleSubmit, errors, isSubmitting } = useCambiarPasswordForm({
    onSuccess,
  })

  return (
    <form onSubmit={handleSubmit} noValidate={true}>
      <Stack gap="lg">
        <NxtInputField
          variant="filled"
          label="Contrasena actual"
          type="password"
          icon="lock"
          autocomplete="current-password"
          toggle-password={true}
          {...register("passwordActual")}
          state={errors.passwordActual ? "error" : ""}
          helper={errors.passwordActual?.message ?? ""}
        />

        <NxtInputField
          variant="filled"
          label="Contrasena nueva"
          type="password"
          icon="lock"
          autocomplete="new-password"
          toggle-password={true}
          {...register("passwordNuevo")}
          state={errors.passwordNuevo ? "error" : ""}
          helper={
            errors.passwordNuevo?.message ??
            "Minimo 8 caracteres, 1 mayuscula, 1 minuscula, 1 numero"
          }
        />

        <NxtInputField
          variant="filled"
          label="Confirmar contrasena nueva"
          type="password"
          icon="lock"
          autocomplete="new-password"
          toggle-password={true}
          {...register("confirmacion")}
          state={errors.confirmacion ? "error" : ""}
          helper={errors.confirmacion?.message ?? ""}
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
            await handleSubmit()
          }}
        >
          {isSubmitting ? "Guardando…" : "Cambiar contrasena"}
        </NxtButton>
      </Stack>
    </form>
  )
}
