import { useMutation } from "@tanstack/react-query"
import { motion, useReducedMotion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { type FormEvent, useState } from "react"
import { z } from "zod"
import { login } from "@/features/auth/api/login.api"
import type { LoginResponse } from "@/features/auth/types"
import { ApiError } from "@/shared/api/api-error"
import { Banner } from "@/shared/components/ui/banner"
import { Field } from "@/shared/components/ui/field"
import { Input } from "@/shared/components/ui/input"
import { MagneticButton } from "@/shared/components/ui/magnetic-button"
import { SaludoContextual } from "./saludo-contextual"

const schema = z.object({
  email: z.string().min(1, "Ingresa tu email").email("Ingresa un email válido"),
  password: z.string().min(1, "Ingresa tu contraseña"),
})

interface PasoCredencialesProps {
  readonly onExito: (resp: LoginResponse) => Promise<void> | void
}

const stagger = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: {
    type: "spring" as const,
    stiffness: 80,
    damping: 18,
    mass: 0.6,
    delay: 0.35 + i * 0.08,
  },
})

export function PasoCredenciales({ onExito }: PasoCredencialesProps) {
  const reducedMotion = useReducedMotion()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errores, setErrores] = useState<{
    email?: string
    password?: string
  }>({})

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: async (resp) => {
      await onExito(resp)
    },
  })

  const apiError = mutation.error instanceof ApiError ? mutation.error : null
  const motionProps = (i: number) => (reducedMotion ? {} : stagger(i))

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault()
    setErrores({})
    const parsed = schema.safeParse({ email, password })
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors
      setErrores({
        email: flat.email?.[0],
        password: flat.password?.[0],
      })
      return
    }
    await mutation.mutateAsync(parsed.data).catch(() => undefined)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-7" noValidate>
      <motion.header {...motionProps(0)} className="flex flex-col gap-2">
        <p className="font-medium text-[11px] text-[var(--color-text-tertiary)] uppercase leading-4 tracking-[0.22em]">
          <SaludoContextual />
        </p>
        <h2 className="font-semibold text-[36px] text-[var(--color-text-primary)] leading-[1.05] tracking-[-0.03em]">
          Continuemos<span className="text-[var(--color-accent)]">.</span>
        </h2>
        <p className="text-[14px] text-[var(--color-text-secondary)] leading-5">
          Te esperábamos. Ingresa para retomar tu preparación.
        </p>
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
        <Field label="Email corporativo" error={errores.email}>
          {(attrs) => (
            <Input
              {...attrs}
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="tu.nombre@nexott.local"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={mutation.isPending}
              hasError={Boolean(errores.email)}
            />
          )}
        </Field>
      </motion.div>

      <motion.div {...motionProps(2)}>
        <Field label="Contraseña" error={errores.password}>
          {(attrs) => (
            <Input
              {...attrs}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={mutation.isPending}
              hasError={Boolean(errores.password)}
            />
          )}
        </Field>
      </motion.div>

      <motion.div {...motionProps(3)} className="flex flex-col gap-3 pt-1">
        <MagneticButton type="submit" fullWidth isLoading={mutation.isPending}>
          <span>Entrar</span>
          {!mutation.isPending ? <ArrowRight className="h-4 w-4" aria-hidden="true" /> : null}
        </MagneticButton>
        <p className="text-center text-[12px] text-[var(--color-text-tertiary)] leading-4">
          ¿Olvidaste tu contraseña? Tu administrador la regenera.
        </p>
      </motion.div>
    </form>
  )
}
