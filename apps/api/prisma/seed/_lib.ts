import { randomUUID } from "node:crypto"
/**
 * Helpers compartidos por todos los módulos de seed.
 *
 * Reglas que respeta este archivo:
 *  - Idempotencia (PrismaClient se reusa, los upsert por clave natural en cada módulo).
 *  - UUIDs deterministas para entidades "ancla" (curso XYZ, áreas, usuarios fijos)
 *    para que las referencias entre módulos sean estables aunque se ejecute en orden distinto.
 *  - Fechas relativas a "ahora" para que el seed envejezca con el tiempo.
 */
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcrypt"

export const prisma = new PrismaClient()

export const SEED_NOW = new Date("2026-05-06T10:00:00.000Z")

export function diasAtras(dias: number, base: Date = SEED_NOW): Date {
  return new Date(base.getTime() - dias * 24 * 60 * 60 * 1000)
}

export function horasAtras(horas: number, base: Date = SEED_NOW): Date {
  return new Date(base.getTime() - horas * 60 * 60 * 1000)
}

const UUID_NS = "00000000-0000-4000-8000-"

/**
 * Genera UUID determinista a partir de una clave estable. Útil para anclas
 * (áreas, curso XYZ, usuarios fijos) y mantener referencias entre módulos.
 * El formato cumple v4 (variante 8/9/a/b en el dígito 19) suficiente para Postgres.
 */
export function uuidEstable(clave: string): string {
  let hash = 0
  for (let i = 0; i < clave.length; i++) {
    hash = (hash * 31 + clave.charCodeAt(i)) >>> 0
  }
  const hex = hash.toString(16).padStart(12, "0").slice(0, 12)
  return `${UUID_NS}${hex}`
}

export function uuidAleatorio(): string {
  return randomUUID()
}

export async function hashPassword(plano: string): Promise<string> {
  return bcrypt.hash(plano, 12)
}

/** Reduce dos arrays paralelos a un Record. */
export function indexarPor<T, K extends string>(items: T[], clave: (t: T) => K): Record<K, T> {
  const result = {} as Record<K, T>
  for (const item of items) {
    result[clave(item)] = item
  }
  return result
}

/** Suma redondeada a 2 decimales — útil para validar invariante I7 (suma = 100 ±0.01). */
export function suma2dec(valores: number[]): number {
  return Math.round(valores.reduce((a, b) => a + b, 0) * 100) / 100
}
