import { useEficaciaPlataforma } from "@/features/reportes/hooks/use-eficacia-plataforma"
import { GridReportesDetallados } from "./cockpit/components/grid-reportes-detallados"
import { KpiStrip } from "./cockpit/components/kpi-strip"
import { SeccionCoberturaAreas } from "./cockpit/components/seccion-cobertura-areas"
import { SeccionRutaColaborador } from "./cockpit/components/seccion-ruta-colaborador"

/**
 * Executive Cockpit de Reportes — vista global del talento NTT.
 *
 * Bloques jerárquicos:
 *   1. KPI strip — eficacia de la plataforma (aptos, presentados, aceptados)
 *   2. Ruta del colaborador — funnel end-to-end
 *   3. Cobertura por área — el mapa real del talento agregado (sin curso)
 *   4. Reportes detallados — drill-down a las 7 sub-páginas
 *
 * El cockpit por curso (radar dual + heatmap colaborador × skill) vive en
 * `/admin/reportes/cobertura-curso` como drill-down accesible desde el grid.
 */
export function ReportesPage() {
  const eficaciaQuery = useEficaciaPlataforma()

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-12">
      <header className="flex flex-col gap-2">
        <span className="nx-eyebrow text-aurora-violet">Reportes · Vista ejecutiva</span>
        <h1 className="text-h1 text-text-primary">
          Cockpit<span className="text-aurora-violet">.</span>
        </h1>
        <p className="max-w-[640px] text-body-sm text-text-secondary">
          El estado real del talento NTT: qué pasa hoy en la plataforma, cómo es la ruta end-to-end
          del colaborador y dónde están las brechas por capacidad.
        </p>
      </header>

      <KpiStrip data={eficaciaQuery.data} isLoading={eficaciaQuery.isLoading} />

      <SeccionRutaColaborador data={eficaciaQuery.data} isLoading={eficaciaQuery.isLoading} />

      <SeccionCoberturaAreas />

      <GridReportesDetallados />
    </div>
  )
}
