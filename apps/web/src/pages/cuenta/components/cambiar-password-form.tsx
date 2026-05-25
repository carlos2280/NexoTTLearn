import { useCambiarPassword } from "@/features/auth/hooks/use-cambiar-password"
import {
  CRITERIOS_PASSWORD,
  CriteriosPassword,
  cumpleTodosLosCriterios,
} from "@/pages/login/components/criterios-password"
import { ApiError } from "@/shared/api/api-error"
import { Banner } from "@/shared/components/ui/banner"
import { Button } from "@/shared/components/ui/button"
import { Field } from "@/shared/components/ui/field"
import { Input } from "@/shared/components/ui/input"
import { type FormEvent, useState } from "react"
import { toast } from "sonner"
import { z } from "zod"

const schema = z
  .object({
    actual: z.string().min(1, "Ingresa tu contraseña actual"),
    nueva: z.string().min(10, "Mínimo 10 caracteres"),
    repetida: z.string().min(1, "Repite la nueva contraseña"),
  })
  .refine((d) => d.nueva === d.repetida, {
    message: "Las contraseñas no coinciden",
    path: ["repetida"],
  })

interface ErroresForm {
  actual?: string
  nueva?: string
  repetida?: string
}

export function CambiarPasswordForm() {
  const [actual, setActual] = useState("")
  const [nueva, setNueva] = useState("")
  const [repetida, setRepetida] = useState("")
  const [errores, setErrores] = useState<ErroresForm>({})
  const mutation = useCambiarPassword()
  const apiError = mutation.error instanceof ApiError ? mutation.error : null

  async function manejarSubmit(event: FormEvent): Promise<void> {
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
      setErrores({ nueva: `Faltan criterios: ${CRITERIOS_PASSWORD.length}` })
      return
    }
    try {
      await mutation.mutateAsync({ passwordActual: actual, passwordNuevo: nueva })
      toast.success("Contraseña actualizada")
      setActual("")
      setNueva("")
      setRepetida("")
    } catch {
      // El error se renderiza desde apiError
    }
  }

  return (
    <form onSubmit={manejarSubmit} className="flex flex-col gap-4" noValidate={true}>
      {apiError ? <Banner tone="danger">{apiError.message}</Banner> : null}
      <Field label="Contraseña actual" error={errores.actual}>
        {(attrs) => (
          <Input
            {...attrs}
            type="password"
            autoComplete="current-password"
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
      <div>
        <Button type="submit" size="sm" isLoading={mutation.isPending}>
          Actualizar contraseña
        </Button>
      </div>
    </form>
  )
}
