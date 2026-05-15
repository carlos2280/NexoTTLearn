import { AsignacionesVista } from "@/pages/admin/asignaciones/components/asignaciones-vista"
import type { CursoConfiguracionResponse, CursoDetalle } from "@nexott-learn/shared-types"
import { ConfigCursoTab } from "./config/config-curso-tab"
import { CursoDetalleResumen } from "./curso-detalle-resumen"

export type TabDetalle = "resumen" | "asignados" | "configuracion"

interface CursoDetallePanelProps {
  readonly tab: TabDetalle
  readonly curso: CursoDetalle & Partial<Pick<CursoConfiguracionResponse, "umbralesLogro">>
}

export function CursoDetallePanel({ tab, curso }: CursoDetallePanelProps) {
  if (tab === "resumen") {
    return <CursoDetalleResumen curso={curso} />
  }
  if (tab === "asignados") {
    return <AsignacionesVista cursoId={curso.id} nombreCurso={curso.titulo} />
  }
  return <ConfigCursoTab curso={curso} />
}
