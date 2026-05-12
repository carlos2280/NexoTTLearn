import { Banner } from "@/shared/components/ui/banner"
import { Card } from "@/shared/components/ui/card"
import { Skeleton } from "@/shared/components/ui/skeleton"
import type { CursoDetalle } from "@nexott-learn/shared-types"
import { useResumenCurso } from "../hooks/use-resumen-curso"
import { CursoResumenDistribucion } from "./curso-resumen-distribucion"
import { CursoResumenKpis } from "./curso-resumen-kpis"
import { CursoResumenUltimas } from "./curso-resumen-ultimas"

interface CursoDetalleResumenProps {
  readonly curso: CursoDetalle
  readonly nombreCliente: string | undefined
}

function formatearFecha(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

interface FilaDato {
  readonly etiqueta: string
  readonly valor: string
}

function fichaDatos(curso: CursoDetalle, nombreCliente: string | undefined): readonly FilaDato[] {
  return [
    { etiqueta: "Cliente", valor: nombreCliente ?? curso.clienteId },
    { etiqueta: "Fecha de inicio", valor: formatearFecha(curso.fechaInicio) },
    { etiqueta: "Deadline", valor: formatearFecha(curso.fechaDeadline) },
    { etiqueta: "Voluntarios habilitados", valor: curso.toggleVoluntarios ? "Sí" : "No" },
    { etiqueta: "Cierre automático", valor: curso.toggleCierreAutomatico ? "Sí" : "No" },
    { etiqueta: "Umbral No cumple", valor: `${curso.umbralNoCumple}%` },
    {
      etiqueta: "Pesos (bloques / transversal / entrevista)",
      valor: `${curso.pesoBloques}% / ${curso.pesoTransversal}% / ${curso.pesoEntrevista}%`,
    },
    { etiqueta: "Desbloqueo", valor: curso.desbloqueo },
  ]
}

export function CursoDetalleResumen({ curso, nombreCliente }: CursoDetalleResumenProps) {
  const { kpis, asignaciones, total, truncado, isLoading } = useResumenCurso(curso.id)
  const datos = fichaDatos(curso, nombreCliente)

  return (
    <div className="flex flex-col gap-6">
      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ) : (
        <CursoResumenKpis kpis={kpis} />
      )}

      {truncado ? (
        <Banner tone="warning" title="Vista parcial">
          Se están mostrando los KPIs de las primeras 100 asignaciones de un total de {total}. La
          tab Asignados muestra el listado completo paginado.
        </Banner>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CursoResumenDistribucion kpis={kpis} />
        <CursoResumenUltimas asignaciones={asignaciones} />
      </div>

      <Card tono="plano" className="flex flex-col gap-4">
        <h3 className="text-h3 text-text-primary">Ficha del curso</h3>
        <div className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
          {datos.map((d) => (
            <div key={d.etiqueta} className="flex flex-col">
              <span className="text-caption text-text-tertiary uppercase tracking-wide">
                {d.etiqueta}
              </span>
              <span className="text-body-sm text-text-primary">{d.valor}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
