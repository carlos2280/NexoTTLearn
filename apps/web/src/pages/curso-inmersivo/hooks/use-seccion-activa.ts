import type {
  CursoArbolResponse,
  MeAvanceCursoResponse,
  PlanResponseParticipante,
  SeccionPlanItemParticipante,
} from "@nexott-learn/shared-types"
import { useEffect, useMemo, useState } from "react"

export interface SeccionActiva {
  readonly seccionId: string
  readonly moduloId: string
  /** Posición 1-based del módulo dentro del árbol del curso. */
  readonly moduloOrden: number
  /** Título del módulo padre, para el eyebrow del canvas. */
  readonly moduloTitulo: string
  readonly titulo: string
  /** Solo presente en modo asignado (proviene del plan personal). */
  readonly caracter: SeccionPlanItemParticipante["caracter"] | null
  /** Solo true en modo asignado cuando el plan la marca como completada. */
  readonly completada: boolean
  /** Solo presente en modo asignado. */
  readonly avance: SeccionPlanItemParticipante["avance"] | null
}

interface UseSeccionActivaInput {
  /** Arbol del curso (siempre presente — fuente del indice de secciones). */
  readonly arbol: CursoArbolResponse | undefined
  /** Plan personal (solo en modo asignado — anota caracter/completada/avance). */
  readonly plan: PlanResponseParticipante | undefined
  /** Avance del curso (solo en asignado/voluntario — define la sugerencia inicial). */
  readonly avance: MeAvanceCursoResponse | undefined
}

interface UseSeccionActivaResult {
  readonly seccionActiva: SeccionActiva | null
  readonly seleccionar: (seccionId: string) => void
  readonly idsCompletadas: ReadonlySet<string>
}

/**
 * Estado interno de "qué sección está abierta en el canvas". El indice se
 * construye SIEMPRE desde el arbol del curso (TOC). El plan personal, cuando
 * llega, anota cada seccion con su `caracter`, `completada` y `avance`. Esto
 * unifica los tres modos (asignado | voluntario | preview) bajo el mismo hook.
 *
 * Default inteligente:
 *  1. `avance.siguienteSeccion` si el backend lo recomienda (D-S11-C8).
 *  2. Primera obligatoria no completada del plan (solo asignado).
 *  3. Primera sección del árbol.
 *  4. `null` si todavía no hay árbol.
 */
export function useSeccionActiva(input: UseSeccionActivaInput): UseSeccionActivaResult {
  const { arbol, plan, avance } = input
  const [seleccionada, setSeleccionada] = useState<string | null>(null)

  const indicePlan = useMemo(() => indexarPlan(plan), [plan])

  const indice = useMemo(() => {
    return indexarArbol(arbol, indicePlan)
  }, [arbol, indicePlan])

  const idDefault = useMemo(() => calcularDefault(arbol, plan, avance), [arbol, plan, avance])

  useEffect(() => {
    if (seleccionada === null) {
      if (idDefault !== null) {
        setSeleccionada(idDefault)
      }
      return
    }
    if (!indice.has(seleccionada) && idDefault !== null) {
      setSeleccionada(idDefault)
    }
  }, [seleccionada, idDefault, indice])

  const idsCompletadas = useMemo(() => {
    const set = new Set<string>()
    if (!plan) {
      return set
    }
    for (const modulo of plan.items) {
      for (const seccion of modulo.secciones) {
        if (seccion.completada) {
          set.add(seccion.seccionId)
        }
      }
    }
    return set
  }, [plan])

  const seccionActiva = seleccionada !== null ? (indice.get(seleccionada) ?? null) : null

  return {
    seccionActiva,
    seleccionar: setSeleccionada,
    idsCompletadas,
  }
}

interface AnotacionPlan {
  readonly caracter: SeccionPlanItemParticipante["caracter"]
  readonly completada: boolean
  readonly avance: SeccionPlanItemParticipante["avance"]
}

function indexarPlan(plan: PlanResponseParticipante | undefined): Map<string, AnotacionPlan> {
  const map = new Map<string, AnotacionPlan>()
  if (!plan) {
    return map
  }
  for (const modulo of plan.items) {
    for (const seccion of modulo.secciones) {
      map.set(seccion.seccionId, {
        caracter: seccion.caracter,
        completada: seccion.completada,
        avance: seccion.avance,
      })
    }
  }
  return map
}

function indexarArbol(
  arbol: CursoArbolResponse | undefined,
  anotacionPlan: ReadonlyMap<string, AnotacionPlan>,
): Map<string, SeccionActiva> {
  const map = new Map<string, SeccionActiva>()
  if (!arbol) {
    return map
  }
  for (const [indiceModulo, modulo] of arbol.modulos.entries()) {
    for (const seccion of modulo.secciones) {
      const plan = anotacionPlan.get(seccion.seccionId)
      map.set(seccion.seccionId, {
        seccionId: seccion.seccionId,
        moduloId: modulo.moduloId,
        moduloOrden: indiceModulo + 1,
        moduloTitulo: modulo.titulo,
        titulo: seccion.titulo,
        caracter: plan?.caracter ?? null,
        completada: plan?.completada ?? false,
        avance: plan?.avance ?? null,
      })
    }
  }
  return map
}

function calcularDefault(
  arbol: CursoArbolResponse | undefined,
  plan: PlanResponseParticipante | undefined,
  avance: MeAvanceCursoResponse | undefined,
): string | null {
  if (!arbol) {
    return null
  }
  const sugerencia = avance?.siguienteSeccion?.seccionId
  if (sugerencia) {
    return sugerencia
  }
  if (plan) {
    for (const modulo of plan.items) {
      const candidata = modulo.secciones.find((s) => s.caracter === "OBLIGATORIA" && !s.completada)
      if (candidata) {
        return candidata.seccionId
      }
    }
  }
  const primera = arbol.modulos[0]?.secciones[0]
  return primera?.seccionId ?? null
}
