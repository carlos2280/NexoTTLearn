import type {
  CursoDetalle,
  ModuloListAdminResponse,
  SeccionListAdminResponse,
} from "@nexott-learn/shared-types"
import { useMemo } from "react"
import type { SelectedNode } from "../../use-editor-store"

export interface FlatTreeEntry {
  readonly key: string
  readonly label: string
  readonly path: string
  readonly node: SelectedNode
}

interface UseFlatTreeArgs {
  readonly curso: CursoDetalle
  readonly modulos: ModuloListAdminResponse | undefined
  readonly seccionesPorModulo: ReadonlyMap<string, SeccionListAdminResponse>
}

export function useFlatTree({
  curso,
  modulos,
  seccionesPorModulo,
}: UseFlatTreeArgs): readonly FlatTreeEntry[] {
  return useMemo(() => {
    const entries: FlatTreeEntry[] = [
      { key: "curso", label: curso.titulo, path: "Curso", node: { tipo: "curso" } },
      {
        key: "transversal",
        label: "Proyecto Transversal",
        path: "Curso",
        node: { tipo: "transversal" },
      },
      {
        key: "entrevista",
        label: "Entrevista IA",
        path: "Curso",
        node: { tipo: "entrevista" },
      },
    ]

    for (const area of curso.cursoAreas) {
      entries.push({
        key: `area:${area.id}`,
        label: area.area.nombre,
        path: "Área",
        node: { tipo: "area", cursoAreaId: area.id },
      })
    }

    if (modulos) {
      for (const m of modulos) {
        const areaNombre =
          curso.cursoAreas.find((a) => a.areaId === m.areaId)?.area.nombre ?? "Área"
        entries.push({
          key: `modulo:${m.id}`,
          label: m.titulo,
          path: areaNombre,
          node: { tipo: "modulo", moduloId: m.id },
        })
        const secciones = seccionesPorModulo.get(m.id) ?? []
        for (const s of secciones) {
          entries.push({
            key: `seccion:${m.id}:${s.id}`,
            label: s.titulo,
            path: `${areaNombre} · ${m.titulo}`,
            node: { tipo: "seccion", moduloId: m.id, seccionId: s.id },
          })
        }
      }
    }

    return entries
  }, [curso, modulos, seccionesPorModulo])
}
