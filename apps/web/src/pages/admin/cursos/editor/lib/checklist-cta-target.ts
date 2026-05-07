import type { ChecklistCtaTarget, ModuloListAdminResponse } from "@nexott-learn/shared-types"
import type { SelectedNode } from "../use-editor-store"

interface ResolveArgs {
  readonly target: ChecklistCtaTarget
  readonly modulos: ModuloListAdminResponse | undefined
  readonly seccionesPorModulo: ReadonlyMap<string, ReadonlyArray<{ readonly id: string }>>
}

// Mapea cada CTA target del checklist al nodo del editor que el admin debe
// editar. Los targets a nivel curso siempre llevan al nodo raiz (el inspector
// del curso ya despliega cada subseccion editable). Modulo y seccion saltan
// al nodo concreto. Si el seccionId no encuentra modulo, fallback a curso.
export function resolveChecklistCtaTarget({
  target,
  modulos,
  seccionesPorModulo,
}: ResolveArgs): SelectedNode {
  if (typeof target === "string") {
    return { tipo: "curso" }
  }
  if (target.tipo === "modulo") {
    return { tipo: "modulo", moduloId: target.moduloId }
  }
  if (target.tipo === "seccion") {
    const moduloId = findModuloIdForSeccion({ seccionId: target.seccionId, seccionesPorModulo })
    if (moduloId) {
      return { tipo: "seccion", moduloId, seccionId: target.seccionId }
    }
    if (modulos && modulos.length > 0 && modulos[0]) {
      return { tipo: "modulo", moduloId: modulos[0].id }
    }
    return { tipo: "curso" }
  }
  const _exhaustive: never = target
  return _exhaustive
}

function findModuloIdForSeccion({
  seccionId,
  seccionesPorModulo,
}: {
  readonly seccionId: string
  readonly seccionesPorModulo: ReadonlyMap<string, ReadonlyArray<{ readonly id: string }>>
}): string | null {
  for (const [moduloId, secciones] of seccionesPorModulo) {
    if (secciones.some((s) => s.id === seccionId)) {
      return moduloId
    }
  }
  return null
}
