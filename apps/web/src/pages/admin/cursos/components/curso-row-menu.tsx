import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/primitives/dropdown-menu"
import type { CursoListItem } from "@nexott-learn/shared-types"
import { Archive, Copy, Eye, Lock, MoreHorizontal, PenLine, Trash2, Users } from "lucide-react"

interface CourseRowMenuProps {
  readonly curso: CursoListItem
  readonly align?: "start" | "center" | "end"
  readonly onEdit: (curso: CursoListItem) => void
  readonly onDuplicate: (curso: CursoListItem) => void
  readonly onSeguimiento: (curso: CursoListItem) => void
  readonly onCandidatos: (curso: CursoListItem) => void
  readonly onUnpublish: (curso: CursoListItem) => void
  readonly onClose: (curso: CursoListItem) => void
  readonly onDelete: (curso: CursoListItem) => void
}

export function CursoRowMenu({
  curso,
  align = "end",
  onEdit,
  onDuplicate,
  onSeguimiento,
  onCandidatos,
  onUnpublish,
  onClose,
  onDelete,
}: CourseRowMenuProps) {
  const isActivo = curso.estado === "ACTIVO"
  const isBorrador = curso.estado === "BORRADOR"
  const sinCandidatos = curso.contadores.inscripcionesActivas === 0
  const puedeEliminar = isBorrador && sinCandidatos

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Acciones de ${curso.titulo}`}
        className="inline-flex size-8 items-center justify-center rounded-[var(--radius-sm)] text-text-muted transition-colors hover:bg-glass-2 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-violet"
        onClick={(e) => e.stopPropagation()}
      >
        <MoreHorizontal className="size-4" strokeWidth={1.75} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} sideOffset={6} onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem icon={PenLine} onSelect={() => onEdit(curso)}>
          Editar
        </DropdownMenuItem>
        <DropdownMenuItem icon={Eye} onSelect={() => onSeguimiento(curso)}>
          Ver seguimiento
        </DropdownMenuItem>
        <DropdownMenuItem icon={Users} onSelect={() => onCandidatos(curso)}>
          Ver candidatos
        </DropdownMenuItem>
        <DropdownMenuItem icon={Copy} onSelect={() => onDuplicate(curso)}>
          Duplicar
        </DropdownMenuItem>
        {isActivo ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem icon={Lock} onSelect={() => onUnpublish(curso)}>
              Despublicar
            </DropdownMenuItem>
            <DropdownMenuItem icon={Archive} onSelect={() => onClose(curso)}>
              Cerrar curso
            </DropdownMenuItem>
          </>
        ) : null}
        {puedeEliminar ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem icon={Trash2} tone="danger" onSelect={() => onDelete(curso)}>
              Eliminar
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
