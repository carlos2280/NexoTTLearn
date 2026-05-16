import { ModuloHuerfanoSkillPayload } from "../../payload/modulo-huerfano-skill.payload"
import { PlantillaContexto, PlantillaResultado } from "./plan-recalculado.template"

const MAX_ITEMS_LISTADO = 10

/**
 * Plantilla `MODULO_HUERFANO_SKILL` (D-S11.5-B4, D79+D82, §19.3).
 *
 * Tipo critico — el HTML NO incluye pie con link a /preferencias-notificaciones
 * porque los criticos no se pueden silenciar (§19.3 punto 1). Se emite via
 * broadcast a todos los admins activos cuando el archivado global de un
 * modulo deja una o mas skills exigidas por cursos ACTIVO sin bloque que las
 * imparta — rompe la viabilidad de esos cursos.
 */
export function construirModuloHuerfanoSkill(
  payload: ModuloHuerfanoSkillPayload,
  contexto: PlantillaContexto,
): PlantillaResultado {
  const totalCursos = payload.cursos.length
  const totalHuerfanas = payload.huerfanas.length
  const subject = `Modulo archivado deja ${totalHuerfanas} skill(s) sin cobertura en ${totalCursos} curso(s)`
  const verCatalogoUrl = `${contexto.appBaseUrl}/admin/catalogo/modulos`

  const cursosVisibles = payload.cursos.slice(0, MAX_ITEMS_LISTADO)
  const skillsVisibles = payload.huerfanas.slice(0, MAX_ITEMS_LISTADO)
  const cursosOcultos = totalCursos - cursosVisibles.length
  const skillsOcultas = totalHuerfanas - skillsVisibles.length

  const cursosHtmlItems = cursosVisibles
    .map((c) => `<li>${escapeHtml(sanitizarTexto(c.titulo))}</li>`)
    .join("")
  const skillsHtmlItems = skillsVisibles
    .map((s) => `<li>${escapeHtml(sanitizarTexto(s.etiquetaVisible))}</li>`)
    .join("")
  const cursosHtmlExtra = cursosOcultos > 0 ? `<li>... y ${cursosOcultos} curso(s) mas</li>` : ""
  const skillsHtmlExtra = skillsOcultas > 0 ? `<li>... y ${skillsOcultas} skill(s) mas</li>` : ""

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
          <p style="margin:0 0 16px 0;">Un modulo fue archivado y deja skills sin cobertura en cursos activos. Esto puede romper la viabilidad de los cursos afectados.</p>
          <p style="margin:0 0 8px 0;"><strong>Cursos afectados:</strong></p>
          <ul style="margin:0 0 16px 0;padding-left:20px;">${cursosHtmlItems}${cursosHtmlExtra}</ul>
          <p style="margin:0 0 8px 0;"><strong>Skills huerfanas:</strong></p>
          <ul style="margin:0 0 16px 0;padding-left:20px;">${skillsHtmlItems}${skillsHtmlExtra}</ul>
          <p style="margin:24px 0;text-align:center;">
            <a href="${escapeHtml(verCatalogoUrl)}" style="display:inline-block;padding:12px 24px;background-color:#2563eb;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;">Ir al catalogo</a>
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`

  const cursosText = cursosVisibles.map((c) => `- ${sanitizarTexto(c.titulo)}`).join("\n")
  const skillsText = skillsVisibles.map((s) => `- ${sanitizarTexto(s.etiquetaVisible)}`).join("\n")
  const cursosTextExtra = cursosOcultos > 0 ? `\n- ... y ${cursosOcultos} curso(s) mas` : ""
  const skillsTextExtra = skillsOcultas > 0 ? `\n- ... y ${skillsOcultas} skill(s) mas` : ""

  const text = [
    "Hola,",
    "",
    "Un modulo fue archivado y deja skills sin cobertura en cursos activos. Esto puede romper la viabilidad de los cursos afectados.",
    "",
    "Cursos afectados:",
    `${cursosText}${cursosTextExtra}`,
    "",
    "Skills huerfanas:",
    `${skillsText}${skillsTextExtra}`,
    "",
    `Ir al catalogo: ${verCatalogoUrl}`,
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
