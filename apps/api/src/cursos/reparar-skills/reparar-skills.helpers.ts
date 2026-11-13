/**
 * Logica pura de "reparar skills de un curso": decide que le falta a un curso
 * ya cargado para que sus secciones entren al plan de estudio y sus bloques
 * evaluables admitan intentos. Sin BD: el service carga el curso, aplica lo
 * que estas funciones devuelven y recalcula los planes.
 *
 * Misma regla que el importador (importar-curso.helpers.ts), ahora sobre un
 * curso persistido:
 *  - Bloque evaluable sin skill → skill «‹curso› · ‹modulo›».
 *  - Seccion SIN SeccionSkill → las skills de sus bloques evaluables; si no
 *    tiene ninguna, la representante del modulo (primera skill en orden).
 *  - Secciones que ya tienen skills no se tocan: la reparacion solo agrega.
 */

// Tope de `etiquetaVisible` aceptado al importar (importar-curso.schema.ts).
const MAX_ETIQUETA_SKILL = 200

// Tipos de bloque que miden una skill (los que admiten intentos con nota).
const TIPOS_QUE_MIDEN_SKILL: ReadonlySet<string> = new Set([
  "QUIZ",
  "CODIGO_PREGUNTAS",
  "SQL_EJERCICIO",
])

export interface BloqueAReparar {
  readonly id: string
  readonly tipo: string
  readonly esEvaluable: boolean
  readonly skillQueMideId: string | null
}

export interface SeccionAReparar {
  readonly id: string
  readonly skillIds: readonly string[]
  bloques: readonly BloqueAReparar[]
}

export interface ModuloAReparar {
  readonly id: string
  readonly titulo: string
  readonly secciones: readonly SeccionAReparar[]
}

export interface CursoAReparar {
  readonly titulo: string
  readonly modulos: readonly ModuloAReparar[]
}

export interface BloqueSinSkill {
  readonly bloqueId: string
  readonly etiqueta: string
}

export interface FilaSeccionSkill {
  readonly seccionId: string
  readonly skillId: string
}

export function etiquetaSkillPorDefecto(tituloCurso: string, tituloModulo: string): string {
  return `${tituloCurso} · ${tituloModulo}`.slice(0, MAX_ETIQUETA_SKILL)
}

function mideSkill(bloque: BloqueAReparar): boolean {
  return bloque.esEvaluable && TIPOS_QUE_MIDEN_SKILL.has(bloque.tipo)
}

/** Bloques evaluables sin skill, con la etiqueta por defecto de su modulo. */
export function bloquesSinSkill(curso: CursoAReparar): readonly BloqueSinSkill[] {
  const out: BloqueSinSkill[] = []
  for (const modulo of curso.modulos) {
    const etiqueta = etiquetaSkillPorDefecto(curso.titulo, modulo.titulo)
    for (const seccion of modulo.secciones) {
      for (const bloque of seccion.bloques) {
        if (mideSkill(bloque) && bloque.skillQueMideId === null) {
          out.push({ bloqueId: bloque.id, etiqueta })
        }
      }
    }
  }
  return out
}

/**
 * Filas `SeccionSkill` nuevas para las secciones que no tienen ninguna.
 * `skillNuevaDeBloque` trae la skill recien asignada a los bloques que no
 * tenian (bloqueId → skillId).
 */
export function planificarSeccionSkills(
  curso: CursoAReparar,
  skillNuevaDeBloque: ReadonlyMap<string, string>,
): readonly FilaSeccionSkill[] {
  return curso.modulos.flatMap((modulo) => filasDeModulo(modulo, skillNuevaDeBloque))
}

function filasDeModulo(
  modulo: ModuloAReparar,
  skillNuevaDeBloque: ReadonlyMap<string, string>,
): readonly FilaSeccionSkill[] {
  const skillsPorSeccion = modulo.secciones.map((s) => skillsDeSeccion(s, skillNuevaDeBloque))
  const representante = skillsPorSeccion.flat()[0]
  const filas: FilaSeccionSkill[] = []
  for (const [idx, seccion] of modulo.secciones.entries()) {
    if (seccion.skillIds.length > 0) {
      continue
    }
    const propias = skillsPorSeccion[idx] ?? []
    const elegidas = propias.length > 0 ? propias : representante ? [representante] : []
    for (const skillId of elegidas) {
      filas.push({ seccionId: seccion.id, skillId })
    }
  }
  return filas
}

function skillsDeSeccion(
  seccion: SeccionAReparar,
  skillNuevaDeBloque: ReadonlyMap<string, string>,
): readonly string[] {
  const ids: string[] = []
  for (const bloque of seccion.bloques) {
    if (!mideSkill(bloque)) {
      continue
    }
    const skillId = bloque.skillQueMideId ?? skillNuevaDeBloque.get(bloque.id)
    if (skillId && !ids.includes(skillId)) {
      ids.push(skillId)
    }
  }
  return ids
}
