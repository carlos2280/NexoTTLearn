import { cn } from "@/shared/lib/cn"
import { type HTMLAttributes, type ReactNode, useId } from "react"

interface FormFieldProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  readonly label: string
  readonly hint?: ReactNode
  readonly error?: string
  readonly required?: boolean
  readonly htmlFor?: string
  readonly children: (controlId: string) => ReactNode
}

export function FormField({
  label,
  hint,
  error,
  required,
  htmlFor,
  children,
  className,
  ...props
}: FormFieldProps) {
  const autoId = useId()
  const controlId = htmlFor ?? autoId
  const helperId = `${controlId}-helper`

  return (
    <div className={cn("flex w-full flex-col gap-1.5", className)} {...props}>
      <label htmlFor={controlId} className="font-medium text-text-secondary text-xs tracking-wide">
        {label}
        {required ? <span className="ml-1 text-brand-violet-soft">*</span> : null}
      </label>
      {children(controlId)}
      {error ? (
        <p id={helperId} className="text-danger text-xs leading-tight">
          {error}
        </p>
      ) : hint ? (
        <p id={helperId} className="text-text-muted text-xs leading-tight">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
