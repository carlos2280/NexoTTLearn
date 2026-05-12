import { AsignacionesVista } from "@/pages/admin/asignaciones/components/asignaciones-vista"
import { Banner } from "@/shared/components/ui/banner"
import type { CursoConfiguracionResponse, CursoDetalle } from "@nexott-learn/shared-types"
import { ConfigCursoTab } from "./config/config-curso-tab"
import { CursoDetalleResumen } from "./curso-detalle-resumen"

export type TabDetalle = "resumen" | "asignados" | "estructura" | "configuracion"

interface CursoDetallePanelProps {
  readonly tab: TabDetalle
  readonly curso: CursoDetalle & Partial<Pick<CursoConfiguracionResponse, "umbralesLogro">>
  readonly nombreCliente: string | undefined
}

export function CursoDetallePanel({ tab, curso, nombreCliente }: CursoDetallePanelProps) {
  if (tab === "resumen") {
    return <CursoDetalleResumen curso={curso} nombreCliente={nombreCliente} />
  }
  if (tab === "asignados") {
    return <AsignacionesVista cursoId={curso.id} />
  }
  if (tab === "estructura") {
    return (
      <Banner tone="neutral" title="Próximamente">
        La estructura del curso (módulos / secciones / bloques) se podrá editar cuando se libere el
        módulo de contenido.
      </Banner>
    )
  }
  return <ConfigCursoTab curso={curso} />
}
