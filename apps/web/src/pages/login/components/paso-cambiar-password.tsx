import { useMutation } from "@tanstack/react-query"
import { type FormEvent, useState } from "react"
import { z } from "zod"
import { cambiarPassword } from "@/features/auth/api/cambiar-password.api"
import { ApiError } from "@/shared/api/api-error"
import { Banner } from "@/shared/components/ui/banner"
import { Button } from "@/shared/components/ui/button"
import { Field } from "@/shared/components/ui/field"
import { Input } from "@/shared/components/ui/input"
import { CriteriosPassword, cumpleTodosLosCriterios } from "./criterios-password"

interface PasoCambiarPasswordProps {
  readonly onExito: () => Promise<void> | void
}

const schema = z
  .object({
    actual: z.string().min(1, "Ingresa tu contraseña actual"),
    nueva: z.string().min(10, "Mínimo 10 caracteres"),
    repetida: z.string().min(1, "Repite la nueva contraseña"),
  })
  .refine((data) => data.nueva === data.repetida, {
    message: "Las contraseñas no coinciden",
    path: ["repetida"],
  })

export function PasoCambiarPassword({ onExito }: PasoCambiarPasswordProps) {
  const [actual, setActual] = useState("")
  const [nueva, setNueva] = useState("")
  const [repetida, setRepetida] = useState("")
  const [errores, setErrores] = useState<Record<string, string | undefined>>({})

  const mutation = useMutation({
    mutationFn: cambiarPassword,
    onSuccess: async () => {
      await onExito()
    },
  })

  const apiError = mutation.error instanceof ApiError ? mutation.error : null

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault()
    setErrores({})
    const parsed = schema.safeParse({ actual, nueva, repetida })
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors
      setErrores({
        actual: flat.actual?.[0],
        nueva: flat.nueva?.[0],
        repetida: flat.repetida?.[0],
      })
      return
    }
    if (!cumpleTodosLosCriterios(nueva)) {
      setErrores({ nueva: "La contraseña no cumple los criterios" })
      return
    }
    await mutation
      .mutateAsync({ passwordActual: actual, passwordNueva: nueva })
      .catch(() => undefined)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      <header className="flex flex-col gap-1.5">
        <h2 className="font-semibold text-[24px] text-[var(--color-text-primary)] leading-8 tracking-tight">
          Crea una nueva contraseña
        </h2>
        <p className="text-[14px] text-[var(--color-text-secondary)] leading-5">
          Por seguridad, debes cambiarla antes de continuar.
        </p>
      </header>

      {apiError ? <Banner tone="danger">{apiError.message}</Banner> : null}

      <Field label="Contraseña actual" error={errores.actual}>
        {(attrs) => (
          <Input
            {...attrs}
            type="password"
            autoComplete="current-password"
            autoFocus
            value={actual}
            onChange={(e) => setActual(e.target.value)}
            disabled={mutation.isPending}
            hasError={Boolean(errores.actual)}
          />
        )}
      </Field>

      <Field label="Nueva contraseña" error={errores.nueva}>
        {(attrs) => (
          <Input
            {...attrs}
            type="password"
            autoComplete="new-password"
            value={nueva}
            onChange={(e) => setNueva(e.target.value)}
            disabled={mutation.isPending}
            hasError={Boolean(errores.nueva)}
          />
        )}
      </Field>

      <CriteriosPassword valor={nueva} />

      <Field label="Repite la nueva contraseña" error={errores.repetida}>
        {(attrs) => (
          <Input
            {...attrs}
            type="password"
            autoComplete="new-password"
            value={repetida}
            onChange={(e) => setRepetida(e.target.value)}
            disabled={mutation.isPending}
            hasError={Boolean(errores.repetida)}
          />
        )}
      </Field>

      <Button type="submit" fullWidth size="lg" isLoading={mutation.isPending}>
        Guardar y continuar
      </Button>
    </form>
  )
}
