import { cn } from "@/shared/lib/cn"
import { Eye, EyeOff, type LucideIcon } from "lucide-react"
import { type InputHTMLAttributes, forwardRef, useId, useState } from "react"
import { tv } from "tailwind-variants"

const inputBase = tv({
  base: [
    "w-full bg-glass-1 text-text-primary placeholder:text-text-faint",
    "border border-glass-border rounded-[var(--radius-md)]",
    "transition-all duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)]",
    "hover:border-glass-border-strong",
    "focus-visible:outline-none focus-visible:border-brand-violet focus-visible:bg-glass-2",
    "focus-visible:shadow-[0_0_0_4px_rgb(124_58_237/0.18)]",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    "autofill:bg-glass-2",
  ],
  variants: {
    state: {
      default: "",
      error: [
        "border-danger/60 bg-[rgb(244_63_94/0.04)]",
        "focus-visible:border-danger focus-visible:shadow-[0_0_0_4px_rgb(244_63_94/0.2)]",
      ],
      success: ["border-success/60", "focus-visible:border-success"],
    },
    size: {
      sm: "h-9 text-xs",
      md: "h-11 text-sm",
      lg: "h-12 text-base",
    },
    hasLeadingIcon: { true: "pl-11" },
    hasTrailingAction: { true: "pr-11" },
  },
  defaultVariants: {
    state: "default",
    size: "md",
  },
  compoundVariants: [
    { hasLeadingIcon: false, class: "pl-3.5" },
    { hasTrailingAction: false, class: "pr-3.5" },
  ],
})

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  readonly label?: string
  readonly helper?: string
  readonly error?: string
  readonly icon?: LucideIcon
  readonly togglePassword?: boolean
  readonly inputSize?: "sm" | "md" | "lg"
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, label, helper, error, icon: Icon, togglePassword, inputSize, type, id, ...props },
  ref,
) {
  const autoId = useId()
  const inputId = id ?? autoId
  const helperId = `${inputId}-helper`
  const [showPassword, setShowPassword] = useState(false)

  const isPasswordToggle = Boolean(togglePassword && type === "password")
  const effectiveType = isPasswordToggle && showPassword ? "text" : type
  const state = error ? "error" : "default"
  const helperText = error ?? helper

  return (
    <div className="flex w-full flex-col gap-1.5">
      {label ? (
        <label htmlFor={inputId} className="font-medium text-text-secondary text-xs tracking-wide">
          {label}
        </label>
      ) : null}
      <div className="relative">
        {Icon ? (
          <Icon
            aria-hidden="true"
            className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3.5 size-4 text-text-muted"
          />
        ) : null}
        <input
          ref={ref}
          id={inputId}
          type={effectiveType}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={helperText ? helperId : undefined}
          className={cn(
            inputBase({
              state,
              size: inputSize,
              hasLeadingIcon: Boolean(Icon),
              hasTrailingAction: isPasswordToggle,
            }),
            className,
          )}
          {...props}
        />
        {isPasswordToggle ? (
          <PasswordToggle visible={showPassword} onToggle={() => setShowPassword((s) => !s)} />
        ) : null}
      </div>
      {helperText ? (
        <p
          id={helperId}
          className={cn("text-xs leading-tight", error ? "text-danger" : "text-text-muted")}
        >
          {helperText}
        </p>
      ) : null}
    </div>
  )
})

interface PasswordToggleProps {
  readonly visible: boolean
  readonly onToggle: () => void
}

function PasswordToggle({ visible, onToggle }: PasswordToggleProps) {
  const Icon = visible ? EyeOff : Eye
  return (
    <button
      type="button"
      tabIndex={-1}
      onClick={onToggle}
      aria-label={visible ? "Ocultar contrasena" : "Mostrar contrasena"}
      className={cn(
        "-translate-y-1/2 absolute top-1/2 right-2",
        "flex size-7 items-center justify-center rounded-[var(--radius-sm)]",
        "text-text-muted hover:bg-glass-2 hover:text-text-primary",
        "transition-colors focus-visible:outline-none",
        "focus-visible:ring-2 focus-visible:ring-brand-violet",
      )}
    >
      <Icon className="size-4" />
    </button>
  )
}
