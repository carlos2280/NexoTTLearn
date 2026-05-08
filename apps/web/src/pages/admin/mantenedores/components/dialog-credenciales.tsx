import { CopyField } from "@/shared/ui/patterns/copy-field"
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/patterns/dialog"
import { Button } from "@/shared/ui/primitives/button"
import { ShieldAlert } from "lucide-react"

interface DialogCredencialesProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly email?: string
  readonly passwordTemporal?: string
  readonly title: string
  readonly description: string
}

export function DialogCredenciales({
  open,
  onOpenChange,
  email,
  passwordTemporal,
  title,
  description,
}: DialogCredencialesProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader eyebrow="Credenciales generadas">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogBody>
          {email ? (
            <div className="flex flex-col gap-1.5">
              <span className="font-medium text-text-secondary text-xs tracking-wide">Email</span>
              <CopyField value={email} label="Copiar email" />
            </div>
          ) : null}
          {passwordTemporal ? (
            <div className="flex flex-col gap-1.5">
              <span className="font-medium text-text-secondary text-xs tracking-wide">
                Password temporal
              </span>
              <CopyField value={passwordTemporal} label="Copiar password" />
            </div>
          ) : null}
          <div className="flex items-start gap-2.5 rounded-[var(--radius-md)] bg-[var(--warning-bg)] p-3 text-warning text-xs">
            <ShieldAlert className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            <span>
              Esta password se muestra una sola vez. Cópiala antes de cerrar; el usuario la cambiará
              en su primer ingreso.
            </span>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Listo</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
