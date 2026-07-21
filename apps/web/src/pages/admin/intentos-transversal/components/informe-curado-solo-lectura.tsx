import { sanitizarHtml } from "@/shared/lib/sanitize-html"
import type { PuntoAReforzar } from "@nexott-learn/shared-types"

interface InformeCuradoSoloLecturaProps {
  readonly resumen?: string
  readonly aReforzar?: readonly PuntoAReforzar[]
  readonly fechaValidacion: string | null
}

/**
 * Vista SOLO-LECTURA del informe curado ya persistido (estados no editables:
 * FINALIZADO/ANULADO/…). Renderiza desde el `reporteFinal` guardado, nunca del
 * buffer de edición, para no mostrar texto tecleado sin guardar como si fuese
 * lo publicado.
 */
export function InformeCuradoSoloLectura({
  resumen,
  aReforzar,
  fechaValidacion,
}: InformeCuradoSoloLecturaProps) {
  const nota = fechaValidacion
    ? `Publicado al participante el ${new Date(fechaValidacion).toLocaleDateString("es-CL")}.`
    : "El informe solo se edita mientras el intento está en revisión."
  const areas = aReforzar ?? []
  const vacio = !resumen && areas.length === 0
  return (
    <div className="flex flex-col gap-4">
      <p className="text-body-sm text-text-secondary">{nota}</p>
      {resumen ? (
        <div className="flex flex-col gap-1">
          <span className="nx-eyebrow text-text-tertiary">Resumen</span>
          <div
            className="tiptap text-body-sm text-text-secondary"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: informe curado por el admin, sanitizado.
            dangerouslySetInnerHTML={{ __html: sanitizarHtml(resumen) }}
          />
        </div>
      ) : null}
      {areas.length > 0 ? (
        <div className="flex flex-col gap-2">
          <span className="nx-eyebrow text-text-tertiary">Áreas a reforzar</span>
          <ul className="flex flex-col gap-2">
            {areas.map((r, i) => (
              <li key={`${i}-${r.que}`} className="flex flex-col">
                <span className="text-body-sm text-text-primary">{r.que}</span>
                <span className="text-caption text-text-secondary">{r.sugerencia}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {vacio ? (
        <p className="text-body-sm text-text-secondary">
          No se curó un informe para el participante.
        </p>
      ) : null}
    </div>
  )
}
