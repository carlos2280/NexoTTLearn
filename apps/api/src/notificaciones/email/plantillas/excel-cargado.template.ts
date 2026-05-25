import { ExcelCargadoPayload } from "../../payload/excel-cargado.payload"
import { PlantillaContexto, PlantillaResultado } from "./plan-recalculado.template"

/**
 * Plantilla `EXCEL_CARGADO` (D-S11.5-B2, §19.3).
 *
 * Tipo critico (operativo) — el HTML NO incluye pie con link a
 * /preferencias-notificaciones porque los criticos no se pueden silenciar
 * (§19.3 punto 1). Se emite SOLO al admin actor que disparo la carga (no
 * broadcast). Confirma exito de la aplicacion del preview con un resumen
 * agregado.
 */
export function construirExcelCargado(
  payload: ExcelCargadoPayload,
  contexto: PlantillaContexto,
): PlantillaResultado {
  const subject = "Carga de evaluacion inicial completada"
  const verCursoUrl = `${contexto.appBaseUrl}/admin/cursos/${encodeURIComponent(payload.cursoId)}`
  const skills = payload.skillsActualizadas
  const colaboradores = payload.colaboradoresActualizados
  const planes = payload.planesMarcadosDesactualizados

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
          <p style="margin:0 0 16px 0;">La aplicacion del Excel termino correctamente. Resumen:</p>
          <ul style="margin:0 0 16px 0;padding-left:20px;">
            <li>Skills actualizadas: ${skills}</li>
            <li>Colaboradores afectados: ${colaboradores}</li>
            <li>Planes marcados desactualizados: ${planes}</li>
          </ul>
          <p style="margin:24px 0;text-align:center;">
            <a href="${escapeHtml(verCursoUrl)}" style="display:inline-block;padding:12px 24px;background-color:#2563eb;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;">Ver curso</a>
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`

  const text = [
    "Hola,",
    "",
    "La aplicacion del Excel termino correctamente. Resumen:",
    `- Skills actualizadas: ${skills}`,
    `- Colaboradores afectados: ${colaboradores}`,
    `- Planes marcados desactualizados: ${planes}`,
    "",
    `Ver curso: ${verCursoUrl}`,
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
