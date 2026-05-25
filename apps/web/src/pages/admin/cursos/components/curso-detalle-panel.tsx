import { AsignacionesVista } from "@/pages/admin/asignaciones/components/asignaciones-vista"
import type { CursoConfiguracionResponse, CursoDetalle } from "@nexott-learn/shared-types"
import { ConfigCursoTab } from "./config/config-curso-tab"
import { CursoDetalleResumen } from "./curso-detalle-resumen"
import { PanelEvaluaciones } from "./panel-evaluaciones/panel-evaluaciones"

export type TabDetalle = "resumen" | "asignados" | "evaluaciones" | "configuracion"

interface CursoDetallePanelProps {
  readonly tab: TabDetalle
  readonly curso: CursoDetalle & Partial<Pick<CursoConfiguracionResponse, "umbralesLogro">>
}

export function CursoDetallePanel({ tab, curso }: CursoDetallePanelProps) {
  if (tab === "resumen") {
    return <CursoDetalleResumen curso={curso} />
  }
  if (tab === "asignados") {
    return (
      <AsignacionesVista
        cursoId={curso.id}
        nombreCurso={curso.titulo}
        tieneEntregaACliente={curso.tieneEntregaACliente}
      />
    )
  }
  if (tab === "evaluaciones") {
    return <PanelEvaluaciones cursoId={curso.id} />
  }
  return <ConfigCursoTab curso={curso} />
}
