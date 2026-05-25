import { Prisma } from "@prisma/client"

/**
 * Convierte un `Prisma.Decimal | null` proveniente del cliente Prisma al tipo
 * `number | null` que viaja en las respuestas JSON. Centralizado para evitar
 * duplicacion entre services que leen `notas_skill.notaActual` u otros campos
 * `Decimal(5,2)` (D-CUR-15). `null` se preserva explicitamente: no equivale a
 * 0 (D40, ver `04_datos/modelo_fisico.md`).
 */
export function decimalAnumero(valor: Prisma.Decimal | null): number | null {
  return valor === null ? null : Number(valor)
}
