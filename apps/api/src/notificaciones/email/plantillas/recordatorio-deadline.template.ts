import { RecordatorioDeadlinePayload } from "../../payload/recordatorio-deadline.payload"
import { PlantillaContexto, PlantillaResultado } from "./plan-recalculado.template"

/**
 * Plantilla `RECORDATORIO_DEADLINE` (D-S11.5-C1, §19.2/§19.3).
 *
 * No critico — silenciable. El HTML incluye pie con link a
 * /preferencias-notificaciones. Funcion pura: recibe `appBaseUrl` por contexto
 * y nunca lee `process.env`. Discriminada por `diasRestantes` (7 | 1) para
 * elegir el tono del copy (recordatorio anticipado vs urgencia inminente).
 */
export function construirRecordatorioDeadline(
  payload: RecordatorioDeadlinePayload,
  contexto: PlantillaContexto,
): PlantillaResultado {
  const cursoTitulo = sanitizarTexto(payload.cursoTitulo)
  const fechaDeadline = sanitizarTexto(payload.fechaDeadline)
  const ventana =
    payload.diasRestantes === 1 ? "manana" : `en ${payload.diasRestantes.toString()} dias`
  const subject =
    payload.diasRestantes === 1
      ? `Recordatorio: tu curso "${cursoTitulo}" vence manana`
      : `Recordatorio: tu curso "${cursoTitulo}" vence en 7 dias`
  const verPlanUrl = `${contexto.appBaseUrl}/plan`
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
          <p style="margin:0 0 16px 0;">tu curso "${escapeHtml(cursoTitulo)}" vence ${escapeHtml(ventana)} (${escapeHtml(fechaDeadline)}). Revisa tu plan personal para llegar a tiempo.</p>
          <p style="margin:24px 0;text-align:center;">
            <a href="${escapeHtml(verPlanUrl)}" style="display:inline-block;padding:12px 24px;background-color:#2563eb;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;">Ver mi plan</a>
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
    `Tu curso "${cursoTitulo}" vence ${ventana} (${fechaDeadline}). Revisa tu plan personal para llegar a tiempo.`,
    "",
    `Ver mi plan: ${verPlanUrl}`,
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
