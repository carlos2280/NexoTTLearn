import { ColaboradorListoPayload } from "../../payload/colaborador-listo.payload"
import { PlantillaContexto, PlantillaResultado } from "./plan-recalculado.template"

/**
 * Plantilla `COLABORADOR_LISTO` (D-S11.5-B1, §19.3).
 *
 * Tipo silenciable — el HTML incluye pie con link a /preferencias-notificaciones
 * para que el admin pueda silenciar este tipo si lo desea (§19.3 punto 1). Se
 * emite a TODOS los admins activos cuando un colaborador pasa a estado LISTO.
 */
export function construirColaboradorListo(
  payload: ColaboradorListoPayload,
  contexto: PlantillaContexto,
): PlantillaResultado {
  const cursoTitulo = sanitizarTexto(payload.cursoTitulo)
  const colaboradorNombre = sanitizarTexto(payload.colaboradorNombre)
  const subject = `Colaborador listo para cerrar: "${colaboradorNombre}" en "${cursoTitulo}"`
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
          <p style="margin:0 0 16px 0;">El colaborador "${escapeHtml(colaboradorNombre)}" cumplio las condiciones del curso "${escapeHtml(cursoTitulo)}" y esta LISTO para cierre administrativo.</p>
          <p style="margin:24px 0;text-align:center;">
            <a href="${escapeHtml(verBandejaUrl)}" style="display:inline-block;padding:12px 24px;background-color:#2563eb;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;">Ir al panel</a>
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
    `El colaborador "${colaboradorNombre}" cumplio las condiciones del curso "${cursoTitulo}" y esta LISTO para cierre administrativo.`,
    "",
    `Ir al panel: ${verBandejaUrl}`,
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
