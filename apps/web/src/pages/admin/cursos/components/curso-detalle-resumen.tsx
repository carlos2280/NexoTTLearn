import { Banner } from "@/shared/components/ui/banner"
import { Skeleton } from "@/shared/components/ui/skeleton"
import type { CursoDetalle } from "@nexott-learn/shared-types"
import { useResumenCurso } from "../hooks/use-resumen-curso"
import { CursoResumenDistribucion } from "./curso-resumen-distribucion"
import { CursoResumenKpis } from "./curso-resumen-kpis"
import { CursoResumenUltimas } from "./curso-resumen-ultimas"

interface CursoDetalleResumenProps {
  readonly curso: CursoDetalle
}

export function CursoDetalleResumen({ curso }: CursoDetalleResumenProps) {
  const { kpis, asignaciones, total, truncado, isLoading } = useResumenCurso(curso.id)

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
        <CursoResumenUltimas
          asignaciones={asignaciones}
          tieneEntregaACliente={curso.tieneEntregaACliente}
        />
      </div>
    </div>
  )
}
