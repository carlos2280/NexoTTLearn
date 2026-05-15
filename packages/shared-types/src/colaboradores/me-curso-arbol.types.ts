import type { AreaTagEmbed, SkillDestacadaEmbed } from "../asignaciones/asignacion.types"
import type { EstadoCurso } from "../cursos/curso.types"

/**
 * Modo en el que el participante consume el curso. Lo determina el backend
 * en `GET /me/cursos/:cursoId/arbol` segun la asignacion del usuario:
 *
 *  - `asignado`     — rol ASIGNADO. El frontend muestra plan personal + TOC,
 *                     bloques evaluables activos, panel de contexto completo.
 *  - `voluntario`   — rol VOLUNTARIO. El frontend muestra TOC del catalogo,
 *                     bloques evaluables activos (autoevaluacion), sin plan.
 *  - `preview`      — sin asignacion. El curso esta ACTIVO con
 *                     `toggleVoluntarios=true` (catalogo abierto). El frontend
 *                     muestra TOC en lectura, bloques evaluables visibles pero
 *                     con CTAs bloqueados ("Inscribete para responder"), y un
 *                     footer sticky con CTA de auto-inscripcion.
 */
export type ModoCursoParticipante = "asignado" | "voluntario" | "preview"

export interface CursoArbolCabecera {
  readonly id: string
  readonly titulo: string
  readonly estado: EstadoCurso
  readonly fechaInicio: string
  readonly fechaDeadline: string
  readonly cliente: {
    readonly id: string
    readonly nombre: string
  }
  /** Area dominante (mayor peso) — usada para tinta del header en preview. */
  readonly areaPrincipal: AreaTagEmbed | null
  /** Skills exigidas top-4 — refuerza la decision de inscribirse en preview. */
  readonly skillsDestacadas: readonly SkillDestacadaEmbed[]
}

export interface CursoArbolSeccion {
  readonly seccionId: string
  readonly titulo: string
  readonly orden: number
  /** Total de bloques de la seccion (info ligera para sidebar). */
  readonly totalBloques: number
}

export interface CursoArbolModulo {
  readonly moduloId: string
  readonly titulo: string
  readonly orden: number
  readonly secciones: readonly CursoArbolSeccion[]
}

/**
 * Respuesta de `GET /me/cursos/:cursoId/arbol`. Tres modos de acceso unifica-
 * dos en una sola query: asignado, voluntario, preview (catalogo).
 *
 * Reglas de visibilidad:
 *  - Si el usuario tiene asignacion al curso (ASIGNADO o VOLUNTARIO) → 200.
 *  - Si NO tiene asignacion pero el curso es ACTIVO con
 *    `toggleVoluntarios=true` → 200 con `modo: "preview"`.
 *  - En cualquier otro caso (curso BORRADOR/CERRADO/ARCHIVADO sin asignacion,
 *    o `toggleVoluntarios=false`) → 404 generico, sin revelar existencia.
 *
 * `asignacionId` solo viene en modos `asignado` y `voluntario`. En `preview`
 * es `null` (el participante aun no esta inscrito).
 */
export interface CursoArbolResponse {
  readonly modo: ModoCursoParticipante
  readonly asignacionId: string | null
  readonly curso: CursoArbolCabecera
  readonly modulos: readonly CursoArbolModulo[]
}
