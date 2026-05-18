import { cn } from "@/shared/lib/cn"
import type { IntentoEntrevistaIaAdminResponse } from "@nexott-learn/shared-types"
import { CheckCircle2, MinusCircle, ShieldAlert } from "lucide-react"

interface TarjetaVeredictoProps {
  readonly intento: IntentoEntrevistaIaAdminResponse
}

/**
 * Card principal del veredicto. Concentra la informacion que el admin
 * necesita ver primero al abrir el intento: nota global, aprobado/no y
 * — si aplica — el ajuste manual con su motivo.
 */
export function TarjetaVeredicto({ intento }: TarjetaVeredictoProps) {
  const sinVeredicto = intento.notaGlobal === null
  const notaVigente = intento.notaAjustadaAdmin ?? intento.notaGlobal
  const aprobado = intento.aprobado === true
  const fueAjustada =
    intento.notaAjustadaAdmin !== null && intento.notaAjustadaAdmin !== intento.notaGlobal

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6">
      <div className="flex items-start justify-between gap-6">
        <div className="flex flex-col gap-1">
          <span className="nx-eyebrow text-text-tertiary">Veredicto</span>
          {sinVeredicto ? (
            <p className="text-h2 text-text-tertiary">Sin calificar</p>
          ) : (
            <div className="flex items-baseline gap-2">
              <span className="tabular font-mono text-display-md text-text-primary">
                {Number(notaVigente).toFixed(1)}
              </span>
              <span className="text-body text-text-tertiary">/ 100</span>
            </div>
          )}
          <p className="text-caption text-text-tertiary">
            Umbral del curso: {intento.curso.umbralAprobacion}
          </p>
        </div>
        <BadgeAprobado sinVeredicto={sinVeredicto} aprobado={aprobado} anulado={intento.anulado} />
      </div>

      {fueAjustada ? (
        <div className="flex flex-col gap-1 rounded-xl border border-warning/30 bg-warning-soft/60 px-4 py-3">
          <span className="font-medium text-body-sm text-warning-on-soft">
            Nota ajustada por admin
          </span>
          <p className="text-caption text-warning-on-soft">
            Nota original: {Number(intento.notaGlobal).toFixed(1)}
          </p>
          {intento.motivoAjusteOAnulacion ? (
            <p className="text-body-sm text-text-secondary">
              Motivo: {intento.motivoAjusteOAnulacion}
            </p>
          ) : null}
        </div>
      ) : null}

      {intento.anulado && intento.motivoAjusteOAnulacion ? (
        <div className="flex flex-col gap-1 rounded-xl border border-danger/30 bg-danger-soft/60 px-4 py-3">
          <span className="font-medium text-body-sm text-danger-on-soft">Intento anulado</span>
          <p className="text-body-sm text-text-secondary">
            Motivo: {intento.motivoAjusteOAnulacion}
          </p>
        </div>
      ) : null}
    </section>
  )
}

interface BadgeAprobadoProps {
  readonly sinVeredicto: boolean
  readonly aprobado: boolean
  readonly anulado: boolean
}

function BadgeAprobado({ sinVeredicto, aprobado, anulado }: BadgeAprobadoProps) {
  if (anulado) {
    return <PillVeredicto icono="anulado" etiqueta="Anulado" />
  }
  if (sinVeredicto) {
    return <PillVeredicto icono="pendiente" etiqueta="Pendiente" />
  }
  return aprobado ? (
    <PillVeredicto icono="aprobado" etiqueta="Aprobado" />
  ) : (
    <PillVeredicto icono="pendiente" etiqueta="No aprobado" />
  )
}

function PillVeredicto({
  icono,
  etiqueta,
}: {
  readonly icono: "aprobado" | "pendiente" | "anulado"
  readonly etiqueta: string
}) {
  const Icon = icono === "aprobado" ? CheckCircle2 : icono === "anulado" ? ShieldAlert : MinusCircle
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-pill border px-3 py-1.5 text-body-sm",
        icono === "aprobado" ? "border-success/30 bg-success-soft text-success-on-soft" : "",
        icono === "anulado" ? "border-danger/30 bg-danger-soft text-danger-on-soft" : "",
        icono === "pendiente" ? "border-border bg-subtle text-text-secondary" : "",
      )}
    >
      <Icon className="h-4 w-4" aria-hidden={true} />
      {etiqueta}
    </span>
  )
}
