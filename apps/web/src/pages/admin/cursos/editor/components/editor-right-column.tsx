import { useModulos } from "@/features/admin-cursos/hooks/use-editor-curso"
import type { CursoDetalle, SeccionListAdminResponse } from "@nexott-learn/shared-types"
import { InspectorCurso } from "../inspector/inspector-curso"
import { InspectorEntrevista } from "../inspector/inspector-entrevista"
import { InspectorModulo } from "../inspector/inspector-modulo"
import { InspectorStub } from "../inspector/inspector-stub"
import { InspectorTransversal } from "../inspector/inspector-transversal"
import { useEditorStore } from "../use-editor-store"
import { InspectorArea } from "./inspector-area"
import { InspectorSeccionBloque } from "./inspector-seccion-bloque"

interface EditorRightColumnProps {
  readonly curso: CursoDetalle
  readonly cursoId: string
  readonly seccionesPorModulo: ReadonlyMap<string, SeccionListAdminResponse>
  readonly onPublish: () => void
}

export function EditorRightColumn({
  curso,
  cursoId,
  seccionesPorModulo,
  onPublish,
}: EditorRightColumnProps) {
  const selected = useEditorStore((s) => s.selected)
  const modulosQuery = useModulos(cursoId)

  switch (selected.tipo) {
    case "curso":
      return <InspectorCurso curso={curso} onPublish={onPublish} />
    case "area":
      return <InspectorArea curso={curso} cursoAreaId={selected.cursoAreaId} />
    case "modulo": {
      const modulo = modulosQuery.data?.find((m) => m.id === selected.moduloId)
      if (!modulo) {
        return (
          <InspectorStub
            eyebrow="Módulo"
            title="Cargando…"
            description="Buscando módulo seleccionado."
          />
        )
      }
      return <InspectorModulo curso={curso} cursoId={cursoId} modulo={modulo} />
    }
    case "seccion":
    case "bloque":
      return (
        <InspectorSeccionBloque
          selected={selected}
          cursoId={cursoId}
          seccionesPorModulo={seccionesPorModulo}
        />
      )
    case "transversal":
      return <InspectorTransversal curso={curso} cursoId={cursoId} />
    case "entrevista":
      return <InspectorEntrevista curso={curso} cursoId={cursoId} />
    default: {
      const _exhaustive: never = selected
      return _exhaustive
    }
  }
}
