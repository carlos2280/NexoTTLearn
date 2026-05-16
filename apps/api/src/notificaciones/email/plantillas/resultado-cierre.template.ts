import { ResultadoCierre, ResultadoCierrePayload } from "../../payload/resultado-cierre.payload"
import { PlantillaContexto, PlantillaResultado } from "./plan-recalculado.template"

/**
 * Plantilla `RESULTADO_CIERRE` (D-S10-C9, §19.3.1).
 *
 * Tipo critico — el HTML NO incluye link a /preferencias-notificaciones porque
 * el usuario no puede silenciar criticos. Subject y cuerpo varian segun
 * APTO / NO_APTO / COMPLETADO.
 */
export function construirResultadoCierre(
  payload: ResultadoCierrePayload,
  contexto: PlantillaContexto,
): PlantillaResultado {
  const cursoTitulo = sanitizarTexto(payload.cursoTitulo)
  const resultadoLabel = etiquetaResultado(payload.resultado)
  const subject = `Resultado de tu curso "${cursoTitulo}": ${resultadoLabel}`
  const verBandejaUrl = `${contexto.appBaseUrl}/bandeja`
  const cuerpo = cuerpoSegunResultado(payload.resultado)

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
          <p style="margin:0 0 8px 0;">Tu curso "${escapeHtml(cursoTitulo)}" ha cerrado con resultado <strong>${escapeHtml(resultadoLabel)}</strong>.</p>
          <p style="margin:0 0 16px 0;">${escapeHtml(cuerpo)}</p>
          <p style="margin:24px 0;text-align:center;">
            <a href="${escapeHtml(verBandejaUrl)}" style="display:inline-block;padding:12px 24px;background-color:#2563eb;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;">Ver mi bandeja</a>
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`

  const text = [
    "Hola,",
    "",
    `Tu curso "${cursoTitulo}" ha cerrado con resultado ${resultadoLabel}.`,
    cuerpo,
    "",
    `Ver mi bandeja: ${verBandejaUrl}`,
  ].join("\n")

  return { subject, html, text }
}

function etiquetaResultado(resultado: ResultadoCierre): string {
  switch (resultado) {
    case "APTO":
      return "APTO"
    case "NO_APTO":
      return "NO APTO"
    case "COMPLETADO":
      return "COMPLETADO"
    default: {
      const _exhaustive: never = resultado
      return String(_exhaustive)
    }
  }
}

function cuerpoSegunResultado(resultado: ResultadoCierre): string {
  switch (resultado) {
    case "APTO":
      return "Felicitaciones, completaste el curso con exito."
    case "NO_APTO":
      return "Tu evaluacion final no alcanzo el umbral requerido. Consulta con tu administrador."
    case "COMPLETADO":
      return "El curso ha sido marcado como completado."
    default: {
      const _exhaustive: never = resultado
      return String(_exhaustive)
    }
  }
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
