import { UnprocessableEntityException } from "@nestjs/common"
import { Prisma } from "@prisma/client"
import { apiErrorCodes } from "../common/errors/api-error.codes"

/**
 * Contextos posibles del codigo unificado `VALIDACION_PESO_NO_SUMA_100`
 * (D-CUR-11). Viaja en `details.contexto` para que el cliente distinga
 * la fuente del fallo sin duplicar codigos.
 */
export type ContextoSumaPesos =
  | "AREAS"
  | "PESOS_INTRA_SKILL"
  | "CAPAS_TRANSVERSAL"
  | "RUBRICA_ENTREVISTA"

/**
 * Comparacion exacta `toFixed(2) === "100.00"` (D-CUR-5). El wizard del front
 * normaliza los inputs y el contrato exige suma = 100. Si emerge friccion por
 * redondeos, relajar a tolerancia 0.01 en FIX dedicado.
 *
 * Acepta `number` o `Prisma.Decimal` para reusar en validaciones que mezclan
 * valores nuevos del input con valores actuales del curso (Decimal de BD).
 */
export function validarSumaPesosCien(
  valores: ReadonlyArray<number | Prisma.Decimal>,
  contexto: ContextoSumaPesos,
): void {
  const suma = valores.reduce<number>((acc, v) => acc + Number(v), 0)
  if (suma.toFixed(2) !== "100.00") {
    throw new UnprocessableEntityException({
      code: apiErrorCodes.validacionPesoNoSuma100,
      message: `La suma de pesos debe ser 100 (contexto: ${contexto}).`,
      details: { contexto, sumaActual: Number(suma.toFixed(2)) },
    })
  }
}

/**
 * Diff de composite keys (D-CUR-6, patron heredado D-CAT-21). Calcula el
 * conjunto de claves a eliminar y a agregar dados un estado actual y un
 * estado deseado. La interseccion se devuelve para procesar updates puntuales
 * cuando ademas hay columnas extra (peso, notaMinima, puntajeObjetivo).
 */
export function calcularDiffComposite<T extends string>(
  enBD: ReadonlySet<T>,
  enInput: ReadonlySet<T>,
): {
  readonly aEliminar: readonly T[]
  readonly aAgregar: readonly T[]
  readonly interseccion: readonly T[]
} {
  const aEliminar = [...enBD].filter((v) => !enInput.has(v))
  const aAgregar = [...enInput].filter((v) => !enBD.has(v))
  const interseccion = [...enInput].filter((v) => enBD.has(v))
  return { aEliminar, aAgregar, interseccion }
}

/**
 * Validacion de monotonia para umbrales de logro: excelencia >= solido >=
 * enDesarrollo, todos en [0,100]. Lanza 422 si se viola.
 */
export function validarMonotoniaUmbralesLogro(valores: {
  readonly excelencia: number
  readonly solido: number
  readonly enDesarrollo: number
}): void {
  if (!(valores.excelencia >= valores.solido && valores.solido >= valores.enDesarrollo)) {
    throw new UnprocessableEntityException({
      code: apiErrorCodes.validacionUmbralesLogroMonotonia,
      message: "Los umbrales de logro deben cumplir excelencia >= solido >= enDesarrollo.",
      details: valores,
    })
  }
}

/**
 * Validacion de duracion de entrevista IA: solo se aceptan 15, 30 o 45 min.
 */
export function validarDuracionEntrevistaIa(duracionMinutos: number): void {
  if (!(duracionMinutos === 15 || duracionMinutos === 30 || duracionMinutos === 45)) {
    throw new UnprocessableEntityException({
      code: apiErrorCodes.validacionDuracionEntrevistaInvalida,
      message: "La duracion de la entrevista IA debe ser 15, 30 o 45 minutos.",
      details: { duracionMinutos },
    })
  }
}
