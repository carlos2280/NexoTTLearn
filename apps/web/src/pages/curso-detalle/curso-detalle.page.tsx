import { RUTAS } from "@/shared/constants/rutas"
import { Navigate, useParams } from "react-router-dom"
import { CursoDetalleContenido } from "./components/curso-detalle-contenido"
import { CursoDetalleSkeleton } from "./components/curso-detalle-skeleton"
import { useCursoDetalle } from "./hooks/use-curso-detalle"

export function CursoDetallePage() {
  const { cursoId } = useParams<{ cursoId: string }>()
  const detalle = useCursoDetalle(cursoId ?? "")

  if (!cursoId) {
    return <Navigate to={RUTAS.participante.misCursos} replace={true} />
  }
  if (detalle.cargandoBasico) {
    return <CursoDetalleSkeleton />
  }
  if (detalle.noTieneAcceso) {
    return (
      <div className="rounded-md border border-danger/30 bg-danger-soft p-4 text-body-sm text-danger-on-soft">
        No tienes acceso a este curso o no existe en tus asignaciones.
      </div>
    )
  }
  if (detalle.errorBasico || !detalle.curso || !detalle.asignacion || !detalle.avance) {
    return (
      <div className="rounded-md border border-danger/30 bg-danger-soft p-4 text-body-sm text-danger-on-soft">
        No pudimos cargar este curso. Reintenta en un momento.
      </div>
    )
  }

  return (
    <CursoDetalleContenido
      curso={detalle.curso}
      asignacion={detalle.asignacion}
      avance={detalle.avance}
      plan={detalle.plan}
      transversal={detalle.transversal}
      entrevistaIa={detalle.entrevistaIa}
    />
  )
}
