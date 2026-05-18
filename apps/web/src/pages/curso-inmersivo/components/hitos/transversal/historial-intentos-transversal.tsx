import { tiempoRelativo } from "@/shared/lib/tiempo-relativo"
import type { IntentoTransversalParticipanteResponse } from "@nexott-learn/shared-types"
import { ExternalLink } from "lucide-react"

const RGX_HTTPS_PREFIJO = /^https:\/\//

interface HistorialIntentosTransversalProps {
  readonly intentos: readonly IntentoTransversalParticipanteResponse[]
}

/**
 * Vista 4 del transversal (spec 05) — historial cronologico de intentos.
 * Solo se renderiza cuando hay >1 intento. Lenguaje narrativo en pasado,
 * cero numeros: cada intento muestra "Aprobado" o "Aun no" cualitativo.
 *
 * "El mejor cuenta" aparece como microcopy en el intento aprobado mas
 * reciente (regla del manifiesto: el sistema reconoce el camino, no
 * castiga los pasos previos).
 */
export function HistorialIntentosTransversal({ intentos }: HistorialIntentosTransversalProps) {
  if (intentos.length <= 1) {
    return null
  }
  const indiceMejor = intentos.findIndex((i) => i.aprobado === true)
  return (
    <section className="flex flex-col gap-4">
      <h3 className="nx-eyebrow text-text-tertiary">Historial de intentos</h3>
      <ol className="flex flex-col gap-3">
        {intentos.map((intento, idx) => (
          <li key={intento.intentoId}>
            <FilaIntento
              intento={intento}
              esMejor={idx === indiceMejor}
              numero={intentos.length - idx}
            />
          </li>
        ))}
      </ol>
    </section>
  )
}

interface FilaIntentoProps {
  readonly intento: IntentoTransversalParticipanteResponse
  readonly esMejor: boolean
  readonly numero: number
}

function FilaIntento({ intento, esMejor, numero }: FilaIntentoProps) {
  const etiqueta = etiquetaIntento(intento)
  const colorEtiqueta = colorEtiquetaIntento(intento)
  return (
    <article className="flex items-start gap-4 rounded-xl border border-border bg-surface px-4 py-3">
      <span className="mt-1 font-mono text-caption text-text-tertiary">v{numero}</span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-baseline gap-2">
          <span className={`font-medium text-body-sm ${colorEtiqueta}`}>{etiqueta}</span>
          {esMejor ? (
            <span className="text-caption text-text-tertiary">· el mejor cuenta</span>
          ) : null}
        </div>
        <a
          href={intento.repoOArtefacto.url}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex w-fit items-center gap-1.5 truncate font-mono text-accent text-caption hover:underline"
        >
          {intento.repoOArtefacto.url.replace(RGX_HTTPS_PREFIJO, "")}
          <ExternalLink className="h-3 w-3 shrink-0" aria-hidden={true} />
        </a>
      </div>
      <span className="shrink-0 text-caption text-text-tertiary">
        {tiempoRelativo(intento.fecha)}
      </span>
    </article>
  )
}

function etiquetaIntento(intento: IntentoTransversalParticipanteResponse): string {
  if (intento.estado === "EN_EVALUACION") {
    return "En evaluacion"
  }
  if (intento.aprobado === true) {
    return "Aprobado"
  }
  return "Aun no"
}

function colorEtiquetaIntento(intento: IntentoTransversalParticipanteResponse): string {
  if (intento.aprobado === true) {
    return "text-state-solido-on-soft"
  }
  return "text-text-secondary"
}
