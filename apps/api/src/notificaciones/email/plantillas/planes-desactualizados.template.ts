import { PlanesDesactualizadosPayload } from "../../payload/planes-desactualizados.payload"
import { PlantillaContexto, PlantillaResultado } from "./plan-recalculado.template"

/**
 * Plantilla `PLANES_DESACTUALIZADOS` (D-S11.5-B3, D80, §19.3).
 *
 * Tipo silenciable — el HTML incluye pie con link a /preferencias-notificaciones
 * para que el admin pueda silenciar este tipo si lo desea (§19.3 punto 1). El
 * `driver` discrimina la causa raiz (recarga Excel vs reapertura individual)
 * y se renderiza copy distinto.
 */
export function construirPlanesDesactualizados(
  payload: PlanesDesactualizadosPayload,
  contexto: PlantillaContexto,
): PlantillaResultado {
  const verCursoUrl = `${contexto.appBaseUrl}/admin/cursos/${encodeURIComponent(payload.cursoId)}`
  const preferenciasUrl = `${contexto.appBaseUrl}/preferencias-notificaciones`
  const causa =
    payload.driver === "recarga_excel"
      ? "una recarga masiva de Excel"
      : "la reapertura de un caso individual"
  const subject =
    payload.driver === "recarga_excel"
      ? `Planes desactualizados tras recarga Excel (${payload.planesAfectados})`
      : `Plan desactualizado tras reapertura de caso (${payload.planesAfectados})`

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
          <p style="margin:0 0 16px 0;">Tras ${causa}, quedaron ${payload.planesAfectados} plan(es) marcados como desactualizados. Revisa el curso para decidir si recalcular.</p>
          <p style="margin:24px 0;text-align:center;">
            <a href="${escapeHtml(verCursoUrl)}" style="display:inline-block;padding:12px 24px;background-color:#2563eb;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;">Ver curso</a>
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
    `Tras ${causa}, quedaron ${payload.planesAfectados} plan(es) marcados como desactualizados. Revisa el curso para decidir si recalcular.`,
    "",
    `Ver curso: ${verCursoUrl}`,
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
