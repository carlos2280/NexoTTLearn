import { useCurso } from "@/features/cursos/hooks/use-curso"
import { useDisponibilidadEntrevistaIa } from "@/features/entrevista-ia/hooks/use-disponibilidad-entrevista-ia"
import { useAvanceCurso } from "@/features/me/hooks/use-avance-curso"
import { useMisCursos } from "@/features/me/hooks/use-mis-cursos"
import { usePlanParticipante } from "@/features/plan-personal/hooks/use-plan-participante"
import { useDisponibilidadTransversal } from "@/features/transversal/hooks/use-disponibilidad-transversal"
import type { ApiError } from "@/shared/api/api-error"
import type {
  CursoDetalle,
  DisponibilidadEntrevistaIaResponse,
  DisponibilidadTransversalResponse,
  MeAvanceCursoResponse,
  MeCursoResumen,
  PlanResponseParticipante,
} from "@nexott-learn/shared-types"

export interface DetalleCursoVista {
  readonly cargandoBasico: boolean
  readonly errorBasico: ApiError | null
  readonly errorPlan: ApiError | null
  readonly asignacion: MeCursoResumen | null
  readonly curso: CursoDetalle | undefined
  readonly avance: MeAvanceCursoResponse | undefined
  readonly plan: PlanResponseParticipante | undefined
  readonly transversal: DisponibilidadTransversalResponse | undefined
  readonly entrevistaIa: DisponibilidadEntrevistaIaResponse | undefined
  readonly noTieneAcceso: boolean
}

/**
 * Compone las queries necesarias para la vista Plan del curso. Cuando llegue
 * un endpoint específico (p.ej. `GET /me/cursos/:cursoId/detalle`) se podrá
 * reducir a una sola query.
 *
 * Reglas de tolerancia:
 *  - El plan puede fallar y la página sigue mostrándose (cabecera + skills).
 *    `errorPlan` se expone aparte para que el contenido lo señale.
 *  - Las disponibilidades de transversal/IA SOLO se piden si el curso las
 *    tiene configuradas (transversalId/entrevistaIaId no nulos). Esto evita
 *    los 404 ruidosos del backend cuando el curso no las tiene activas.
 */
export function useCursoDetalle(cursoId: string): DetalleCursoVista {
  const misCursos = useMisCursos({ pageSize: 100 })
  const asignacion = misCursos.data?.data.find((c) => c.cursoId === cursoId) ?? null
  const asignacionId = asignacion?.asignacionId ?? null

  const curso = useCurso(cursoId)
  const avance = useAvanceCurso(cursoId)
  const plan = usePlanParticipante(asignacionId)

  const tieneTransversal = !!curso.data?.transversalId
  const tieneEntrevistaIa = !!curso.data?.entrevistaIaId
  const transversal = useDisponibilidadTransversal(tieneTransversal ? asignacionId : null)
  const entrevistaIa = useDisponibilidadEntrevistaIa(tieneEntrevistaIa ? asignacionId : null)

  const noTieneAcceso = !(misCursos.isLoading || asignacion)

  return {
    cargandoBasico: misCursos.isLoading || curso.isLoading || avance.isLoading,
    errorBasico: curso.error ?? avance.error ?? null,
    errorPlan: plan.error ?? null,
    asignacion,
    curso: curso.data,
    avance: avance.data,
    plan: plan.data,
    transversal: transversal.data,
    entrevistaIa: entrevistaIa.data,
    noTieneAcceso,
  }
}
