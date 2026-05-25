import { CasoReabiertoPayload } from "../../payload/caso-reabierto.payload"
import { PlantillaContexto, PlantillaResultado } from "./plan-recalculado.template"

/**
 * Plantilla `CASO_REABIERTO` (D-S11.5-A2, §19.3).
 *
 * Tipo critico — el HTML NO incluye pie con link a /preferencias-notificaciones
 * porque los criticos no se pueden silenciar (§19.3 punto 1). El motivo viene
 * del header `X-Motivo` validado en el controller; lo mostramos al colaborador
 * para que entienda por que se reabrio el caso.
 */
export function construirCasoReabierto(
  payload: CasoReabiertoPayload,
  contexto: PlantillaContexto,
): PlantillaResultado {
  const cursoTitulo = sanitizarTexto(payload.cursoTitulo)
  const motivo = sanitizarTexto(payload.motivo)
  const subject = `Tu caso del curso "${cursoTitulo}" ha sido reabierto`
  const verBandejaUrl = `${contexto.appBaseUrl}/bandeja`

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
          <p style="margin:0 0 16px 0;">Tu caso del curso "${escapeHtml(cursoTitulo)}" se reabrio y volvio a estado EN PROGRESO.</p>
          <p style="margin:0 0 16px 0;"><strong>Motivo:</strong> ${escapeHtml(motivo)}</p>
          <p style="margin:24px 0;text-align:center;">
            <a href="${escapeHtml(verBandejaUrl)}" style="display:inline-block;padding:12px 24px;background-color:#2563eb;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;">Ir a mi bandeja</a>
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`

  const text = [
    "Hola,",
    "",
    `Tu caso del curso "${cursoTitulo}" se reabrio y volvio a estado EN PROGRESO.`,
    `Motivo: ${motivo}`,
    "",
    `Ir a mi bandeja: ${verBandejaUrl}`,
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
