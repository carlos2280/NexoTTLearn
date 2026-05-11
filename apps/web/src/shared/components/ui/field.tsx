import { cn } from "@/shared/lib/cn"
import { AlertCircle } from "lucide-react"
import type { ReactNode } from "react"
import { useId } from "react"
import { Label } from "./label"

interface FieldProps {
  readonly label: string
  readonly hint?: string
  readonly error?: string
  readonly htmlFor?: string
  readonly children: (renderProps: {
    id: string
    "aria-invalid": boolean
    "aria-describedby": string | undefined
  }) => ReactNode
  readonly className?: string
}

export function Field(props: FieldProps) {
  const { label, hint, error, htmlFor, children, className } = props
  const reactId = useId()
  const id = htmlFor ?? `f-${reactId}`
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = errorId ?? hintId

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children({
        id,
        "aria-invalid": Boolean(error),
        "aria-describedby": describedBy,
      })}
      {error ? (
        <p
          id={errorId}
          className="flex items-center gap-1.5 text-[12px] text-[var(--color-danger)] leading-4"
        >
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      ) : hint ? (
        <p id={hintId} className="text-[12px] text-[var(--color-text-tertiary)] leading-4">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
