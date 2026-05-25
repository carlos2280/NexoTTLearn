import { Banner } from "@/shared/components/ui/banner"
import { Button } from "@/shared/components/ui/button"
import type { PreviewResponse } from "@nexott-learn/shared-types"
import { useAplicarPreview, useDescartarPreview } from "../hooks/use-mutaciones-evaluacion"

interface FlujoPasoPreviewProps {
  readonly cursoId: string
  readonly preview: PreviewResponse
  readonly onAplicado: (info: { readonly skillsActualizadas: number }) => void
  readonly onDescartado: () => void
}

function expiraEnMinutos(iso: string): number {
  const diffMs = new Date(iso).getTime() - Date.now()
  return Math.max(0, Math.round(diffMs / 60_000))
}

export function FlujoPasoPreview({
  cursoId,
  preview,
  onAplicado,
  onDescartado,
}: FlujoPasoPreviewProps) {
  const aplicar = useAplicarPreview()
  const descartar = useDescartarPreview()
  const { resumen, rechazos, cambios } = preview
  const minutosRestantes = expiraEnMinutos(preview.expiraEn)

  async function manejarAplicar(): Promise<void> {
    const key = crypto.randomUUID()
    try {
      const res = await aplicar.mutateAsync({
        cursoId,
        previewId: preview.previewId,
        body: { recalcularPlanes: false },
        idempotencyKey: key,
      })
      onAplicado({ skillsActualizadas: res.skillsActualizadas })
    } catch {
      // queda en aplicar.error
    }
  }

  async function manejarDescartar(): Promise<void> {
    try {
      await descartar.mutateAsync({ cursoId, previewId: preview.previewId })
      onDescartado()
    } catch {
      // queda en descartar.error
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-caption text-text-tertiary">
        Origen: Excel · Caduca en {minutosRestantes} min
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Resumen etiqueta="Filas válidas" valor={resumen.filasValidas} />
        <Resumen etiqueta="Filas rechazadas" valor={resumen.filasRechazadas} />
        <Resumen etiqueta="Personas afectadas" valor={resumen.colaboradoresAfectados} />
        <Resumen etiqueta="Skills afectadas" valor={resumen.skillsAfectadas} />
      </div>

      {rechazos.length > 0 ? (
        <Banner tone="warning" title={`${rechazos.length} fila(s) rechazadas`}>
          Revisa el detalle. Puedes aplicar las filas válidas y volver a subir el resto.
        </Banner>
      ) : null}

      {cambios.length > 0 ? (
        <div className="flex max-h-72 flex-col overflow-auto rounded-md border border-border">
          <table className="w-full text-body-sm">
            <thead className="sticky top-0 bg-subtle/80 text-caption text-text-tertiary uppercase">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Persona</th>
                <th className="px-3 py-2 text-left font-medium">Skill</th>
                <th className="tabular px-3 py-2 text-right font-medium">Antes</th>
                <th className="tabular px-3 py-2 text-right font-medium">Nuevo</th>
              </tr>
            </thead>
            <tbody>
              {cambios.slice(0, 200).map((c) => (
                <tr
                  key={`${c.colaboradorId}-${c.skillId}`}
                  className="border-border border-t last:border-b"
                >
                  <td className="px-3 py-2 text-text-primary">{c.nombreColaborador}</td>
                  <td className="px-3 py-2 text-text-secondary">{c.etiquetaSkill}</td>
                  <td className="tabular px-3 py-2 text-right text-text-tertiary">
                    {c.valorAnterior ?? "—"}
                  </td>
                  <td className="tabular px-3 py-2 text-right text-text-primary">
                    {c.valorNuevo ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {aplicar.error ? (
        <Banner tone="danger" title="No se pudo aplicar la carga">
          {aplicar.error.message}
        </Banner>
      ) : null}

      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={manejarDescartar}
          isLoading={descartar.isPending}
        >
          Descartar
        </Button>
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={manejarAplicar}
          isLoading={aplicar.isPending}
          disabled={cambios.length === 0}
        >
          Aplicar {cambios.length} cambio(s)
        </Button>
      </div>
    </div>
  )
}

function Resumen({ etiqueta, valor }: { readonly etiqueta: string; readonly valor: number }) {
  return (
    <div className="flex flex-col gap-1 rounded-md bg-subtle/50 px-3 py-2">
      <span className="text-caption text-text-tertiary uppercase tracking-wide">{etiqueta}</span>
      <span className="tabular text-h2 text-text-primary leading-none">{valor}</span>
    </div>
  )
}
