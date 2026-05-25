import { Eye, EyeOff } from "lucide-react"
import type { InputHTMLAttributes, ReactNode } from "react"
import { forwardRef, useState } from "react"
import { TextField } from "./text-field"

interface PasswordFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "type"> {
  readonly label: string
  readonly icon?: ReactNode
  readonly error?: string
  readonly hint?: string
  readonly hasError?: boolean
}

/**
 * PasswordField — TextField con toggle de visibilidad integrado.
 * Encapsula el estado del "ojo" para que los formularios no se llenen
 * de useState repetidos.
 */
export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  function PasswordField(props, ref) {
    const [mostrar, setMostrar] = useState(false)

    return (
      <TextField
        ref={ref}
        {...props}
        type={mostrar ? "text" : "password"}
        rightSlot={
          <button
            type="button"
            onClick={() => setMostrar((v) => !v)}
            aria-label={mostrar ? "Ocultar contraseña" : "Mostrar contraseña"}
            className="flex h-7 w-7 items-center justify-center rounded-md text-text-tertiary transition-colors duration-base ease-default hover:bg-subtle hover:text-text-secondary focus-visible:outline-2 focus-visible:outline-aurora-violet focus-visible:outline-offset-2"
          >
            {mostrar ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        }
      />
    )
  },
)
