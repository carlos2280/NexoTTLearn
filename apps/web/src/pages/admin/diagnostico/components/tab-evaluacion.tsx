import { Button } from "@/shared/ui/primitives/button"
import { Tooltip } from "@/shared/ui/primitives/tooltip"
import type { MatrizDiagnosticoArea, MatrizDiagnosticoFila } from "@nexott-learn/shared-types"
import { Download, Upload } from "lucide-react"
import { MatrizEvaluacion } from "./matriz-evaluacion"

interface TabEvaluacionProps {
  readonly areas: readonly MatrizDiagnosticoArea[]
  readonly filas: readonly MatrizDiagnosticoFila[]
  readonly cargando?: boolean
  readonly onCeldaClick?: (inscripcionId: string, areaId: string) => void
}

export function TabEvaluacion({ areas, filas, cargando, onCeldaClick }: TabEvaluacionProps) {
  const totalCeldas = filas.length * areas.length
  const capturadas = filas.reduce((acc, f) => acc + f.cobertura.capturadas, 0)
  const candidatosCompletos = filas.filter(
    (f) => f.cobertura.capturadas === f.cobertura.total,
  ).length

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-0.5">
          <h2 className="font-semibold text-base text-text-primary">Captura evaluación inicial</h2>
          <p className="text-text-muted text-xs">
            {candidatosCompletos} / {filas.length} candidatos con datos completos · {capturadas} /{" "}
            {totalCeldas} celdas capturadas.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Tooltip content="Disponible próximamente · pendiente endpoint de plantilla">
            <span>
              <Button variant="secondary" size="sm" disabled={true}>
                <Download className="size-4" aria-hidden="true" />
                Plantilla
              </Button>
            </span>
          </Tooltip>
          <Tooltip content="Disponible próximamente · carga masiva por Excel">
            <span>
              <Button size="sm" disabled={true}>
                <Upload className="size-4" aria-hidden="true" />
                Subir Excel
              </Button>
            </span>
          </Tooltip>
        </div>
      </header>

      <BannerExcelOpcional vacia={!cargando && capturadas === 0 && filas.length > 0} />

      {cargando && filas.length === 0 ? (
        <div className="h-64 animate-pulse rounded-[var(--radius-xl)] border border-glass-border bg-glass-1" />
      ) : (
        <MatrizEvaluacion areas={areas} filas={filas} onCeldaClick={onCeldaClick} />
      )}
    </div>
  )
}

function BannerExcelOpcional({ vacia }: { readonly vacia: boolean }) {
  if (!vacia) {
    return null
  }
  return (
    <div className="flex flex-col gap-1 rounded-[var(--radius-md)] border border-glass-border bg-glass-1 px-4 py-3">
      <span className="font-medium text-sm text-text-primary">¿Tienes los puntajes en Excel?</span>
      <span className="text-text-muted text-xs">
        El flujo de carga masiva estará disponible cuando se habilite el endpoint. Mientras tanto
        puedes capturar manualmente celda por celda haciendo clic en cada una.
      </span>
    </div>
  )
}
