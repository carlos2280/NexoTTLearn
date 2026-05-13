import { cambiarPassword } from "@/features/auth/api/cambiar-password.api"
import { ApiError } from "@/shared/api/api-error"
import { Banner } from "@/shared/components/ui/banner"
import { Button } from "@/shared/components/ui/button"
import { PasswordField } from "@/shared/components/ui/password-field"
import { useMutation } from "@tanstack/react-query"
import { motion, useReducedMotion } from "framer-motion"
import { KeyRound, Lock, LockKeyhole } from "lucide-react"
import { type FormEvent, useState } from "react"
import { z } from "zod"
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

const stagger = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: {
    type: "spring" as const,
    stiffness: 80,
    damping: 18,
    mass: 0.6,
    delay: 0.3 + i * 0.07,
  },
})

export function PasoCambiarPassword({ onExito }: PasoCambiarPasswordProps) {
  const reducedMotion = useReducedMotion()
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
  const motionProps = (i: number) => (reducedMotion ? {} : stagger(i))

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
      .mutateAsync({ passwordActual: actual, passwordNuevo: nueva })
      .catch(() => undefined)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate={true}>
      <motion.header {...motionProps(0)} className="flex flex-col gap-1.5">
        <span className="nx-eyebrow text-aurora-violet">Primer acceso</span>
        <h2 className="text-h1 text-text-primary">
          Define tu contraseña<span className="text-aurora-violet">.</span>
        </h2>
        <p className="text-body-sm text-text-secondary">Es la llave a tu ficha de skills.</p>
      </motion.header>

      {apiError ? (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <Banner tone="danger">{apiError.message}</Banner>
        </motion.div>
      ) : null}

      <motion.div {...motionProps(1)}>
        <PasswordField
          label="Contraseña actual"
          icon={<Lock className="h-4 w-4" />}
          autoComplete="current-password"
          autoFocus={true}
          placeholder="••••••••"
          value={actual}
          onChange={(e) => setActual(e.target.value)}
          disabled={mutation.isPending}
          error={errores.actual}
        />
      </motion.div>

      <motion.div {...motionProps(2)} className="flex flex-col gap-2.5">
        <PasswordField
          label="Nueva contraseña"
          icon={<KeyRound className="h-4 w-4" />}
          autoComplete="new-password"
          placeholder="••••••••"
          value={nueva}
          onChange={(e) => setNueva(e.target.value)}
          disabled={mutation.isPending}
          error={errores.nueva}
        />
        <CriteriosPassword valor={nueva} />
      </motion.div>

      <motion.div {...motionProps(3)}>
        <PasswordField
          label="Repite la nueva contraseña"
          icon={<LockKeyhole className="h-4 w-4" />}
          autoComplete="new-password"
          placeholder="••••••••"
          value={repetida}
          onChange={(e) => setRepetida(e.target.value)}
          disabled={mutation.isPending}
          error={errores.repetida}
        />
      </motion.div>

      <motion.div {...motionProps(4)} className="pt-1">
        <Button type="submit" fullWidth={true} isLoading={mutation.isPending}>
          Guardar y continuar
        </Button>
      </motion.div>
    </form>
  )
}
