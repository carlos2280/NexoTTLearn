import { Button } from "@/shared/ui/primitives/button"
import { AlertTriangle, Info, Trash2 } from "lucide-react"
import { type ReactNode, useId, useState } from "react"
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog"

type ConfirmTone = "warning" | "danger" | "info"

interface ConfirmDialogProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly tone?: ConfirmTone
  readonly title: string
  readonly description: ReactNode
  readonly confirmLabel: string
  readonly cancelLabel?: string
  readonly reasonLabel?: string
  readonly reasonPlaceholder?: string
  readonly loading?: boolean
  readonly onConfirm: (reason?: string) => void | Promise<void>
}

export function ConfirmDialog({
  open,
  onOpenChange,
  tone = "warning",
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancelar",
  reasonLabel,
  reasonPlaceholder = "Anade contexto (opcional)",
  loading = false,
  onConfirm,
}: ConfirmDialogProps) {
  const [reason, setReason] = useState("")
  const reasonId = useId()
  const Icon = tone === "danger" ? Trash2 : tone === "info" ? Info : AlertTriangle
  const iconBg =
    tone === "danger"
      ? "bg-[var(--danger-bg)] text-danger"
      : tone === "info"
        ? "bg-[var(--info-bg)] text-info"
        : "bg-[var(--warning-bg)] text-warning"
  const confirmVariant = tone === "danger" ? "danger" : "primary"

  function handleOpenChange(next: boolean) {
    if (!next) {
      setReason("")
    }
    onOpenChange(next)
  }

  async function handleConfirm() {
    await onConfirm(reasonLabel ? reason.trim() || undefined : undefined)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <div className="mb-2 flex items-center gap-3">
            <span
              aria-hidden="true"
              className={`flex size-10 items-center justify-center rounded-[var(--radius-md)] ${iconBg}`}
            >
              <Icon className="size-5" strokeWidth={1.75} />
            </span>
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {reasonLabel ? (
          <DialogBody>
            <label
              htmlFor={reasonId}
              className="font-medium text-text-secondary text-xs tracking-wide"
            >
              {reasonLabel}
            </label>
            <textarea
              id={reasonId}
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={reasonPlaceholder}
              className="w-full resize-none rounded-[var(--radius-md)] border border-glass-border bg-glass-1 px-3 py-2 text-sm text-text-primary placeholder:text-text-faint hover:border-glass-border-strong focus-visible:border-brand-violet focus-visible:bg-glass-2 focus-visible:shadow-[0_0_0_4px_rgb(124_58_237/0.18)] focus-visible:outline-none"
            />
          </DialogBody>
        ) : (
          <div className="h-2" />
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={() => handleOpenChange(false)} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={confirmVariant} loading={loading} onClick={handleConfirm}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
