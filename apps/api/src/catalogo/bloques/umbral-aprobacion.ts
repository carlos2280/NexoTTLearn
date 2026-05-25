import {
  type TipoBloque,
  contenidoCodigoPreguntasSchema,
  contenidoQuizSchema,
} from "@nexott-learn/shared-types"

/**
 * Umbral de aprobacion (0-100) por tipo de bloque evaluable. Es la fuente de
 * verdad que usan el plan personal y la logica de cierre para decidir si una
 * seccion obligatoria esta "completada".
 *
 * Reglas:
 *  - `QUIZ` -> el umbral lo decide el admin via `contenido.notaMinima`
 *    (default 60 segun el schema Zod).
 *  - `CODIGO_PREGUNTAS` -> umbral fijo en 60. El contenido aun no expone
 *    un campo `umbralAprobacion` editable por el admin (TODO: anadirlo al
 *    schema si surge la necesidad). Se mantiene alineado con el
 *    `NOTA_APROBADO_DEFAULT` del runtime del participante para que el chip
 *    "Mejor intento N/M" del bloque coincida con lo que el plan considera
 *    aprobado.
 *  - Otros tipos no son evaluables: no aplica.
 *
 * Antes existia una constante global `UMBRAL_BLOQUE_DEFAULT = 70` que ignoraba
 * el `notaMinima` del bloque: un QUIZ con `notaMinima=60` aprobaba el bloque
 * (chip verde) pero NO completaba la seccion en el plan (fallo de doble
 * fuente de verdad). Esta funcion resuelve ese conflicto.
 */
export function umbralAprobacionBloque(tipo: TipoBloque, contenido: unknown): number {
  if (tipo === "QUIZ") {
    const parsed = contenidoQuizSchema.safeParse(contenido)
    if (parsed.success) {
      return parsed.data.notaMinima
    }
    return UMBRAL_FALLBACK
  }
  if (tipo === "CODIGO_PREGUNTAS") {
    // El schema no expone un umbral editable; CODIGO_PREGUNTAS se evalua via
    // tests stdin/stdout y el "aprobado" coincide con el chip del bloque.
    const parsed = contenidoCodigoPreguntasSchema.safeParse(contenido)
    if (parsed.success) {
      return UMBRAL_CODIGO_PREGUNTAS
    }
    return UMBRAL_FALLBACK
  }
  return UMBRAL_FALLBACK
}

const UMBRAL_CODIGO_PREGUNTAS = 60
const UMBRAL_FALLBACK = 60
