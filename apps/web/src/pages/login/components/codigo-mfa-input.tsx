import { cn } from "@/shared/lib/cn"
import { motion, useReducedMotion } from "framer-motion"
import { type ClipboardEvent, type KeyboardEvent, useEffect, useMemo, useState } from "react"

interface CodigoMfaInputProps {
  readonly onChange: (codigo: string) => void
  readonly onComplete?: (codigo: string) => void
  readonly disabled?: boolean
  readonly hasError?: boolean
}

const LENGTH = 6
const POSICIONES = [0, 1, 2, 3, 4, 5] as const

export function CodigoMfaInput(props: CodigoMfaInputProps) {
  const { onChange, onComplete, disabled, hasError } = props
  const reducedMotion = useReducedMotion()
  const [digitos, setDigitos] = useState<string[]>(() => Array.from({ length: LENGTH }, () => ""))
  const refs = useMemo(
    () => Array.from({ length: LENGTH }, () => ({ current: null as HTMLInputElement | null })),
    [],
  )

  const completo = digitos.every((d) => d !== "")
  const codigo = digitos.join("")

  useEffect(() => {
    onChange(codigo)
    if (completo && onComplete) {
      onComplete(codigo)
    }
  }, [codigo, completo, onChange, onComplete])

  function setDigito(index: number, valor: string): void {
    const limpio = valor.replace(/\D/g, "").slice(-1)
    setDigitos((prev) => {
      const next = [...prev]
      next[index] = limpio
      return next
    })
    if (limpio && index < LENGTH - 1) {
      refs[index + 1]?.current?.focus()
    }
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key === "Backspace" && !digitos[index] && index > 0) {
      refs[index - 1]?.current?.focus()
    }
    if (event.key === "ArrowLeft" && index > 0) {
      refs[index - 1]?.current?.focus()
    }
    if (event.key === "ArrowRight" && index < LENGTH - 1) {
      refs[index + 1]?.current?.focus()
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>): void {
    const texto = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, LENGTH)
    if (!texto) {
      return
    }
    event.preventDefault()
    const siguientes = Array.from({ length: LENGTH }, (_, i) => texto[i] ?? "")
    setDigitos(siguientes)
    const focusIndex = Math.min(texto.length, LENGTH - 1)
    refs[focusIndex]?.current?.focus()
  }

  return (
    <div className="flex justify-between gap-2 sm:gap-3">
      {POSICIONES.map((i) => {
        const valor = digitos[i] ?? ""
        return (
          <motion.div
            key={i}
            initial={reducedMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.6, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 18,
              delay: reducedMotion ? 0 : 0.15 + i * 0.05,
            }}
            className="relative flex-1"
          >
            <input
              ref={(node) => {
                const slot = refs[i]
                if (slot) {
                  slot.current = node
                }
              }}
              value={valor}
              onChange={(e) => setDigito(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={handlePaste}
              inputMode="numeric"
              autoComplete={i === 0 ? "one-time-code" : "off"}
              maxLength={1}
              disabled={disabled}
              aria-label={`Dígito ${i + 1} de ${LENGTH}`}
              className={cn(
                "h-14 w-full rounded-md border bg-surface",
                "tabular text-center font-medium font-mono text-mfa text-text-primary",
                "transition-[border-color,box-shadow,background-color] duration-base ease-default",
                "focus:border-accent focus:shadow-ring-accent focus:outline-none",
                "disabled:cursor-not-allowed disabled:opacity-50",
                valor ? "border-accent bg-accent-soft" : "border-border-strong",
                hasError && "border-danger focus:border-danger focus:shadow-ring-danger",
              )}
            />
          </motion.div>
        )
      })}
    </div>
  )
}
