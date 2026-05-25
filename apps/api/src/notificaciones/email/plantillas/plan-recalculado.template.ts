import { PlanRecalculadoPayload } from "../../payload/plan-recalculado.payload"

/**
 * Plantilla `PLAN_RECALCULADO` (D-S10-C9, §19.3.2).
 *
 * No critico — el HTML incluye pie con link a /preferencias-notificaciones para
 * silenciar el tipo. Funcion pura: recibe `appBaseUrl` por contexto y nunca
 * lee `process.env`.
 */

export interface PlantillaContexto {
  readonly appBaseUrl: string
}

export interface PlantillaResultado {
  readonly subject: string
  readonly html: string
  readonly text: string
}

export function construirPlanRecalculado(
  payload: PlanRecalculadoPayload,
  contexto: PlantillaContexto,
): PlantillaResultado {
  const cursoTitulo = sanitizarTexto(payload.cursoTitulo)
  const subject = "Tu plan personal en NexoTT Learn ha sido actualizado"
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
          <p style="margin:0 0 16px 0;">tu plan personal para el curso "${escapeHtml(cursoTitulo)}" ha sido actualizado. Revisa los cambios.</p>
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
    `Tu plan personal para el curso "${cursoTitulo}" ha sido actualizado. Revisa los cambios.`,
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
