import { AsignacionCursoPayload } from "../../payload/asignacion-curso.payload"
import { PlantillaContexto, PlantillaResultado } from "./plan-recalculado.template"

/**
 * Plantilla `ASIGNACION_CURSO` (D-S11.5-A1, §19.3).
 *
 * Tipo critico — el HTML NO incluye pie con link a /preferencias-notificaciones
 * porque los criticos no se pueden silenciar (§19.3 punto 1). Funcion pura:
 * recibe `appBaseUrl` por contexto y nunca lee `process.env`.
 *
 * Se usa tanto para asignaciones ASIGNADO (creadas por admin via batch) como
 * para VOLUNTARIO (autoinscripcion). El subject es el mismo; el copy invita
 * al colaborador a abrir su bandeja para empezar.
 */
export function construirAsignacionCurso(
  payload: AsignacionCursoPayload,
  contexto: PlantillaContexto,
): PlantillaResultado {
  const cursoTitulo = sanitizarTexto(payload.cursoTitulo)
  const subject = `Tienes un nuevo curso asignado: "${cursoTitulo}"`
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
          <p style="margin:0 0 16px 0;">Te asignamos el curso "${escapeHtml(cursoTitulo)}". Ya esta disponible en tu bandeja.</p>
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
    `Te asignamos el curso "${cursoTitulo}". Ya esta disponible en tu bandeja.`,
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
