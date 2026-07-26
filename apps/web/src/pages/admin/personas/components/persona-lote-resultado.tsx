import { Banner } from "@/shared/components/ui/banner"
import { Button } from "@/shared/components/ui/button"
import { DialogFooter } from "@/shared/components/ui/dialog"
import type { AltaColaboradoresLoteResponse, MotivoRechazoLote } from "@nexott-learn/shared-types"
import { Download } from "lucide-react"
import { construirCsvCredenciales } from "../construir-csv-credenciales"

function motivoLabel(motivo: MotivoRechazoLote): string {
  switch (motivo) {
    case "dominio_no_permitido":
      return "Dominio no permitido"
    case "duplicado_en_lote":
      return "Repetido en la lista"
    case "ya_existe":
      return "Ya existía"
    case "error_interno":
      return "Error al crear"
    default:
      return motivo
  }
}

function descargarCsv(csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement("a")
  enlace.href = url
  enlace.download = "credenciales-nuevos-colaboradores.csv"
  document.body.appendChild(enlace)
  enlace.click()
  enlace.remove()
  URL.revokeObjectURL(url)
}

interface PersonaLoteResultadoProps {
  readonly resultado: AltaColaboradoresLoteResponse
  readonly onCerrar: () => void
}

export function PersonaLoteResultado({ resultado, onCerrar }: PersonaLoteResultadoProps) {
  const { creados, rechazados, resumen } = resultado

  return (
    <div className="flex flex-col gap-4">
      <Banner
        tone={creados.length > 0 ? "success" : "warning"}
        title={`${resumen.creados} de ${resumen.total} cuentas creadas`}
      >
        {rechazados.length > 0
          ? `${resumen.rechazados} filas no se crearon (ver detalle abajo).`
          : "Todas las filas se crearon correctamente."}
      </Banner>

      {creados.length > 0 ? (
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-subtle px-4 py-3">
          <Banner tone="warning" title="Las contraseñas solo se muestran ahora">
            Descarga el archivo y entrégalo por un canal seguro. No quedará visible al cerrar; cada
            persona deberá cambiar su contraseña en el primer acceso.
          </Banner>
          <Button
            variant="primary"
            size="sm"
            type="button"
            onClick={() => descargarCsv(construirCsvCredenciales(creados))}
          >
            <Download className="h-4 w-4" aria-hidden={true} />
            Descargar credenciales (.csv)
          </Button>
        </div>
      ) : null}

      {rechazados.length > 0 ? (
        <div className="flex max-h-64 flex-col gap-1 overflow-y-auto rounded-xl border border-border px-4 py-3">
          <span className="text-caption text-text-tertiary uppercase tracking-[0.14em]">
            No creadas
          </span>
          <ul className="flex flex-col gap-1">
            {rechazados.map((fila, i) => (
              <li
                key={`${fila.email}-${fila.motivo}-${i}`}
                className="flex items-center justify-between gap-3 text-body-sm"
              >
                <span className="truncate text-text-secondary">{fila.email}</span>
                <span className="shrink-0 text-caption text-warning-on-soft">
                  {motivoLabel(fila.motivo)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <DialogFooter>
        <Button variant="primary" size="sm" type="button" onClick={onCerrar}>
          Entendido, cerrar
        </Button>
      </DialogFooter>
    </div>
  )
}
