import { useModulos } from "@/features/admin-cursos/hooks/use-editor-curso"
import { RUTAS } from "@/shared/constants/rutas"
import { ImmersiveShell } from "@/shared/ui/patterns/immersive/immersive-shell"
import { StructureTree } from "@/shared/ui/patterns/immersive/structure-tree"
import type { CursoDetalle } from "@nexott-learn/shared-types"
import { useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useSeccionesPorModulo } from "../hooks/use-secciones-por-modulo"
import { buildCursoTree, parseTreeId } from "../lib/build-tree"
import { computeSelectedTreeId } from "../lib/compute-selected-tree-id"
import { useEditorStore } from "../use-editor-store"
import { ChecklistOverlay } from "./checklist-overlay"
import { EditorBanner } from "./editor-banner"
import { EditorCanvasArea } from "./editor-canvas-area"
import { EditorRightColumn } from "./editor-right-column"
import { EditorTopbar } from "./editor-topbar"

interface EditorContentProps {
  readonly curso: CursoDetalle
  readonly cursoId: string
  readonly modulosLoading: boolean
}

export function EditorContent({ curso, cursoId, modulosLoading }: EditorContentProps) {
  const navigate = useNavigate()
  const selected = useEditorStore((s) => s.selected)
  const setSelected = useEditorStore((s) => s.setSelected)
  const openPublish = useEditorStore((s) => s.openPublish)

  const modulosQuery = useModulos(cursoId)
  const modulos = modulosQuery.data ?? []

  const seccionesPorModulo = useSeccionesPorModulo({ cursoId, modulos })

  const treeNodes = useMemo(
    () => buildCursoTree({ curso, modulos, seccionesPorModulo }),
    [curso, modulos, seccionesPorModulo],
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
    </>
  )
}
