import type { BloqueEvaluableAdminItem } from "@nexott-learn/shared-types"
import { requiereAccion } from "./estado-reto"
import {
  ESTADO_PENDIENTE,
  type EstadoReto,
  type GrupoModulo,
  type ResumenGrupo,
  type RetoDelCurso,
} from "./retos.types"

/**
 * Proyecta los bloques evaluables del curso a los retos de código agrupados
 * por módulo. Se queda solo con `CODIGO_PREGUNTAS`: es el reto en sí, el único
 * bloque autocorregible por el runner del navegador (QUIZ y SQL_EJERCICIO se
 * evalúan por otra vía; `CODIGO_TESTS` es contenido auxiliar, no evaluable).
 *
 * El orden de los grupos respeta la PRIMERA APARICIÓN de cada módulo en la
 * respuesta del backend, no un criterio propio: `BloqueEvaluableAdminItem` no
 * trae el orden del módulo dentro del curso, así que inventar uno (alfabético)
 * mentiría sobre la secuencia real del curso. Dentro de cada módulo sí hay
 * datos reales de orden (`seccion.orden` y `orden` del bloque) y se usan esos:
 * ordenar por título dejaría la sección "10." antes que la "2.".
 *
 * Pura: sin fetch, sin DOM.
 */
export function agruparRetosPorModulo(
  bloques: readonly BloqueEvaluableAdminItem[],
): readonly GrupoModulo[] {
  const grupos = new Map<string, { titulo: string; retos: RetoDelCurso[] }>()

  for (const bloque of bloques) {
    if (bloque.tipo !== "CODIGO_PREGUNTAS") {
      continue
    }
    const grupo = grupos.get(bloque.modulo.id) ?? { titulo: bloque.modulo.titulo, retos: [] }
    grupo.retos.push({
      bloqueId: bloque.bloqueId,
      orden: bloque.orden,
      seccionId: bloque.seccion.id,
      seccionTitulo: bloque.seccion.titulo,
      seccionOrden: bloque.seccion.orden,
    })
    grupos.set(bloque.modulo.id, grupo)
  }

  return [...grupos.entries()].map(([moduloId, grupo]) => ({
    moduloId,
    titulo: grupo.titulo,
    retos: [...grupo.retos].sort(compararRetos),
  }))
}

function compararRetos(a: RetoDelCurso, b: RetoDelCurso): number {
  if (a.seccionOrden !== b.seccionOrden) {
    return a.seccionOrden - b.seccionOrden
  }
  return a.orden - b.orden
}

/** Aplana los grupos en el orden en que se muestran: así "Validar todos" recorre en el mismo orden que ve el admin. */
export function aplanarRetos(grupos: readonly GrupoModulo[]): readonly RetoDelCurso[] {
  return grupos.flatMap((g) => g.retos)
}

/**
 * Cuenta por categoría para el chip del módulo. "Roto" es todo lo que pide una
 * acción humana, según el criterio único de `requiereAccion`.
 *
 * Las cuatro categorías cubren TODOS los retos (`ok + rotos + sinValidar +
 * noAplica === total`). Que `noAplica` sea explícito no es cosmético: cuando
 * los retos en un lenguaje no autocorregible no caían en ningún contador, un
 * módulo con 1 reto JS válido y 9 en Java anunciaba "Todos pasan".
 */
export function resumirGrupo(
  retos: readonly RetoDelCurso[],
  estados: ReadonlyMap<string, EstadoReto>,
): ResumenGrupo {
  let ok = 0
  let rotos = 0
  let sinValidar = 0
  let noAplica = 0

  for (const reto of retos) {
    const estado = estados.get(reto.bloqueId) ?? ESTADO_PENDIENTE
    if (estado.tipo === "ok") {
      ok += 1
    } else if (estado.tipo === "pendiente" || estado.tipo === "validando") {
      sinValidar += 1
    } else if (requiereAccion(estado)) {
      rotos += 1
    } else {
      noAplica += 1
    }
  }

  return { total: retos.length, ok, rotos, sinValidar, noAplica }
}
