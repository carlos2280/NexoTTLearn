import { useCursoDetalle } from "@/features/admin-cursos/hooks/use-curso-detalle"
import { useModulos } from "@/features/admin-cursos/hooks/use-editor-curso"
import { RUTAS } from "@/shared/constants/rutas"
import { useCallback } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { EditorContent } from "./components/editor-content"
import { EditorError } from "./components/editor-error"
import { EditorLoading } from "./components/editor-loading"
import { useEditorShortcuts } from "./hooks/use-editor-shortcuts"
import { PublishDialog } from "./publish-dialog"
import { useEditorStore } from "./use-editor-store"

export function CursoEditorPage() {
  const { id: cursoId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const cursoQuery = useCursoDetalle(cursoId)
  const modulosQuery = useModulos(cursoId)

  const isPublishOpen = useEditorStore((s) => s.isPublishOpen)
  const openPublish = useEditorStore((s) => s.openPublish)
  const closePublish = useEditorStore((s) => s.closePublish)
  const openPalette = useEditorStore((s) => s.openPalette)

  const handleEscape = useCallback(() => navigate(RUTAS.admin.cursos), [navigate])

  useEditorShortcuts({
    isPublishOpen,
    onEscape: handleEscape,
    onPublishShortcut: openPublish,
    onPaletteShortcut: openPalette,
  })

  if (cursoQuery.isLoading || !cursoQuery.data) {
    return <EditorLoading />
  }

  if (cursoQuery.isError) {
    return <EditorError onBack={() => navigate(RUTAS.admin.cursos)} />
  }

  const curso = cursoQuery.data

  return (
    <>
      <EditorContent
        curso={curso}
        modulosLoading={modulosQuery.isLoading}
        cursoId={cursoId as string}
      />

      {cursoId ? (
        <PublishDialog
          cursoId={cursoId}
          open={isPublishOpen}
          onClose={closePublish}
          onPublished={() => {
            cursoQuery.refetch()
            setTimeout(closePublish, 200)
          }}
        />
      ) : null}
    </>
  )
}
