import { useModulos } from "@/features/admin-cursos/hooks/use-editor-curso"
import type {
  CursoDetalle,
  ModuloListAdminResponse,
  SeccionListAdminResponse,
} from "@nexott-learn/shared-types"
import { CanvasArea } from "../canvas/canvas-area"
import { CanvasCurso } from "../canvas/canvas-curso"
import { CanvasEntrevista } from "../canvas/canvas-entrevista"
import { CanvasModulo } from "../canvas/canvas-modulo"
import { CanvasSeccion } from "../canvas/canvas-seccion"
import { CanvasTransversal } from "../canvas/canvas-transversal"
import type { SelectedNode } from "../use-editor-store"
import { useEditorStore } from "../use-editor-store"

interface EditorCanvasAreaProps {
  readonly curso: CursoDetalle
  readonly cursoId: string
  readonly seccionesPorModulo: ReadonlyMap<string, SeccionListAdminResponse>
}

export function EditorCanvasArea({ curso, cursoId, seccionesPorModulo }: EditorCanvasAreaProps) {
  const selected = useEditorStore((s) => s.selected)
  const setSelected = useEditorStore((s) => s.setSelected)
  const modulos = useModulos(cursoId).data ?? []

  switch (selected.tipo) {
    case "curso":
      return (
        <CanvasCurso
          curso={curso}
          cursoId={cursoId}
          onSelectArea={(cursoAreaId) => setSelected({ tipo: "area", cursoAreaId })}
        />
      )
    case "area":
      return renderArea(curso, cursoId, modulos, selected, setSelected)
    case "modulo":
      return renderModulo(curso, cursoId, modulos, seccionesPorModulo, selected, setSelected)
    case "seccion":
    case "bloque":
      return renderSeccion(cursoId, seccionesPorModulo, selected, setSelected)
    case "transversal":
      return <CanvasTransversal curso={curso} cursoId={cursoId} />
    case "entrevista":
      return <CanvasEntrevista curso={curso} cursoId={cursoId} />
    default: {
      const _exhaustive: never = selected
      return _exhaustive
    }
  }
}

function renderArea(
  curso: CursoDetalle,
  cursoId: string,
  modulos: ModuloListAdminResponse,
  selected: Extract<SelectedNode, { tipo: "area" }>,
  setSelected: (node: SelectedNode) => void,
) {
  const cursoArea = curso.cursoAreas.find((a) => a.id === selected.cursoAreaId)
  if (!cursoArea) {
    return <CanvasFallback message="Área no encontrada" />
  }
  return (
    <CanvasArea
      cursoId={cursoId}
      cursoArea={cursoArea}
      modulos={modulos}
      onSelectModulo={(moduloId) => setSelected({ tipo: "modulo", moduloId })}
    />
  )
}

function renderModulo(
  curso: CursoDetalle,
  cursoId: string,
  modulos: ModuloListAdminResponse,
  seccionesPorModulo: ReadonlyMap<string, SeccionListAdminResponse>,
  selected: Extract<SelectedNode, { tipo: "modulo" }>,
  setSelected: (node: SelectedNode) => void,
) {
  const modulo = modulos.find((m) => m.id === selected.moduloId)
  if (!modulo) {
    return <CanvasFallback message="Módulo no encontrado" />
  }
  return (
    <CanvasModulo
      curso={curso}
      cursoId={cursoId}
      modulo={modulo}
      secciones={seccionesPorModulo.get(modulo.id) ?? []}
      onSelectSeccion={(seccionId) =>
        setSelected({ tipo: "seccion", moduloId: modulo.id, seccionId })
      }
    />
  )
}

function renderSeccion(
  cursoId: string,
  seccionesPorModulo: ReadonlyMap<string, SeccionListAdminResponse>,
  selected: Extract<SelectedNode, { tipo: "seccion" } | { tipo: "bloque" }>,
  setSelected: (node: SelectedNode) => void,
) {
  const { moduloId, seccionId } = selected
  const seccion = (seccionesPorModulo.get(moduloId) ?? []).find((s) => s.id === seccionId)
  if (!seccion) {
    return <CanvasFallback message="Sección no encontrada" />
  }
  return (
    <CanvasSeccion
      cursoId={cursoId}
      moduloId={moduloId}
      seccion={seccion}
      selectedBloqueId={selected.tipo === "bloque" ? selected.bloqueId : null}
      onSelectBloque={(bloqueId) => setSelected({ tipo: "bloque", moduloId, seccionId, bloqueId })}
    />
  )
}

interface CanvasFallbackProps {
  readonly message: string
}

function CanvasFallback({ message }: CanvasFallbackProps) {
  return (
    <div className="flex flex-1 items-center justify-center px-10 py-10">
      <p className="rounded-[var(--radius-md)] border border-glass-border border-dashed bg-glass-1 px-6 py-8 text-center text-sm text-text-muted">
        {message}
      </p>
    </div>
  )
}
