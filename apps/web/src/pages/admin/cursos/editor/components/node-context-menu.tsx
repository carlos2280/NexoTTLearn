import type { TreeMenu } from "@/shared/ui/patterns/immersive/types"
import {
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
} from "@/shared/ui/primitives/context-menu"
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/shared/ui/primitives/dropdown-menu"
import { Archive, ArchiveRestore, Trash2 } from "lucide-react"

/**
 * Construye los TreeMenu de módulos y secciones del editor. Recibe
 * callbacks ya construidos por el padre (un único hook de mutación por
 * tipo/curso) en vez de invocar hooks por nodo. La confirmación de
 * eliminar es responsabilidad del padre (un único ConfirmDialog).
 */

interface ModuloMenuArgs {
  readonly archivado: boolean
  readonly puedeEliminar: boolean
  readonly onToggleArchivar: () => void
  readonly onSolicitarEliminar: () => void
  readonly disabled?: boolean
}

export function buildModuloMenu(args: ModuloMenuArgs): TreeMenu {
  return {
    contextItems: (
      <>
        <ContextMenuLabel>Módulo</ContextMenuLabel>
        <ContextMenuSeparator />
        <ContextMenuItem
          icon={args.archivado ? ArchiveRestore : Archive}
          onSelect={args.onToggleArchivar}
          disabled={args.disabled}
        >
          {args.archivado ? "Desarchivar módulo" : "Archivar módulo"}
        </ContextMenuItem>
        {args.puedeEliminar ? (
          <ContextMenuItem
            icon={Trash2}
            tone="danger"
            onSelect={args.onSolicitarEliminar}
            disabled={args.disabled}
          >
            Eliminar módulo
          </ContextMenuItem>
        ) : null}
      </>
    ),
    dropdownItems: (
      <>
        <DropdownMenuLabel>Módulo</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          icon={args.archivado ? ArchiveRestore : Archive}
          onSelect={args.onToggleArchivar}
          disabled={args.disabled}
        >
          {args.archivado ? "Desarchivar módulo" : "Archivar módulo"}
        </DropdownMenuItem>
        {args.puedeEliminar ? (
          <DropdownMenuItem
            icon={Trash2}
            tone="danger"
            onSelect={args.onSolicitarEliminar}
            disabled={args.disabled}
          >
            Eliminar módulo
          </DropdownMenuItem>
        ) : null}
      </>
    ),
  }
}

interface SeccionMenuArgs {
  readonly archivado: boolean
  readonly puedeEliminar: boolean
  readonly onToggleArchivar: () => void
  readonly onSolicitarEliminar: () => void
  readonly disabled?: boolean
}

export function buildSeccionMenu(args: SeccionMenuArgs): TreeMenu {
  return {
    contextItems: (
      <>
        <ContextMenuLabel>Sección</ContextMenuLabel>
        <ContextMenuSeparator />
        <ContextMenuItem
          icon={args.archivado ? ArchiveRestore : Archive}
          onSelect={args.onToggleArchivar}
          disabled={args.disabled}
        >
          {args.archivado ? "Desarchivar sección" : "Archivar sección"}
        </ContextMenuItem>
        {args.puedeEliminar ? (
          <ContextMenuItem
            icon={Trash2}
            tone="danger"
            onSelect={args.onSolicitarEliminar}
            disabled={args.disabled}
          >
            Eliminar sección
          </ContextMenuItem>
        ) : null}
      </>
    ),
    dropdownItems: (
      <>
        <DropdownMenuLabel>Sección</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          icon={args.archivado ? ArchiveRestore : Archive}
          onSelect={args.onToggleArchivar}
          disabled={args.disabled}
        >
          {args.archivado ? "Desarchivar sección" : "Archivar sección"}
        </DropdownMenuItem>
        {args.puedeEliminar ? (
          <DropdownMenuItem
            icon={Trash2}
            tone="danger"
            onSelect={args.onSolicitarEliminar}
            disabled={args.disabled}
          >
            Eliminar sección
          </DropdownMenuItem>
        ) : null}
      </>
    ),
  }
}
