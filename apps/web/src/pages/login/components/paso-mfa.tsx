import { verificarMfa } from "@/features/auth/api/verificar-mfa.api"
import { ApiError } from "@/shared/api/api-error"
import { Banner } from "@/shared/components/ui/banner"
import { Button } from "@/shared/components/ui/button"
import { useMutation } from "@tanstack/react-query"
import { motion, useReducedMotion } from "framer-motion"
import { useCallback, useRef, useState } from "react"
import type { MfaChallenge } from "../login.types"
import { BandaTemporal } from "./banda-temporal"
import { CodigoMfaInput } from "./codigo-mfa-input"

interface PasoMfaProps {
  readonly challenge: MfaChallenge
  readonly onExito: () => Promise<void> | void
  readonly onReiniciar: () => void
}

const stagger = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: {
    type: "spring" as const,
    stiffness: 80,
    damping: 18,
    mass: 0.6,
    delay: 0.3 + i * 0.08,
  },
})

export function PasoMfa({ challenge, onExito, onReiniciar }: PasoMfaProps) {
  const reducedMotion = useReducedMotion()
  const [codigo, setCodigo] = useState("")
  const ultimoEnviado = useRef<string>("")

  const mutation = useMutation({
    mutationFn: verificarMfa,
    onSuccess: async () => {
      await onExito()
    },
  })

  const apiError = mutation.error instanceof ApiError ? mutation.error : null
  const motionProps = (i: number) => (reducedMotion ? {} : stagger(i))

  const enviar = useCallback(
    async (codigoFinal: string): Promise<void> => {
      if (codigoFinal.length !== 6 || ultimoEnviado.current === codigoFinal) {
        return
      }
      ultimoEnviado.current = codigoFinal
      await mutation
        .mutateAsync({ mfaChallengeId: challenge.id, codigo: codigoFinal })
        .catch(() => undefined)
    },
    [challenge.id, mutation],
  )

  return (
    <div className="flex flex-col gap-6">
      <motion.header {...motionProps(0)} className="flex flex-col gap-1.5">
        <span className="nx-eyebrow text-aurora-violet">Doble verificación</span>
        <h2 className="text-h1 text-text-primary">
          Solo tú<span className="text-aurora-violet">.</span>
        </h2>
        <p className="text-body-sm text-text-secondary">
          Ingresa el código de 6 dígitos de tu app autenticadora.
        </p>
      </motion.header>

      {apiError ? (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Banner tone="danger">{apiError.message}</Banner>
        </motion.div>
      ) : null}

      <motion.div {...motionProps(1)}>
        <CodigoMfaInput
          onChange={setCodigo}
          onComplete={enviar}
          disabled={mutation.isPending}
          hasError={Boolean(apiError)}
        />
      </motion.div>

      <motion.div {...motionProps(2)}>
        <BandaTemporal
          expiraEn={challenge.expiraEn}
          etiqueta="El código expira en"
          onExpirar={onReiniciar}
        />
      </motion.div>

      <motion.div {...motionProps(3)} className="flex flex-col gap-2 pt-1">
        <Button
          type="button"
          fullWidth={true}
          isLoading={mutation.isPending}
          disabled={codigo.length < 6}
          onClick={() => enviar(codigo)}
        >
          Verificar
        </Button>
        <Button
          type="button"
          variant="ghost"
          fullWidth={true}
          onClick={onReiniciar}
          disabled={mutation.isPending}
        >
          Volver al inicio
        </Button>
      </motion.div>
    </div>
  )
}
