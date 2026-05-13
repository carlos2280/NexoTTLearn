import type { ApiError } from "@/shared/api/api-error"
import { RUTAS } from "@/shared/constants/rutas"
import type {
  CursoDetalle,
  DisponibilidadEntrevistaIaResponse,
  DisponibilidadTransversalResponse,
  MeAvanceCursoResponse,
  MeCursoResumen,
  PlanResponseParticipante,
} from "@nexott-learn/shared-types"
import { useNavigate } from "react-router-dom"
import { CabeceraCurso } from "./cabecera-curso"
import { PanelSkills } from "./panel-skills"
import { SeccionPlan } from "./seccion-plan"
import { TarjetaEvaluacion } from "./tarjeta-evaluacion"

interface CursoDetalleContenidoProps {
  readonly curso: CursoDetalle
  readonly asignacion: MeCursoResumen
  readonly avance: MeAvanceCursoResponse
  readonly plan: PlanResponseParticipante | undefined
  readonly errorPlan: ApiError | null
  readonly transversal: DisponibilidadTransversalResponse | undefined
  readonly entrevistaIa: DisponibilidadEntrevistaIaResponse | undefined
}

export function CursoDetalleContenido({
  curso,
  asignacion,
  avance,
  plan,
  errorPlan,
  transversal,
  entrevistaIa,
}: CursoDetalleContenidoProps) {
  const navigate = useNavigate()
  const muestraTransversal = curso.transversalId !== null
  const muestraEntrevistaIa = curso.entrevistaIaId !== null

  return (
    <div className="flex flex-col gap-6">
      <CabeceraCurso
        titulo={curso.titulo}
        asignacion={asignacion}
        porcentajeAvance={avance.porcentajeAvance}
        transversalDisponible={transversal?.disponible}
        entrevistaIaDisponible={entrevistaIa?.disponible}
        muestraTransversal={muestraTransversal}
        muestraEntrevistaIa={muestraEntrevistaIa}
      />
      <SeccionPlan plan={plan} errorPlan={errorPlan} />
      {muestraTransversal ? (
        <TarjetaEvaluacion
          titulo="Proyecto Transversal"
          descripcion="Te integra todo el curso en un ejercicio cualitativo. Tiempo estimado: 1-2 días."
          disponible={transversal?.disponible ?? false}
          mensajeBloqueo="Se desbloqueará al completar el plan obligatorio."
          textoCta="Empezar"
          onAccion={() => navigate(RUTAS.bandeja)}
        />
      ) : null}
      {muestraEntrevistaIa ? (
        <TarjetaEvaluacion
          titulo="Entrevista IA"
          descripcion="Conversación guiada con un evaluador automático para validar tu dominio de las skills del curso."
          disponible={entrevistaIa?.disponible ?? false}
          mensajeBloqueo="Se desbloqueará al aprobar el Proyecto Transversal."
          textoCta="Empezar"
          onAccion={() => navigate(RUTAS.bandeja)}
        />
      ) : null}
      <PanelSkills skills={avance.porSkill} />
    </div>
  )
}
