/**
 * Tokens de movimiento para Framer Motion.
 *
 * Reflejan los `--ease-*` y `--duration-*` definidos en `styles/globals.css`.
 * Framer no consume custom properties CSS, así que necesitamos los mismos
 * valores como números/tuplas. Mantenerlos sincronizados aquí evita que
 * los componentes hardcodeen `[0.16, 1, 0.3, 1]` o `duration: 0.9`.
 */

type Cubic = [number, number, number, number]

export const EASE = {
  default: [0.16, 1, 0.3, 1] as Cubic,
  emphasized: [0.16, 1, 0.3, 1] as Cubic,
  decel: [0, 0, 0.2, 1] as Cubic,
  accel: [0.4, 0, 1, 1] as Cubic,
  anticipate: [0.68, -0.55, 0.32, 1.55] as Cubic,
} as const

/** Duraciones en segundos (Framer trabaja en s, CSS en ms). */
export const DUR = {
  instant: 0.08,
  fast: 0.12,
  base: 0.18,
  slow: 0.22,
  page: 0.32,
  storytelling: 0.6,
  cinematic: 0.9,
} as const
