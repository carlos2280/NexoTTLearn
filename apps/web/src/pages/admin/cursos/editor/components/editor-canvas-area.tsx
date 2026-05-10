import { useModulos } from "@/features/admin-cursos/hooks/use-editor-curso"
import { type BreadcrumbItem, ImmersiveBreadcrumb } from "@/shared/ui/patterns/immersive/breadcrumb"
import type {
  CursoDetalle,
  ModuloListAdminResponse,
  SeccionListAdminResponse,
} from "@nexott-learn/shared-types"
import { FolderTree, Mic } from "lucide-react"
import type { ReactNode } from "react"
import { CanvasArea } from "../canvas/canvas-area"
import { CanvasCurso } from "../canvas/canvas-curso"
import { CanvasEntrevista } from "../canvas/canvas-entrevista"
import { CanvasModulo } from "../canvas/canvas-modulo"
import { CanvasSeccion } from "../canvas/canvas-seccion"
import { CanvasTransversal } from "../canvas/canvas-transversal"
import type { SelectedNode } from "../use-editor-store"
import { useEditorStore } from "../use-editor-store"
import { NodeTypeBadge } from "./node-type-badge"

interface EditorCanvasAreaProps {
  readonly curso: CursoDetalle
  readonly cursoId: string
  readonly seccionesPorModulo: ReadonlyMap<string, SeccionListAdminResponse>
}

export function EditorCanvasArea({ curso, cursoId, seccionesPorModulo }: EditorCanvasAreaProps) {
  const selected = useEditorStore((s) => s.selected)
  const setSelected = useEditorStore((s) => s.setSelected)
  const modulos = useModulos(cursoId).data ?? []

  const breadcrumbItems = buildBreadcrumb({
    curso,
    modulos,
    seccionesPorModulo,
    selected,
    setSelected,
  })

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ImmersiveBreadcrumb items={breadcrumbItems} />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {renderCanvasBody({
          curso,
          cursoId,
          modulos,
          seccionesPorModulo,
          selected,
          setSelected,
        })}
      </div>
    </div>
  )
}

interface RenderArgs {
  readonly curso: CursoDetalle
  readonly cursoId: string
  readonly modulos: ModuloListAdminResponse
  readonly seccionesPorModulo: ReadonlyMap<string, SeccionListAdminResponse>
  readonly selected: SelectedNode
  readonly setSelected: (node: SelectedNode) => void
}

function renderCanvasBody(args: RenderArgs): ReactNode {
  const { curso, cursoId, modulos, seccionesPorModulo, selected, setSelected } = args
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

interface BuildBreadcrumbArgs {
  readonly curso: CursoDetalle
  readonly modulos: ModuloListAdminResponse
  readonly seccionesPorModulo: ReadonlyMap<string, SeccionListAdminResponse>
  readonly selected: SelectedNode
  readonly setSelected: (node: SelectedNode) => void
}

const BADGE_CLS = "size-[14px] text-[8px]"

function makeCursoItem(args: BuildBreadcrumbArgs): BreadcrumbItem {
  return {
    id: "curso",
    label: args.curso.titulo,
    icon: <NodeTypeBadge type="curso" className={BADGE_CLS} />,
    onClick: () => args.setSelected({ tipo: "curso" }),
  }
}

function resolveLinaje(args: BuildBreadcrumbArgs): {
  readonly cursoArea: CursoDetalle["cursoAreas"][number] | null
  readonly modulo: ModuloListAdminResponse[number] | null
} {
  const { curso, modulos, selected } = args
  const moduloId =
    selected.tipo === "modulo" || selected.tipo === "seccion" || selected.tipo === "bloque"
      ? selected.moduloId
      : null
  const modulo = moduloId ? (modulos.find((m) => m.id === moduloId) ?? null) : null

  const cursoAreaId =
    selected.tipo === "area"
      ? selected.cursoAreaId
      : modulo
        ? (curso.cursoAreas.find((a) => a.areaId === modulo.areaId)?.id ?? null)
        : null
  const cursoArea = cursoAreaId
    ? (curso.cursoAreas.find((a) => a.id === cursoAreaId) ?? null)
    : null
  return { cursoArea, modulo }
}

function buildBreadcrumb(args: BuildBreadcrumbArgs): readonly BreadcrumbItem[] {
  const { selected } = args
  const cursoItem = makeCursoItem(args)

  if (selected.tipo === "curso") {
    return [cursoItem]
  }
  if (selected.tipo === "transversal") {
    return [
      cursoItem,
      {
        id: "transversal",
        label: "Proyecto Transversal",
        icon: <FolderTree className="size-3.5" strokeWidth={1.8} aria-hidden="true" />,
      },
    ]
  }
  if (selected.tipo === "entrevista") {
    return [
      cursoItem,
      {
        id: "entrevista",
        label: "Entrevista IA",
        icon: <Mic className="size-3.5" strokeWidth={1.8} aria-hidden="true" />,
      },
    ]
  }
  return buildEstructuralBreadcrumb(args, cursoItem)
}

function buildEstructuralBreadcrumb(
  args: BuildBreadcrumbArgs,
  cursoItem: BreadcrumbItem,
): readonly BreadcrumbItem[] {
  const { seccionesPorModulo, selected, setSelected } = args
  const { cursoArea, modulo } = resolveLinaje(args)
  const items: BreadcrumbItem[] = [cursoItem]

  if (cursoArea) {
    items.push({
      id: `area:${cursoArea.id}`,
      label: cursoArea.area.nombre,
      icon: <NodeTypeBadge type="area" className={BADGE_CLS} />,
      onClick:
        selected.tipo === "area"
          ? undefined
          : () => setSelected({ tipo: "area", cursoAreaId: cursoArea.id }),
    })
  }
  if (modulo) {
    items.push({
      id: `modulo:${modulo.id}`,
      label: modulo.titulo,
      icon: <NodeTypeBadge type="modulo" className={BADGE_CLS} />,
      onClick:
        selected.tipo === "modulo"
          ? undefined
          : () => setSelected({ tipo: "modulo", moduloId: modulo.id }),
    })
  }
  if (selected.tipo === "seccion" || selected.tipo === "bloque") {
    const seccion = (seccionesPorModulo.get(selected.moduloId) ?? []).find(
      (s) => s.id === selected.seccionId,
    )
    if (seccion) {
      items.push({
        id: `seccion:${seccion.id}`,
        label: seccion.titulo,
        icon: <NodeTypeBadge type="seccion" className={BADGE_CLS} />,
      })
    }
  }
  return items
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
