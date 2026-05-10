import { Button } from "@/shared/ui/primitives/button"
import { Input } from "@/shared/ui/primitives/input"
import { type FormEvent, type ReactNode, useEffect, useState } from "react"
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog"
import { FormField } from "./form-field"

interface PromptDialogProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly eyebrow?: string
  readonly title: string
  readonly description?: ReactNode
  readonly label: string
  readonly placeholder?: string
  readonly initialValue?: string
  readonly minLength?: number
  readonly minLengthMessage?: string
  readonly confirmLabel?: string
  readonly cancelLabel?: string
  readonly loading?: boolean
  readonly onConfirm: (value: string) => void | Promise<void>
}

export function PromptDialog({
  open,
  onOpenChange,
  eyebrow,
  title,
  description,
  label,
  placeholder,
  initialValue = "",
  minLength = 3,
  minLengthMessage,
  confirmLabel = "Aceptar",
  cancelLabel = "Cancelar",
  loading = false,
  onConfirm,
}: PromptDialogProps) {
  const [value, setValue] = useState(initialValue)
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    if (open) {
      setValue(initialValue)
      setTouched(false)
    }
  }, [open, initialValue])

  const trimmed = value.trim()
  const tooShort = trimmed.length < minLength
  const error =
    touched && tooShort ? (minLengthMessage ?? `Mínimo ${minLength} caracteres.`) : undefined

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (tooShort) {
      setTouched(true)
      return
    }
    await onConfirm(trimmed)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader eyebrow={eyebrow}>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <form onSubmit={handleSubmit} noValidate={true}>
          <DialogBody>
            <FormField label={label} error={error} required={true}>
              {(controlId) => (
                <Input
                  id={controlId}
                  autoFocus={true}
                  value={value}
                  placeholder={placeholder}
                  onChange={(e) => setValue(e.target.value)}
                  onBlur={() => setTouched(true)}
                />
              )}
            </FormField>
          </DialogBody>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {cancelLabel}
            </Button>
            <Button type="submit" loading={loading} disabled={tooShort}>
              {confirmLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
