import { useCrearModulo } from "@/features/admin-cursos/hooks/use-editor-curso"
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/patterns/dialog"
import { Button } from "@/shared/ui/primitives/button"
import { useState } from "react"

interface AddModuloDialogProps {
  readonly cursoId: string
  readonly areaId: string
  readonly areaNombre: string
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
}

export function AddModuloDialog({
  cursoId,
  areaId,
  areaNombre,
  open,
  onOpenChange,
}: AddModuloDialogProps) {
  const crear = useCrearModulo(cursoId)
  const [titulo, setTitulo] = useState("")

  const handleSubmit = () => {
    if (titulo.trim().length < 3) {
      return
    }
    crear.mutate(
      { titulo: titulo.trim(), areaId },
      {
        onSuccess: () => {
          setTitulo("")
          onOpenChange(false)
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader eyebrow={areaNombre}>
          <DialogTitle>Nuevo módulo</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="flex flex-col gap-1.5">
            <span className="font-medium text-text-secondary text-xs">Título del módulo</span>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="ej. Fundamentos de React"
              className="rounded-[var(--radius-sm)] border border-glass-border bg-glass-1 px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-violet"
            />
            {titulo.trim().length > 0 && titulo.trim().length < 3 ? (
              <p className="text-[11px] text-warning">Mínimo 3 caracteres</p>
            ) : null}
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={titulo.trim().length < 3 || crear.isPending}
            loading={crear.isPending}
          >
            Crear módulo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
