import { Button } from "@/shared/components/ui/button"
import { tiempoRelativo } from "@/shared/lib/tiempo-relativo"
import type {
  CupoIntentosTransversal,
  IntentoTransversalParticipanteResponse,
} from "@nexott-learn/shared-types"
import { ExternalLink, RefreshCw } from "lucide-react"
import { AvisoIntentosAgotados } from "./aviso-intentos-agotados"
import { copyIntentosRestantes, hayIntentosDisponibles } from "./cupo-transversal.helpers"
import { notaEntera, notaEnteraNoAprobado, tituloGraduado } from "./graduacion-transversal.helpers"
import { HistorialIntentosTransversal } from "./historial-intentos-transversal"
import { InformeParticipanteTransversal } from "./informe-participante-transversal"

const RGX_HTTPS_PREFIJO = /^https:\/\//

interface VistaAunNoTransversalProps {
  readonly intento: IntentoTransversalParticipanteResponse
  readonly intentos: readonly IntentoTransversalParticipanteResponse[]
  readonly cupo: CupoIntentosTransversal | null
  readonly umbral: number
  readonly onIntentarDeNuevo: () => void
}

/**
 * Vista 3b del transversal (spec 05) — no aprobado. Frente 28: ahora muestra el
 * número (decisión de producto de Carlos) con título GRADUADO según qué tan
 * cerca quedó del umbral, en vez del "Casi." fijo que mentía con notas muy
 * bajas. Sobrio, sin rojo (momento de trabajo, no castigo); la cifra se
 * distingue por tamaño/peso, no por semáforo. El CTA vuelve al brief (form de
 * envío) con la URL anterior prellenada.
 */
export function VistaAunNoTransversal({
  intento,
  intentos,
  cupo,
  umbral,
  onIntentarDeNuevo,
}: VistaAunNoTransversalProps) {
  // Con el cupo agotado el reenvío ya no procede (backend 409): mostramos el
  // aviso honesto en vez del CTA. `cupo === null` (cargando/sin dato) no bloquea.
  const agotado = cupo !== null && !hayIntentosDisponibles(cupo)
  // La nota siempre llega en FINALIZADO (el mapper la puebla); el guard cubre el
  // tipo nullable por robustez. El título gradúa desde la nota cruda.
  const nota = intento.notaGlobal
  const titulo = nota !== null ? tituloGraduado(nota, umbral) : "Aún no."

  return (
    <section className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <span className="nx-eyebrow text-text-tertiary">Hito de cierre</span>
        <h2 className="text-display-md text-text-primary leading-tight">{titulo}</h2>
        {nota !== null ? (
          <div
            className="flex items-baseline gap-2"
            role="img"
            aria-label={`Tu nota ${notaEnteraNoAprobado(nota, umbral)} de 100. Necesitas ${notaEntera(umbral)}.`}
          >
            <span className="nx-eyebrow text-text-tertiary" aria-hidden={true}>
              Tu nota
            </span>
            <span className="tabular font-semibold text-h3 text-text-primary" aria-hidden={true}>
              {notaEnteraNoAprobado(nota, umbral)}
            </span>
            <span className="tabular text-body-sm text-text-secondary" aria-hidden={true}>
              / 100
            </span>
            <span className="text-body-sm text-text-tertiary" aria-hidden={true}>
              ·
            </span>
            <span className="text-body-sm text-text-secondary" aria-hidden={true}>
              necesitas {notaEntera(umbral)}
            </span>
          </div>
        ) : null}
        <p className="text-body text-text-secondary">
          Necesita ajustes para el nivel que pide el cierre. Puedes enviar otro intento; el mejor
          cuenta.
        </p>
      </header>

      <InformeParticipanteTransversal informe={intento.informe} />

      {agotado ? (
        <AvisoIntentosAgotados />
      ) : (
        <div className="flex flex-col gap-2">
          {cupo ? (
            <p className="text-body-sm text-text-secondary">{copyIntentosRestantes(cupo)}</p>
          ) : null}
          <Button className="self-start" onClick={onIntentarDeNuevo}>
            <RefreshCw className="mr-2 h-3.5 w-3.5" aria-hidden={true} />
            Enviar otro intento
          </Button>
        </div>
      )}

      <article className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-6">
        <span className="nx-eyebrow text-text-tertiary">Tu ultimo intento</span>
        <a
          href={intento.repoOArtefacto.url}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex w-fit items-center gap-1.5 font-mono text-accent text-body-sm hover:underline"
        >
          {intento.repoOArtefacto.url.replace(RGX_HTTPS_PREFIJO, "")}
          <ExternalLink className="h-3 w-3" aria-hidden={true} />
        </a>
        <p className="text-caption text-text-tertiary">{tiempoRelativo(intento.fecha)}</p>
      </article>

      <HistorialIntentosTransversal intentos={intentos} />
    </section>
  )
}
