import { useCrearSeccion } from "@/features/admin-cursos/hooks/use-editor-curso"
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

interface AddSeccionDialogProps {
  readonly cursoId: string
  readonly moduloId: string
  readonly moduloTitulo: string
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
}

export function AddSeccionDialog({
  cursoId,
  moduloId,
  moduloTitulo,
  open,
  onOpenChange,
}: AddSeccionDialogProps) {
  const crear = useCrearSeccion(cursoId, moduloId)
  const [titulo, setTitulo] = useState("")

  const handleSubmit = () => {
    if (titulo.trim().length < 3) {
      return
    }
    crear.mutate(
      { titulo: titulo.trim() },
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
        <DialogHeader eyebrow={moduloTitulo}>
          <DialogTitle>Nueva sección</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="flex flex-col gap-1.5">
            <span className="font-medium text-text-secondary text-xs">Título de la sección</span>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="ej. Introducción al tema"
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
            Crear sección
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
