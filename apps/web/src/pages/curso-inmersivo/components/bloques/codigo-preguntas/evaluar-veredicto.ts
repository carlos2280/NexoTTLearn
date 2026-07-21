/**
 * Clasifica el resultado de un intento de reto de código en tres estados y
 * arma el mensaje honesto para el participante. Pura y testeable.
 *
 * Como `nota = testsPasados / testsTotales * 100`, pasar TODOS los tests
 * equivale a `nota >= 100`. El "aprobado" del avance sigue rigiéndose por
 * `notaAprobado` (60) — este helper NO lo cambia; solo decide qué se muestra:
 *  - `pleno`      → 100%: pasó todo. Único estado que celebra ("Lo lograste").
 *  - `parcial`    → aprobado (≥ `notaAprobado`) pero < 100: mensaje honesto en
 *    ámbar; el avance cuenta, pero aún falla algún caso.
 *  - `reprobado`  → por debajo del umbral: invita a reintentar.
 *
 * El mensaje `parcial` solo menciona la "pista" si de verdad hay una visible
 * (`hayPistaOculta`): un parcial también se alcanza fallando un test visible o
 * un oculto sin descripción, y en esos casos prometer una pista que no existe
 * dejaría al participante buscando algo que no está.
 */

export type EstadoVeredicto = "pleno" | "parcial" | "reprobado"

export interface Veredicto {
  readonly estado: EstadoVeredicto
  /** `true` solo al ALCANZAR el 100% por primera vez → dispara la celebración
   *  (aurora + "Lo lograste"). Un re-envío ya pleno no vuelve a celebrar. */
  readonly celebrar: boolean
  readonly mensaje: string
}

const NOTA_PLENA = 100

export function evaluarVeredicto(input: {
  readonly nota: number
  readonly notaAprobado: number
  /** Nota del mejor intento PREVIO al actual, o `null` si es el primero. */
  readonly notaPrevia: number | null
  /** Hay al menos un caso oculto fallando con descripción → se está mostrando
   *  una pista en la consola. Solo entonces el mensaje parcial la menciona. */
  readonly hayPistaOculta: boolean
}): Veredicto {
  const estado = clasificar(input.nota, input.notaAprobado)
  const yaEstabaPleno = (input.notaPrevia ?? Number.NEGATIVE_INFINITY) >= NOTA_PLENA
  const celebrar = estado === "pleno" && !yaEstabaPleno
  return { estado, celebrar, mensaje: construirMensaje(estado, celebrar, input.hayPistaOculta) }
}

function clasificar(nota: number, notaAprobado: number): EstadoVeredicto {
  if (nota >= NOTA_PLENA) {
    return "pleno"
  }
  if (nota >= notaAprobado) {
    return "parcial"
  }
  return "reprobado"
}

function construirMensaje(
  estado: EstadoVeredicto,
  celebrar: boolean,
  hayPistaOculta: boolean,
): string {
  if (estado === "pleno") {
    return celebrar
      ? "Lo lograste. Acabas de demostrar capacidad nueva."
      : "Aprobado. Tu mejor intento sigue contando."
  }
  if (estado === "parcial") {
    return hayPistaOculta
      ? "Aprobado, pero aún falla algún caso oculto. Revisa la pista y afina tu solución para dominar el reto."
      : "Aprobado, pero aún falla algún caso. Revisa los resultados y afina tu solución para dominar el reto."
  }
  return "Aún no. Revisa los tests que fallaron y vuelve a intentarlo — la mejor cuenta."
}
