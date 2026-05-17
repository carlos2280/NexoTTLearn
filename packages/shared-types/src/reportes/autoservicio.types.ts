/**
 * Tipos response de endpoints autoservicio bajo `/me/...` (Slice 11 P11c).
 *
 * Visibilidad cap. 10.7: pre-cierre el participante NO ve `notaGlobalFinal`
 * ni `etiquetaCualitativaFinal`. Esos campos solo aparecen cuando el curso
 * esta en estado CERRADO (flag `estaCerrado=true`).
 */

export type EtiquetaCualitativa = "excelencia" | "solido" | "enDesarrollo" | "noCumple"

export type ClaseColorSkill = "verde" | "amarillo" | "rojo"

export interface MeAvancePorSkill {
  readonly skillId: string
  readonly etiqueta: string
  readonly notaActual: number | null
  readonly claseColor: ClaseColorSkill
}

export interface MeAvanceSiguienteSeccion {
  readonly seccionId: string
  readonly moduloId: string
  readonly titulo: string
}

/**
 * Nivel cualitativo de un area dentro del camino hacia apto.
 *
 *  - `solido`: todas las skills exigidas del area estan demostradas.
 *  - `enDesarrollo`: al menos una skill demostrada, pero faltan.
 *  - `porExplorar`: ninguna skill demostrada todavia.
 */
export type NivelCaminoHaciaAptoArea = "solido" | "enDesarrollo" | "porExplorar"

export interface CaminoHaciaAptoPorArea {
  readonly areaId: string
  readonly areaCodigo: string
  readonly areaNombre: string
  readonly skillsExigidas: number
  readonly skillsDemostradas: number
  readonly nivelCualitativo: NivelCaminoHaciaAptoArea
}

/**
 * Vista agregada **por area** del progreso hacia el veredicto APTO del curso
 * (decision 03-R2: el participante solo ve areas, no skills granulares).
 *
 * Una skill esta "demostrada" cuando `notaActual >= notaMinima` definida en
 * `CursoSkillExigida` — misma semantica que el chip "verde" de
 * `MeAvancePorSkill`. `faltantesParaApto` es la suma de skills no demostradas
 * en todas las areas. Cuando es 0, `estaListo: true`.
 */
export interface CaminoHaciaApto {
  readonly faltantesParaApto: number
  readonly estaListo: boolean
  readonly porArea: readonly CaminoHaciaAptoPorArea[]
}

export interface MeAvanceCursoResponse {
  readonly cursoId: string
  readonly estaCerrado: boolean
  readonly porcentajeAvance: number
  readonly seccionesCompletadas: number
  readonly seccionesObligatorias: number
  readonly porSkill: readonly MeAvancePorSkill[]
  readonly siguienteSeccion: MeAvanceSiguienteSeccion | null
  readonly caminoHaciaApto: CaminoHaciaApto
  readonly notaGlobalFinal?: number
  readonly etiquetaCualitativaFinal?: EtiquetaCualitativa
}

export type ResultadoCierreCurso = "APTO" | "NO_APTO" | "COMPLETADO"

export interface SkillCosechadaCierre {
  readonly skillId: string
  readonly skillNombre: string
  readonly areaCodigo: string
  readonly areaNombre: string
}

export interface AreaPorTrabajarCierre {
  readonly areaId: string
  readonly areaNombre: string
  readonly areaCodigo: string
  readonly nivelCualitativo: "enDesarrollo" | "inicial"
}

/**
 * Respuesta de `GET /me/cursos/:cursoId/resumen-cierre` (TODO B-26).
 *
 * Usado por la pantalla "Curso cerrado" (`/cursos/:cursoId/cerrado`), la
 * ceremonia del veredicto. Hoy parte de esto vive en `MeAvanceCursoResponse`
 * cuando `estaCerrado=true`, pero el cliente necesita ademas:
 *
 *  - `skillsDemostradasNuevas`: la "cosecha" del curso (skills demostradas
 *    EN ESTE curso, no en otros).
 *  - `areasPorTrabajar`: solo cuando `resultado === 'NO_APTO'`.
 *  - `comentarioAdmin`: texto libre del admin al cerrar (si lo escribio).
 */
export interface ResumenCierreCurso {
  readonly cursoId: string
  readonly cursoTitulo: string
  readonly fechaCierre: string
  readonly resultado: ResultadoCierreCurso
  readonly etiquetaCualitativaFinal: EtiquetaCualitativa
  readonly notaGlobalFinal: number
  readonly skillsDemostradasNuevas: readonly SkillCosechadaCierre[]
  readonly areasPorTrabajar: readonly AreaPorTrabajarCierre[]
  readonly comentarioAdmin: string | null
}
