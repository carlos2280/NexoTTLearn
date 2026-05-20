import { Badge } from "@/shared/components/ui/badge"
import type { IntentoTransversalAdminResponse } from "@nexott-learn/shared-types"

interface VeredictoCardProps {
  readonly intento: IntentoTransversalAdminResponse
}

/**
 * Resumen del estado actual del intento: nota global (si ya finalizo), si fue
 * aprobado y motivo de anulacion si aplica. Para el admin es la "foto rapida"
 * de en que punto esta la evaluacion.
 */
export function VeredictoCard({ intento }: VeredictoCardProps) {
  const finalizado = intento.estado === "FINALIZADO"
  const umbral = intento.transversal.umbralAprobacion
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-6">
      <div className="flex flex-col gap-1">
        <span className="nx-eyebrow text-text-tertiary">Veredicto</span>
        <h2 className="text-h3 text-text-primary">Resultado del intento</h2>
      </div>
      <div className="flex flex-wrap items-baseline gap-4">
        <div className="flex flex-col">
          <span className="text-caption text-text-tertiary">Nota global</span>
          <span className="tabular text-display-md text-text-primary leading-tight">
            {intento.notaGlobal === null ? "—" : intento.notaGlobal}
            {intento.notaGlobal !== null ? (
              <span className="ml-1 text-body-sm text-text-tertiary">/100</span>
            ) : null}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-caption text-text-tertiary">Umbral aprobación</span>
          <span className="tabular text-body text-text-primary">{umbral}/100</span>
        </div>
        <div className="flex flex-col">
          <span className="text-caption text-text-tertiary">Aprobado</span>
          {intento.aprobado === null ? (
            <span className="text-body text-text-tertiary">Pendiente</span>
          ) : intento.aprobado ? (
            <Badge tono="success" conPunto={false}>
              Sí
            </Badge>
          ) : (
            <Badge tono="danger" conPunto={false}>
              No
            </Badge>
          )}
        </div>
      </div>
      {!finalizado && intento.estado !== "ANULADO" ? (
        <p className="text-body-sm text-text-tertiary">
          La nota global se calcula al finalizar la evaluación, ponderando las 3 capas con los pesos
          del proyecto.
        </p>
      ) : null}
      {intento.anulado && intento.motivoAnulacion ? (
        <div className="flex flex-col gap-1 rounded-md border border-danger/40 bg-danger-soft px-4 py-3">
          <span className="nx-eyebrow text-danger-on-soft">Motivo de anulación</span>
          <p className="text-body-sm text-danger-on-soft">{intento.motivoAnulacion}</p>
        </div>
      ) : null}
    </section>
  )
}
