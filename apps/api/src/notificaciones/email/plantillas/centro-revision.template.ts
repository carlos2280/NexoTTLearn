import { CentroRevisionPayload } from "../../payload/centro-revision.payload"
import { PlantillaContexto, PlantillaResultado } from "./plan-recalculado.template"

/**
 * Plantilla `CENTRO_REVISION` (D-S11.5-C3, §19.3 regla 4).
 *
 * Silenciable. El HTML incluye pie con link a /preferencias-notificaciones.
 * Funcion pura: recibe `appBaseUrl` por contexto y nunca lee `process.env`.
 * Digest agregado: muestra el total de pendientes y el desglose por tipo,
 * con link al Centro de revision del admin.
 */
export function construirCentroRevision(
  payload: CentroRevisionPayload,
  contexto: PlantillaContexto,
): PlantillaResultado {
  const fechaCorte = sanitizarTexto(payload.fechaCorte)
  const subject = `Centro de revision: ${payload.totalPendientes.toString()} pendientes`
  const verCentroUrl = `${contexto.appBaseUrl}/admin/centro-revision`
  const preferenciasUrl = `${contexto.appBaseUrl}/preferencias-notificaciones`
  const transversales = payload.porTipo.transversales
  const entrevistas = payload.porTipo.entrevistasIa

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
          <p style="margin:0 0 16px 0;">El Centro de revision tiene ${payload.totalPendientes} pendientes al ${escapeHtml(fechaCorte)}:</p>
          <ul style="margin:0 0 16px 0;padding-left:20px;">
            <li>Transversales con capas pendientes: ${transversales}</li>
            <li>Entrevistas IA con ajuste admin pendiente: ${entrevistas}</li>
          </ul>
          <p style="margin:24px 0;text-align:center;">
            <a href="${escapeHtml(verCentroUrl)}" style="display:inline-block;padding:12px 24px;background-color:#2563eb;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;">Ir al Centro de revision</a>
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
    `El Centro de revision tiene ${payload.totalPendientes} pendientes al ${fechaCorte}:`,
    `- Transversales con capas pendientes: ${transversales}`,
    `- Entrevistas IA con ajuste admin pendiente: ${entrevistas}`,
    "",
    `Ir al Centro de revision: ${verCentroUrl}`,
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
