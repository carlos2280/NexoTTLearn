import {
  editorKeys,
  useArchivarModulo,
  useCrearBloque,
  useModulos,
} from "@/features/admin-cursos/hooks/use-editor-curso"
import type {
  BloqueListAdminResponse,
  CrearBloqueAdminInput,
  CursoDetalle,
  SeccionListAdminResponse,
} from "@nexott-learn/shared-types"
import { useQueryClient } from "@tanstack/react-query"
import { Command } from "cmdk"
import { Archive, Copy, MoveRight, Plus } from "lucide-react"
import { useCallback } from "react"
import { INSERT_BLOQUE_ITEMS } from "../canvas/insert-bloque-menu"
import { type SelectedNode, useEditorStore } from "../use-editor-store"
import { buildDuplicateInput } from "./command-palette/duplicate-bloque"
import { PaletteItem } from "./command-palette/palette-item"
import { type FlatTreeEntry, useFlatTree } from "./command-palette/use-flat-tree"

interface CommandPaletteProps {
  readonly curso: CursoDetalle
  readonly cursoId: string
  readonly seccionesPorModulo: ReadonlyMap<string, SeccionListAdminResponse>
}

export function CommandPalette({ curso, cursoId, seccionesPorModulo }: CommandPaletteProps) {
  const open = useEditorStore((s) => s.isPaletteOpen)
  const close = useEditorStore((s) => s.closePalette)
  const selected = useEditorStore((s) => s.selected)
  const setSelected = useEditorStore((s) => s.setSelected)

  const modulosQuery = useModulos(cursoId)
  const flatTree = useFlatTree({ curso, modulos: modulosQuery.data, seccionesPorModulo })

  const archivarModulo = useArchivarModulo(cursoId)
  const insertContext = resolveInsertContext(selected)
  const crearBloque = useCrearBloque(
    cursoId,
    insertContext?.moduloId ?? "",
    insertContext?.seccionId ?? "",
  )
  const qc = useQueryClient()

  const runAndClose = useCallback(
    (fn: () => void) => {
      fn()
      close()
    },
    [close],
  )

  const handleNavigate = (entry: FlatTreeEntry) => runAndClose(() => setSelected(entry.node))
  const handleInsert = (input: CrearBloqueAdminInput) =>
    runAndClose(() => crearBloque.mutate(input))

  const handleArchivarModulo = () => {
    if (selected.tipo !== "modulo") {
      return
    }
    runAndClose(() => archivarModulo.mutate({ moduloId: selected.moduloId, archivar: true }))
  }

  const handleDuplicarBloque = () => {
    if (selected.tipo !== "bloque") {
      return
    }
    const bloques = qc.getQueryData<BloqueListAdminResponse>(
      editorKeys.bloques(cursoId, selected.moduloId, selected.seccionId),
    )
    const source = bloques?.find((b) => b.id === selected.bloqueId)
    if (!source) {
      return
    }
    const input = buildDuplicateInput(source)
    if (!input) {
      return
    }
    runAndClose(() => crearBloque.mutate(input))
  }

  return (
    <Command.Dialog
      open={open}
      onOpenChange={(next) => (next ? null : close())}
      label="Paleta de comandos"
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 pt-[12vh]"
    >
      <div className="w-full max-w-xl overflow-hidden rounded-[var(--radius-lg)] border border-glass-border bg-surface-2 shadow-xl">
        <Command.Input
          placeholder="Buscar comando o nodo…"
          className="w-full border-glass-border border-b bg-transparent px-4 py-3 text-sm text-text-primary outline-none placeholder:text-text-faint"
        />
        <Command.List className="max-h-[60vh] overflow-y-auto p-2">
          <Command.Empty className="px-3 py-6 text-center text-text-muted text-xs">
            Sin coincidencias
          </Command.Empty>

          {insertContext ? (
            <Command.Group heading="Insertar bloque">
              {INSERT_BLOQUE_ITEMS.map((item) => (
                <PaletteItem
                  key={item.label}
                  icon={<Plus className="size-4" />}
                  label={item.label}
                  hint={item.hint}
                  onSelect={() => handleInsert(item.build())}
                />
              ))}
            </Command.Group>
          ) : null}

          {selected.tipo === "bloque" ? (
            <PaletteItem
              icon={<Copy className="size-4" />}
              label="Duplicar bloque seleccionado"
              onSelect={handleDuplicarBloque}
            />
          ) : null}

          {selected.tipo === "modulo" ? (
            <PaletteItem
              icon={<Archive className="size-4" />}
              label="Archivar módulo seleccionado"
              onSelect={handleArchivarModulo}
            />
          ) : null}

          <Command.Group heading="Navegar">
            {flatTree.map((entry) => (
              <PaletteItem
                key={entry.key}
                icon={<MoveRight className="size-4" />}
                label={entry.label}
                hint={entry.path}
                onSelect={() => handleNavigate(entry)}
              />
            ))}
          </Command.Group>
        </Command.List>
      </div>
    </Command.Dialog>
  )
}

function resolveInsertContext(
  selected: SelectedNode,
): { readonly moduloId: string; readonly seccionId: string } | null {
  if (selected.tipo === "seccion" || selected.tipo === "bloque") {
    return { moduloId: selected.moduloId, seccionId: selected.seccionId }
  }
  return null
}
