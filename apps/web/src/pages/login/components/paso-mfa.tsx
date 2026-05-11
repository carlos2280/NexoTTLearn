import { verificarMfa } from "@/features/auth/api/verificar-mfa.api"
import { ApiError } from "@/shared/api/api-error"
import { Banner } from "@/shared/components/ui/banner"
import { Button } from "@/shared/components/ui/button"
import { MagneticButton } from "@/shared/components/ui/magnetic-button"
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
        .mutateAsync({ challengeId: challenge.id, codigo: codigoFinal })
        .catch(() => undefined)
    },
    [challenge.id, mutation],
  )

  return (
    <div className="flex flex-col gap-7">
      <header className="flex flex-col gap-2">
        <p className="font-medium text-[11px] text-[var(--color-text-tertiary)] uppercase leading-4 tracking-[0.22em]">
          Verificación
        </p>
        <h2 className="font-semibold text-[36px] text-[var(--color-text-primary)] leading-[1.05] tracking-[-0.03em]">
          Confírmalo<span className="text-[var(--color-accent)]">.</span>
        </h2>
        <p className="text-[14px] text-[var(--color-text-secondary)] leading-5">
          Ingresa el código de 6 dígitos de tu app autenticadora.
        </p>
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
        <MagneticButton
          type="button"
          fullWidth={true}
          isLoading={mutation.isPending}
          disabled={codigo.length < 6}
          onClick={() => enviar(codigo)}
        >
          Verificar
        </MagneticButton>
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
