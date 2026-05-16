/**
 * Payload tipado para notificaciones `MODULO_HUERFANO_SKILL` (D-S11.5-B4,
 * D79+D82, §19.2/§19.3).
 *
 * Tipo critico — no silenciable. Se emite via broadcast a todos los admins
 * activos cuando el archivado global de un modulo (`ModulosService.archivar`)
 * deja una o mas skills exigidas por cursos ACTIVO sin ningun bloque que las
 * imparta. Es una rotura potencial de la viabilidad de esos cursos y por eso
 * no se puede silenciar (§19.3 punto 1).
 *
 * Solo contiene identificadores agregados: el modulo archivado, los cursos
 * afectados y las skills que quedaron huerfanas con el listado de cursos
 * donde caen huerfanas. Sin datos personales (§19 + R-S11.5-10).
 */
export interface ModuloHuerfanoSkillCurso {
  readonly cursoId: string
  readonly titulo: string
}

export interface ModuloHuerfanoSkillSkill {
  readonly skillId: string
  readonly etiquetaVisible: string
  readonly cursosDondeQuedaHuerfana: readonly string[]
}

export interface ModuloHuerfanoSkillPayload {
  readonly moduloId: string
  readonly cursos: readonly ModuloHuerfanoSkillCurso[]
  readonly huerfanas: readonly ModuloHuerfanoSkillSkill[]
}

function esCurso(value: unknown): value is ModuloHuerfanoSkillCurso {
  if (typeof value !== "object" || value === null) {
    return false
  }
  const c = value as Record<string, unknown>
  return typeof c.cursoId === "string" && typeof c.titulo === "string"
}

function esSkill(value: unknown): value is ModuloHuerfanoSkillSkill {
  if (typeof value !== "object" || value === null) {
    return false
  }
  const s = value as Record<string, unknown>
  return (
    typeof s.skillId === "string" &&
    typeof s.etiquetaVisible === "string" &&
    Array.isArray(s.cursosDondeQuedaHuerfana) &&
    s.cursosDondeQuedaHuerfana.every((id) => typeof id === "string")
  )
}

export function esModuloHuerfanoSkillPayload(value: unknown): value is ModuloHuerfanoSkillPayload {
  if (typeof value !== "object" || value === null) {
    return false
  }
  const candidato = value as Record<string, unknown>
  return (
    typeof candidato.moduloId === "string" &&
    Array.isArray(candidato.cursos) &&
    candidato.cursos.every(esCurso) &&
    Array.isArray(candidato.huerfanas) &&
    candidato.huerfanas.every(esSkill)
  )
}
