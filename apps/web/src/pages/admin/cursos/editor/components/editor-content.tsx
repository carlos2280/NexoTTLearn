import { useModulos } from "@/features/admin-cursos/hooks/use-editor-curso"
import { RUTAS } from "@/shared/constants/rutas"
import { ImmersiveShell } from "@/shared/ui/patterns/immersive/immersive-shell"
import { StructureTree } from "@/shared/ui/patterns/immersive/structure-tree"
import type { CursoDetalle } from "@nexott-learn/shared-types"
import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useSeccionesPorModulo } from "../hooks/use-secciones-por-modulo"
import { buildCursoTree, parseTreeId } from "../lib/build-tree"
import { computeSelectedTreeId } from "../lib/compute-selected-tree-id"
import { useEditorStore } from "../use-editor-store"
import { AddAreaDialog } from "./add-area-dialog"
import { AddModuloDialog } from "./add-modulo-dialog"
import { AddSeccionDialog } from "./add-seccion-dialog"
import { ChecklistOverlay } from "./checklist-overlay"
import { CommandPalette } from "./command-palette"
import { EditorBanner } from "./editor-banner"
import { EditorCanvasArea } from "./editor-canvas-area"
import { EditorRightColumn } from "./editor-right-column"
import { EditorTopbar } from "./editor-topbar"
import { PesosFooter, usePesos } from "./pesos-inline"

interface EditorContentProps {
  readonly curso: CursoDetalle
  readonly cursoId: string
  readonly modulosLoading: boolean
}

type ModuloTarget = { areaId: string; areaNombre: string }
type SeccionTarget = { moduloId: string; moduloTitulo: string }

export function EditorContent({ curso, cursoId, modulosLoading }: EditorContentProps) {
  const navigate = useNavigate()
  const selected = useEditorStore((s) => s.selected)
  const setSelected = useEditorStore((s) => s.setSelected)
  const openPublish = useEditorStore((s) => s.openPublish)

  const modulosQuery = useModulos(cursoId)
  const modulos = modulosQuery.data ?? []

  const seccionesPorModulo = useSeccionesPorModulo({ cursoId, modulos })

  // ── Estado de dialogs de creación ────────────────────────────────
  const [areaDialogOpen, setAreaDialogOpen] = useState(false)
  const [moduloTarget, setModuloTarget] = useState<ModuloTarget | null>(null)
  const [seccionTarget, setSeccionTarget] = useState<SeccionTarget | null>(null)

  // ── Edición inline de pesos en el árbol (áreas + nivel curso) ────
  const pesosState = usePesos({ cursoId, curso })

  const treeNodes = useMemo(
    () =>
      buildCursoTree({
        curso,
        cursoId,
        modulos,
        seccionesPorModulo,
        onAddArea: () => setAreaDialogOpen(true),
        onAddModulo: (areaId, areaNombre) => setModuloTarget({ areaId, areaNombre }),
        onAddSeccion: (moduloId, moduloTitulo) => setSeccionTarget({ moduloId, moduloTitulo }),
        pesosState,
      }),
    [curso, cursoId, modulos, seccionesPorModulo, pesosState],
  )

  const selectedTreeId = computeSelectedTreeId(selected)

  return (
    <>
      <ImmersiveShell
        topbar={
          <EditorTopbar
            curso={curso}
            onBack={() => navigate(RUTAS.admin.cursos)}
            onPublish={openPublish}
          />
        }
        banner={<EditorBanner curso={curso} cursoId={cursoId} onPublish={openPublish} />}
        leftColumn={
          <div className="flex h-full flex-col">
            <div className="shrink-0 border-glass-border border-b px-3 py-3">
              <p className="font-semibold text-[11px] text-text-muted uppercase tracking-[0.14em]">
                Estructura
              </p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {modulosLoading ? (
                <div className="px-4 py-3 text-text-muted text-xs">Cargando estructura…</div>
              ) : (
                <StructureTree
                  nodes={treeNodes}
                  selectedId={selectedTreeId}
                  onSelect={(id) => {
                    const parsed = parseTreeId(id)
                    if (!parsed || parsed.tipo === "candidatos") {
                      return
                    }
                    setSelected(parsed)
                  }}
                />
              )}
            </div>
            <div className="shrink-0 border-glass-border border-t px-3">
              <PesosFooter state={pesosState} />
            </div>
          </div>
        }
        canvas={
          <EditorCanvasArea
            curso={curso}
            cursoId={cursoId}
            seccionesPorModulo={seccionesPorModulo}
          />
        }
        rightColumn={
          <EditorRightColumn
            curso={curso}
            cursoId={cursoId}
            seccionesPorModulo={seccionesPorModulo}
            onPublish={openPublish}
          />
        }
      />

      <ChecklistOverlay
        cursoId={cursoId}
        modulos={modulos}
        seccionesPorModulo={seccionesPorModulo}
      />
      <CommandPalette curso={curso} cursoId={cursoId} seccionesPorModulo={seccionesPorModulo} />

      {/* ── Dialogs de creación contextual ────────────────────────── */}
      <AddAreaDialog
        cursoId={cursoId}
        curso={curso}
        open={areaDialogOpen}
        onOpenChange={setAreaDialogOpen}
        onAdded={(cursoAreaId) => setSelected({ tipo: "area", cursoAreaId })}
      />

      {moduloTarget ? (
        <AddModuloDialog
          cursoId={cursoId}
          areaId={moduloTarget.areaId}
          areaNombre={moduloTarget.areaNombre}
          open={Boolean(moduloTarget)}
          onOpenChange={(open) => !open && setModuloTarget(null)}
        />
      ) : null}

      {seccionTarget ? (
        <AddSeccionDialog
          cursoId={cursoId}
          moduloId={seccionTarget.moduloId}
          moduloTitulo={seccionTarget.moduloTitulo}
          open={Boolean(seccionTarget)}
          onOpenChange={(open) => !open && setSeccionTarget(null)}
        />
      ) : null}
    </>
  )
}
