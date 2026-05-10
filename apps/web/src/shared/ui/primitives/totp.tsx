import { cn } from "@/shared/lib/cn"
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react"
import { type TotpCellState, totpCell } from "./totp.styles"
import { useTotpHandlers } from "./use-totp-handlers"

const LENGTH = 6

export interface TotpHandle {
  reset: () => void
  focus: () => void
}

export interface TotpProps {
  readonly value?: string
  readonly onChange?: (value: string) => void
  readonly onComplete?: (value: string) => void
  readonly disabled?: boolean
  readonly autoFocus?: boolean
  readonly state?: "default" | "error"
  readonly helper?: string
  readonly ariaLabel?: string
  readonly className?: string
}

export const Totp = forwardRef<TotpHandle, TotpProps>(function Totp(
  {
    value: controlled,
    onChange,
    onComplete,
    disabled,
    autoFocus,
    state = "default",
    helper,
    ariaLabel = "Codigo de verificacion",
    className,
  },
  ref,
) {
  const [internal, setInternal] = useState("")
  const value = controlled ?? internal
  const inputs = useRef<Array<HTMLInputElement | null>>([])

  useEffect(() => {
    if (autoFocus) {
      inputs.current[0]?.focus()
    }
  }, [autoFocus])

  const emit = (next: string) => {
    if (controlled === undefined) {
      setInternal(next)
    }
    onChange?.(next)
    if (next.length === LENGTH) {
      onComplete?.(next)
    }
  }

  useImperativeHandle(ref, () => ({
    reset: () => {
      if (controlled === undefined) {
        setInternal("")
      }
      onChange?.("")
      inputs.current[0]?.focus()
    },
    focus: () => {
      inputs.current[0]?.focus()
    },
  }))

  const digits = Array.from({ length: LENGTH }, (_, i) => value[i] ?? "")
  const { handleInput, handleKeyDown, handlePaste } = useTotpHandlers({
    digits,
    inputs,
    length: LENGTH,
    emit,
  })

  const baseState: TotpCellState = state === "error" ? "error" : "default"

  return (
    <div className={cn("flex w-full flex-col items-center gap-2", className)}>
      <fieldset
        aria-label={ariaLabel}
        className="m-0 flex items-center justify-center gap-2 border-0 p-0 sm:gap-3"
      >
        {digits.map((d, i) => (
          <input
            // biome-ignore lint/suspicious/noArrayIndexKey: posicion fija en grid de 6 celdas
            key={i}
            ref={(el) => {
              inputs.current[i] = el
            }}
            type="text"
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            maxLength={1}
            value={d}
            disabled={disabled}
            aria-label={`Digito ${i + 1}`}
            aria-invalid={state === "error" || undefined}
            onChange={(e) => handleInput(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            onFocus={(e) => e.target.select()}
            className={totpCell({
              state: d && baseState === "default" ? "filled" : baseState,
            })}
          />
        ))}
      </fieldset>
      {helper ? (
        <p
          role={state === "error" ? "alert" : undefined}
          className={cn(
            "text-xs leading-tight",
            state === "error" ? "text-danger" : "text-text-muted",
          )}
        >
          {helper}
        </p>
      ) : null}
    </div>
  )
})
