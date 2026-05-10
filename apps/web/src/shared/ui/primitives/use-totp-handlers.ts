import type { ClipboardEvent, KeyboardEvent, MutableRefObject } from "react"

interface UseTotpHandlersInput {
  readonly digits: readonly string[]
  readonly inputs: MutableRefObject<Array<HTMLInputElement | null>>
  readonly length: number
  readonly emit: (next: string) => void
}

export function useTotpHandlers({ digits, inputs, length, emit }: UseTotpHandlersInput) {
  const handleInput = (index: number, raw: string) => {
    const digit = raw.replace(/\D/g, "").slice(-1)
    const arr = digits.slice()
    arr[index] = digit
    const next = arr.join("").slice(0, length)
    emit(next)
    if (digit && index < length - 1) {
      inputs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (digits[index]) {
        const arr = digits.slice()
        arr[index] = ""
        emit(arr.join(""))
        return
      }
      if (index > 0) {
        const arr = digits.slice()
        arr[index - 1] = ""
        emit(arr.join(""))
        inputs.current[index - 1]?.focus()
      }
      return
    }
    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault()
      inputs.current[index - 1]?.focus()
      return
    }
    if (e.key === "ArrowRight" && index < length - 1) {
      e.preventDefault()
      inputs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length)
    if (!text) {
      return
    }
    e.preventDefault()
    emit(text)
    const focusIdx = Math.min(text.length, length - 1)
    inputs.current[focusIdx]?.focus()
  }

  return { handleInput, handleKeyDown, handlePaste }
}
