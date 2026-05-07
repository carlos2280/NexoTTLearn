import type { TreeNode } from "@/shared/ui/patterns/immersive/types"
import type {
  CursoDetalle,
  ModuloListAdminResponse,
  SeccionListAdminResponse,
} from "@nexott-learn/shared-types"
import { BookOpen, FileText, FolderTree, Mic, Package, Target, Users } from "lucide-react"

interface BuildTreeArgs {
  readonly curso: CursoDetalle
  readonly modulos: ModuloListAdminResponse | undefined
  readonly seccionesPorModulo: ReadonlyMap<string, SeccionListAdminResponse>
}

const treeIconClass = "size-4"

function nodeId(parts: readonly string[]): string {
  return parts.join(":")
}

export const TREE_IDS = {
  curso: "curso",
  area: (cursoAreaId: string) => nodeId(["area", cursoAreaId]),
  modulo: (moduloId: string) => nodeId(["modulo", moduloId]),
  seccion: (moduloId: string, seccionId: string) => nodeId(["seccion", moduloId, seccionId]),
  transversal: "transversal",
  entrevista: "entrevista",
  candidatos: "candidatos",
} as const

/**
 * Mapa de árbol fiel al MODELO-FACIL: Curso → Área → Módulo → Sección.
 * Nodos secundarios (Transversal, Entrevista, Candidatos) cuelgan a nivel
 * raíz pero visualmente separados con un divisor en el árbol (lo maneja el
 * consumidor agrupando).
 */
export function buildCursoTree({
  curso,
  modulos,
  seccionesPorModulo,
}: BuildTreeArgs): readonly TreeNode[] {
  const modulosByArea = new Map<string, ModuloListAdminResponse>()
  if (modulos) {
    for (const m of modulos) {
      const lista = modulosByArea.get(m.areaId) ?? []
      modulosByArea.set(m.areaId, [...lista, m])
    }
  }

  const areaNodes: TreeNode[] = curso.cursoAreas.map((area) => {
    const modulosArea = modulosByArea.get(area.areaId) ?? []
    return {
      id: TREE_IDS.area(area.id),
      label: area.area.nombre,
      icon: <Target className={treeIconClass} strokeWidth={1.6} />,
      meta: <span>{`${area.peso}%`}</span>,
      accent: area.area.color,
      children: modulosArea.map((modulo) => {
        const secciones = seccionesPorModulo.get(modulo.id) ?? []
        return {
          id: TREE_IDS.modulo(modulo.id),
          label: modulo.titulo,
          icon: <Package className={treeIconClass} strokeWidth={1.6} />,
          meta: <span>{`${secciones.length}s`}</span>,
          children: secciones.map((seccion) => ({
            id: TREE_IDS.seccion(modulo.id, seccion.id),
            label: seccion.titulo,
            icon: <FileText className={treeIconClass} strokeWidth={1.6} />,
            meta: <span>{`${seccion.bloquesCount}`}</span>,
          })),
        }
      }),
    }
  })

  return [
    {
      id: TREE_IDS.curso,
      label: curso.titulo,
      icon: <BookOpen className={treeIconClass} strokeWidth={1.6} />,
      meta: <span>{`${curso.cursoAreas.length}á`}</span>,
      children: areaNodes,
    },
    {
      id: TREE_IDS.transversal,
      label: "Proyecto Transversal",
      icon: <FolderTree className={treeIconClass} strokeWidth={1.6} />,
      meta: (
        <span className={curso.proyectoTransversal.activo ? "text-success" : ""}>
          {curso.proyectoTransversal.activo ? "◉" : "─"}
        </span>
      ),
    },
    {
      id: TREE_IDS.entrevista,
      label: "Entrevista IA",
      icon: <Mic className={treeIconClass} strokeWidth={1.6} />,
      meta: (
        <span className={curso.entrevistaIAConfig.activa ? "text-success" : ""}>
          {curso.entrevistaIAConfig.activa ? "◉" : "─"}
        </span>
      ),
    },
    ...(curso.estado === "ACTIVO"
      ? [
          {
            id: TREE_IDS.candidatos,
            label: `Candidatos (${curso.contadores.inscripcionesActivas})`,
            icon: <Users className={treeIconClass} strokeWidth={1.6} />,
          } satisfies TreeNode,
        ]
      : []),
  ]
}

/** Convierte el id del árbol al SelectedNode del store. */
export function parseTreeId(
  id: string,
):
  | { tipo: "curso" }
  | { tipo: "area"; cursoAreaId: string }
  | { tipo: "modulo"; moduloId: string }
  | { tipo: "seccion"; moduloId: string; seccionId: string }
  | { tipo: "transversal" }
  | { tipo: "entrevista" }
  | { tipo: "candidatos" }
  | null {
  if (id === TREE_IDS.curso) {
    return { tipo: "curso" }
  }
  if (id === TREE_IDS.transversal) {
    return { tipo: "transversal" }
  }
  if (id === TREE_IDS.entrevista) {
    return { tipo: "entrevista" }
  }
  if (id === TREE_IDS.candidatos) {
    return { tipo: "candidatos" }
  }

  const parts = id.split(":")
  if (parts[0] === "area" && parts[1]) {
    return { tipo: "area", cursoAreaId: parts[1] }
  }
  if (parts[0] === "modulo" && parts[1]) {
    return { tipo: "modulo", moduloId: parts[1] }
  }
  if (parts[0] === "seccion" && parts[1] && parts[2]) {
    return { tipo: "seccion", moduloId: parts[1], seccionId: parts[2] }
  }
  return null
}
