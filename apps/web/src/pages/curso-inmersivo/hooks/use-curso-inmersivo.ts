import { useDisponibilidadEntrevistaIa } from "@/features/entrevista-ia/hooks/use-disponibilidad-entrevista-ia"
import { useArbolCurso } from "@/features/me/hooks/use-arbol-curso"
import { useAvanceCurso } from "@/features/me/hooks/use-avance-curso"
import { usePlanParticipante } from "@/features/plan-personal/hooks/use-plan-participante"
import { useDisponibilidadTransversal } from "@/features/transversal/hooks/use-disponibilidad-transversal"
import type { ApiError } from "@/shared/api/api-error"
import type {
  CursoArbolResponse,
  DisponibilidadEntrevistaIaResponse,
  DisponibilidadTransversalResponse,
  MeAvanceCursoResponse,
  ModoCursoParticipante,
  PlanResponseParticipante,
} from "@nexott-learn/shared-types"

/**
 * Vista que el curso inmersivo necesita en cualquiera de los tres modos
 * (asignado | voluntario | preview). El modo lo determina el backend en el
 * arbol (`GET /me/cursos/:cursoId/arbol`); el frontend solo lo lee.
 *
 * Composicion de queries segun modo:
 *  - `asignado`   → arbol + plan + avance + transversal + entrevistaIA.
 *  - `voluntario` → arbol + avance + transversal + entrevistaIA (sin plan;
 *                   D-AS-1).
 *  - `preview`    → solo arbol (no hay asignacion, no aplica nada del resto).
 */
export interface VistaCursoInmersivo {
  readonly cargandoBasico: boolean
  readonly errorBasico: ApiError | null
  readonly errorPlan: ApiError | null
  readonly noTieneAcceso: boolean
  readonly modo: ModoCursoParticipante | null
  readonly arbol: CursoArbolResponse | undefined
  readonly asignacionId: string | null
  readonly plan: PlanResponseParticipante | undefined
  readonly avance: MeAvanceCursoResponse | undefined
  readonly transversal: DisponibilidadTransversalResponse | undefined
  readonly entrevistaIa: DisponibilidadEntrevistaIaResponse | undefined
}

export function useCursoInmersivo(cursoId: string): VistaCursoInmersivo {
  const arbolQuery = useArbolCurso(cursoId)
  const arbol = arbolQuery.data
  const modo = arbol?.modo ?? null
  const asignacionId = arbol?.asignacionId ?? null

  const debePedirPlan = modo === "asignado"
  const debePedirAvance = modo === "asignado" || modo === "voluntario"
  const debePedirTransversal = debePedirAvance
  const debePedirEntrevistaIa = debePedirAvance

  const plan = usePlanParticipante(debePedirPlan ? asignacionId : null)
  const avance = useAvanceCurso(debePedirAvance ? cursoId : "")
  const transversal = useDisponibilidadTransversal(debePedirTransversal ? asignacionId : null)
  const entrevistaIa = useDisponibilidadEntrevistaIa(debePedirEntrevistaIa ? asignacionId : null)

  // 404 del arbol → el participante no tiene acceso al curso (sin asignacion y
  // sin catalogo abierto). El componente debe pintar la pantalla de fallback
  // sin gritar "error" — D-AS-9.
  const noTieneAcceso = arbolQuery.error?.status === 404
  const errorBasico = arbolQuery.error && arbolQuery.error.status !== 404 ? arbolQuery.error : null

  return {
    cargandoBasico: arbolQuery.isLoading,
    errorBasico,
    errorPlan: plan.error ?? null,
    noTieneAcceso,
    modo,
    arbol,
    asignacionId,
    plan: plan.data,
    avance: avance.data,
    transversal: transversal.data,
    entrevistaIa: entrevistaIa.data,
  }
}
