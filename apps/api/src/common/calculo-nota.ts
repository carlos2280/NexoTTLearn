// MAESTRO §9.5, §9.7, §9.8 · helpers puros de calculo de notas
// agregadas y derivacion de etiqueta de logro.
//
// Iter 9.9 · centralizamos aqui la formula para reusar en RecalculoService
// y en futuros call sites (sellado de expediente, dashboards). Sin DB.

import { Prisma } from "@prisma/client"
import type { EtiquetaLogro } from "@prisma/client"

/**
 * Promedio ponderado generico. Devuelve null si no hay items con peso > 0
 * (no hay datos suficientes). Pesos no necesitan sumar 100; se renormaliza
 * dividiendo por la suma efectiva — esto permite agregaciones parciales
 * (ej. modulos con entregas vs sin entregas).
 *
 * Redondeo HALF_UP a 2 decimales (MAESTRO §17.9 escala 0-100).
 */
export function promedioPonderado(
  items: ReadonlyArray<{ valor: Prisma.Decimal | number; peso: Prisma.Decimal | number }>,
): number | null {
  if (items.length === 0) {
    return null
  }
  let sumaPonderada = new Prisma.Decimal(0)
  let sumaPesos = new Prisma.Decimal(0)
  for (const item of items) {
    const valor = toDecimal(item.valor)
    const peso = toDecimal(item.peso)
    if (peso.lessThanOrEqualTo(0)) {
      continue
    }
    sumaPonderada = sumaPonderada.add(valor.mul(peso))
    sumaPesos = sumaPesos.add(peso)
  }
  if (sumaPesos.lessThanOrEqualTo(0)) {
    return null
  }
  return sumaPonderada.div(sumaPesos).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP).toNumber()
}

/**
 * MAESTRO §9.8 · deriva etiqueta de logro segun umbrales del curso.
 * Comparacion >=. Sin nota → null (no hay etiqueta posible).
 *
 * - nota >= umbralExcelencia      → EXCELENCIA
 * - nota >= umbralAprobado        → APROBADO
 * - nota >= umbralEnDesarrollo    → EN_DESARROLLO
 * - resto                         → INSUFICIENTE
 */
export function derivarEtiquetaLogro(
  nota: number | null,
  umbrales: { umbralExcelencia: number; umbralAprobado: number; umbralEnDesarrollo: number },
): EtiquetaLogro | null {
  if (nota === null) {
    return null
  }
  if (nota >= umbrales.umbralExcelencia) {
    return "EXCELENCIA"
  }
  if (nota >= umbrales.umbralAprobado) {
    return "APROBADO"
  }
  if (nota >= umbrales.umbralEnDesarrollo) {
    return "EN_DESARROLLO"
  }
  return "INSUFICIENTE"
}

function toDecimal(value: Prisma.Decimal | number): Prisma.Decimal {
  return value instanceof Prisma.Decimal ? value : new Prisma.Decimal(value)
}
