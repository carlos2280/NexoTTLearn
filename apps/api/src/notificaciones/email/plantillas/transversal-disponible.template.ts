import { TransversalDisponiblePayload } from "../../payload/transversal-disponible.payload"
import { PlantillaContexto, PlantillaResultado } from "./plan-recalculado.template"

/**
 * Plantilla `TRANSVERSAL_DISPONIBLE` (D-S11.5-A3, D42, §19.3).
 *
 * Tipo silenciable — el HTML incluye pie con link a /preferencias-notificaciones
 * para que el colaborador pueda silenciar el tipo si lo desea (§19.3 punto 1).
 * Se emite cuando el colaborador inicia el primer intento de proyecto
 * transversal en una asignacion.
 */
export function construirTransversalDisponible(
  payload: TransversalDisponiblePayload,
  contexto: PlantillaContexto,
): PlantillaResultado {
  const cursoTitulo = sanitizarTexto(payload.cursoTitulo)
  const subject = `Proyecto transversal disponible: "${cursoTitulo}"`
  const verBandejaUrl = `${contexto.appBaseUrl}/bandeja`
  const preferenciasUrl = `${contexto.appBaseUrl}/preferencias-notificaciones`

  const html = `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:0;background-color:#f4f5f7;font-family:Arial,sans-serif;color:#1f2933;">
    <table role="presentation" align="center" cellspacing="0" cellpadding="0" width="600" style="max-width:600px;width:100%;background-color:#ffffff;border-collapse:collapse;">
      <tr>
        <td style="padding:24px 32px;border-bottom:1px solid #e5e7eb;font-size:18px;font-weight:bold;color:#111827;">
          NexoTT Learn
        </td>
      </tr>
      <tr>
        <td style="padding:24px 32px;font-size:16px;line-height:24px;">
          <p style="margin:0 0 16px 0;">Hola,</p>
          <p style="margin:0 0 16px 0;">El proyecto transversal del curso "${escapeHtml(cursoTitulo)}" ya esta disponible para que empieces.</p>
          <p style="margin:24px 0;text-align:center;">
            <a href="${escapeHtml(verBandejaUrl)}" style="display:inline-block;padding:12px 24px;background-color:#2563eb;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;">Ir a mi bandeja</a>
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 32px;border-top:1px solid #e5e7eb;font-size:12px;line-height:18px;color:#6b7280;">
          Puedes silenciar este tipo de notificacion en tus preferencias: <a href="${escapeHtml(preferenciasUrl)}" style="color:#2563eb;">${escapeHtml(preferenciasUrl)}</a>.
        </td>
      </tr>
    </table>
  </body>
</html>`

  const text = [
    "Hola,",
    "",
    `El proyecto transversal del curso "${cursoTitulo}" ya esta disponible para que empieces.`,
    "",
    `Ir a mi bandeja: ${verBandejaUrl}`,
    "",
    `Puedes silenciar este tipo de notificacion en tus preferencias: ${preferenciasUrl}`,
  ].join("\n")

  return { subject, html, text }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function sanitizarTexto(value: string): string {
  return value.trim().slice(0, 200)
}
