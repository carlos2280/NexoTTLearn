import { login } from "@/features/auth/api/login.api"
import type { LoginResponse } from "@/features/auth/types"
import { ApiError } from "@/shared/api/api-error"
import { Banner } from "@/shared/components/ui/banner"
import { Button } from "@/shared/components/ui/button"
import { PasswordField } from "@/shared/components/ui/password-field"
import { TextField } from "@/shared/components/ui/text-field"
import { useMutation } from "@tanstack/react-query"
import { motion, useReducedMotion } from "framer-motion"
import { Lock, Mail } from "lucide-react"
import { type FormEvent, useState } from "react"
import { z } from "zod"

const schema = z.object({
  email: z.string().min(1, "Ingresa tu email").email("Ingresa un email válido"),
  password: z.string().min(1, "Ingresa tu contraseña"),
})

interface PasoCredencialesProps {
  readonly onExito: (resp: LoginResponse) => Promise<void> | void
}

const stagger = (i: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: {
    type: "spring" as const,
    stiffness: 120,
    damping: 18,
    mass: 0.7,
    delay: 0.32 + i * 0.07,
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-7" noValidate={true}>
      <motion.header {...motionProps(0)} className="flex flex-col gap-2">
        <span className="nx-eyebrow text-aurora-violet">Acceso · Colaboradores</span>
        <h2 className="text-display-md text-text-primary">
          Bienvenido<span className="text-aurora-violet">.</span>
        </h2>
        <p className="max-w-[340px] text-body-lg text-text-secondary">
          Tu próximo curso te está esperando.
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
        <TextField
          label="Email corporativo"
          icon={<Mail className="h-4 w-4" />}
          type="email"
          autoComplete="email"
          autoFocus={true}
          placeholder="nombre@nttdata.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={mutation.isPending}
          error={errores.email}
        />
      </motion.div>

      <motion.div {...motionProps(2)}>
        <PasswordField
          label="Contraseña"
          icon={<Lock className="h-4 w-4" />}
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={mutation.isPending}
          error={errores.password}
        />
      </motion.div>

      <motion.div {...motionProps(3)} className="flex flex-col gap-3 pt-1">
        <Button type="submit" fullWidth={true} isLoading={mutation.isPending}>
          Ingresar
        </Button>
        <p className="text-center text-caption text-text-tertiary">
          ¿Problemas para entrar?{" "}
          <a
            href="mailto:soporte.nexott@nttdata.com"
            className="font-medium text-accent transition-colors duration-fast hover:text-accent-hover"
          >
            Escribe a soporte
          </a>
        </p>
      </motion.div>
    </form>
  )
}
