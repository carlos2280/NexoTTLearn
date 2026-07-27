import { AsignacionesVista } from "@/pages/admin/asignaciones/components/asignaciones-vista"
import type { CursoConfiguracionResponse, CursoDetalle } from "@nexott-learn/shared-types"
import { ConfigCursoTab } from "./config/config-curso-tab"
import { CursoDetalleResumen } from "./curso-detalle-resumen"
import { PanelEvaluaciones } from "./panel-evaluaciones/panel-evaluaciones"
import { PanelRetos } from "./panel-retos/panel-retos"

export type TabDetalle = "resumen" | "asignados" | "evaluaciones" | "retos" | "configuracion"

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
  if (tab === "retos") {
    // `key` por curso: la ruta es la misma (`/admin/cursos/:cursoId`), así que
    // navegar a otro curso (p. ej. al duplicar) NO desmonta el panel y una
    // corrida en marcha dejaría la pantalla del curso nuevo con los botones
    // bloqueados y una barra de progreso ajena.
    return <PanelRetos key={curso.id} cursoId={curso.id} cursoTitulo={curso.titulo} />
  }
  return <ConfigCursoTab curso={curso} />
}
