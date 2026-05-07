import { useModulos } from "@/features/admin-cursos/hooks/use-editor-curso"
import type { CursoDetalle, SeccionListAdminResponse } from "@nexott-learn/shared-types"
import { InspectorCurso } from "../inspector/inspector-curso"
import { InspectorModulo } from "../inspector/inspector-modulo"
import { InspectorStub } from "../inspector/inspector-stub"
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
      return (
        <InspectorStub
          eyebrow="Hito"
          title="Proyecto Transversal"
          description={
            curso.proyectoTransversal.activo
              ? "El proyecto transversal está activo. Edición de enunciado y rúbrica pendiente."
              : "Inactivo. Activa para configurar enunciado, entrega y rúbrica."
          }
        />
      )
    case "entrevista":
      return (
        <InspectorStub
          eyebrow="Hito"
          title="Entrevista IA"
          description={
            curso.entrevistaIAConfig.activa
              ? "Entrevista activa. Edición de perfil y rúbrica pendiente."
              : "Inactiva. Activa para configurar perfil cliente, rúbrica y modo (texto/voz)."
          }
        />
      )
    default: {
      const _exhaustive: never = selected
      return _exhaustive
    }
  }
}
