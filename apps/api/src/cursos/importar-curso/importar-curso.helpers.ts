import type {
  BloqueImportado,
  ImportarCursoInput,
  ModuloImportado,
  SeccionImportada,
} from "@nexott-learn/shared-types"

/**
 * Logica pura que decide, a partir del `.md` parseado, que skills se asignan a
 * cada seccion (`SeccionSkill`) y cuales quedan exigidas por el curso
 * (`CursoSkillExigida`). Sin estas relaciones el motor del plan
 * (`plan-personal.helpers.ts` -> `calcularPlan`) descarta todas las secciones
 * (`skillIds ∩ exigidas = ∅`) y el curso importado no mueve el % ni pinta los
 * checks verdes del sidebar.
 *
 * Reglas (decisiones de producto, ver PROMPT-SUCESOR-IMPORTADOR):
 *  - "Fundamentos" = skill fundacional del modulo (la que miden los quizzes).
 *    Se detecta por el segmento de capacidad (tras el ultimo `·`): si empieza
 *    por "Fundamentos" es fundacional. Robusto ante variantes reales del curso
 *    ("· Fundamentos", "· Fundamentos senior", "· Fundamentos de datos").
 *  - "Concreta" = cualquier otra skill (una capacidad especifica del modulo).
 *  - Representante del modulo = primera skill concreta usada por bloques
 *    evaluables del modulo, en orden de aparicion; si el modulo no tiene ninguna
 *    concreta, su primera fundacional; si no tiene skills, `null`.
 *  - SeccionSkill de una seccion = sus skills concretas propias (de sus bloques
 *    evaluables); si no tiene ninguna concreta propia (lectura pura o solo quiz
 *    fundacional), hereda el representante del modulo (si existe).
 *  - Exigidas del curso = union de todas las SeccionSkill. Asi entran las
 *    concretas + los representantes fundacionales de los modulos que solo tienen
 *    fundacionales (intro), y el resto de fundacionales quedan fuera.
 */

/**
 * `true` si la etiqueta es una skill fundacional del modulo. El criterio mira
 * el segmento de capacidad (lo que va tras el ultimo separador `·`).
 */
export function esSkillFundamentos(etiqueta: string): boolean {
  const partes = etiqueta.split("·")
  const capacidad = (partes.at(-1) ?? "").trim()
  return capacidad.startsWith("Fundamentos")
}

/**
 * Etiquetas de skill declaradas por los bloques evaluables de una seccion, en
 * orden de aparicion (con repeticiones: el orden es lo que importa aqui).
 */
export function etiquetasEvaluablesDeSeccion(seccion: SeccionImportada): readonly string[] {
  const etiquetas: string[] = []
  for (const bloque of seccion.bloques) {
    const etiqueta = etiquetaSkillDeBloque(bloque)
    if (etiqueta) {
      etiquetas.push(etiqueta)
    }
  }
  return etiquetas
}

function etiquetaSkillDeBloque(bloque: BloqueImportado): string | undefined {
  return "skillEtiqueta" in bloque ? bloque.skillEtiqueta : undefined
}

/**
 * Skill representante del modulo: primera concreta en orden de aparicion; si no
 * hay concretas, la primera fundacional; si el modulo no declara skills, `null`.
 */
export function representanteDeModulo(modulo: ModuloImportado): string | null {
  let primeraFundamentos: string | null = null
  for (const seccion of modulo.secciones) {
    for (const etiqueta of etiquetasEvaluablesDeSeccion(seccion)) {
      if (!esSkillFundamentos(etiqueta)) {
        return etiqueta
      }
      if (primeraFundamentos === null) {
        primeraFundamentos = etiqueta
      }
    }
  }
  return primeraFundamentos
}

/**
 * Etiquetas de skill (unicas) que se asignan como `SeccionSkill` de una seccion:
 * sus concretas propias, o el representante del modulo si no tiene ninguna.
 */
export function etiquetasSkillDeSeccion(
  seccion: SeccionImportada,
  representanteModulo: string | null,
): readonly string[] {
  const concretasPropias = etiquetasEvaluablesDeSeccion(seccion).filter(
    (etiqueta) => !esSkillFundamentos(etiqueta),
  )
  if (concretasPropias.length > 0) {
    return [...new Set(concretasPropias)]
  }
  return representanteModulo ? [representanteModulo] : []
}

// Tope de `skillEtiqueta` en el schema de importacion (importar-curso.schema.ts).
const MAX_ETIQUETA_SKILL = 200

/**
 * Da a cada bloque evaluable (QUIZ, CODIGO, SQL) que no declaro `skill="…"` la
 * skill por defecto de su modulo: «‹titulo del curso› · ‹titulo del modulo›».
 * Sin skill, el bloque no admite intentos (`bloqueSinSkillMedida`) y la seccion
 * queda fuera del plan, asi que el % del asignado nunca se mueve. La plantilla
 * descargable no pedia la skill, y asi se cargaron cursos reales.
 * Devuelve un input nuevo; no muta el recibido.
 */
export function completarSkillsFaltantes(input: ImportarCursoInput): ImportarCursoInput {
  return {
    ...input,
    modulos: input.modulos.map((modulo) => {
      const porDefecto = `${input.curso.titulo} · ${modulo.titulo}`.slice(0, MAX_ETIQUETA_SKILL)
      return {
        ...modulo,
        secciones: modulo.secciones.map((seccion) => ({
          ...seccion,
          bloques: seccion.bloques.map((bloque) => conSkillPorDefecto(bloque, porDefecto)),
        })),
      }
    }),
  }
}

function conSkillPorDefecto(bloque: BloqueImportado, porDefecto: string): BloqueImportado {
  const esEvaluable = bloque.tipo === "QUIZ" || bloque.tipo === "CODIGO" || bloque.tipo === "SQL"
  if (!esEvaluable || bloque.skillEtiqueta) {
    return bloque
  }
  return { ...bloque, skillEtiqueta: porDefecto }
}

/**
 * Forma comparable del nombre de un cliente: sin mayusculas, sin tildes, con
 * un solo tipo de guion y sin espacios repetidos. Los nombres reales mezclan
 * «-» y «—», y escribirlos exactos a mano en el `.md` es facil de errar.
 */
export function normalizarNombreCliente(nombre: string): string {
  return nombre
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[\u2010-\u2015\u2212]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
}
