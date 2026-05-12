import { verificarMfa } from "@/features/auth/api/verificar-mfa.api"
import { ApiError } from "@/shared/api/api-error"
import { Banner } from "@/shared/components/ui/banner"
import { Button } from "@/shared/components/ui/button"
import { useMutation } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { useCallback, useRef, useState } from "react"
import type { MfaChallenge } from "../login.types"
import { BandaTemporal } from "./banda-temporal"
import { CodigoMfaInput } from "./codigo-mfa-input"

interface PasoMfaProps {
  readonly challenge: MfaChallenge
  readonly onExito: () => Promise<void> | void
  readonly onReiniciar: () => void
}

export function PasoMfa({ challenge, onExito, onReiniciar }: PasoMfaProps) {
  const [codigo, setCodigo] = useState("")
  const ultimoEnviado = useRef<string>("")

  const mutation = useMutation({
    mutationFn: verificarMfa,
    onSuccess: async () => {
      await onExito()
    },
  })

  const apiError = mutation.error instanceof ApiError ? mutation.error : null

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
    <div className="flex flex-col gap-7">
      <header className="flex flex-col gap-2">
        <p className="nx-eyebrow text-text-tertiary">Doble verificación</p>
        <h2 className="text-h1 text-text-primary">
          Solo tú<span className="text-accent">.</span>
        </h2>
        <p className="text-body text-text-secondary">Código de tu app autenticadora.</p>
      </header>

      {apiError ? (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Banner tone="danger">{apiError.message}</Banner>
        </motion.div>
      ) : null}

      <CodigoMfaInput
        onChange={setCodigo}
        onComplete={enviar}
        disabled={mutation.isPending}
        hasError={Boolean(apiError)}
      />

      <BandaTemporal
        expiraEn={challenge.expiraEn}
        etiqueta="El código expira en"
        onExpirar={onReiniciar}
      />

      <div className="flex flex-col gap-2">
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
      </div>
    </div>
  )
}
