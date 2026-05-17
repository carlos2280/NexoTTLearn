import { useReducedMotion } from "framer-motion"

/**
 * Atmosfera ambient del chat de entrevista IA. Aurora drift muy sutil (3-5%
 * opacity) en los bordes del canvas. Casi imperceptible — marca que estas en
 * uno de los 3-5 momentos cumbre del viaje sin gritar.
 *
 * Respeta `prefers-reduced-motion`: si activo, queda estatico (sin drift).
 */
export function AtmosferaAurora() {
  const reducedMotion = useReducedMotion()
  return (
    <div
      aria-hidden={true}
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{
        background:
          "radial-gradient(circle at 15% 20%, rgb(var(--color-aurora-violet-rgb) / 0.05) 0%, transparent 45%), radial-gradient(circle at 85% 80%, rgb(var(--color-aurora-cyan-rgb) / 0.04) 0%, transparent 50%)",
        animation: reducedMotion ? undefined : "nx-aurora-drift 28s ease-in-out infinite",
      }}
    />
  )
}
