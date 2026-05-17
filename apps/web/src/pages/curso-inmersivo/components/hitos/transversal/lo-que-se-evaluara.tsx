import type { TransversalResponse } from "@nexott-learn/shared-types"

interface LoQueSeEvaluaraProps {
  readonly capasActivas: TransversalResponse["capasActivas"]
}

interface CapaItem {
  readonly clave: keyof TransversalResponse["capasActivas"]
  readonly titulo: string
  readonly descripcion: string
}

/**
 * Texto fijo del sistema para describir las 3 capas (no del admin — decision
 * 2026-05-15 spec 05). Solo se renderizan las capas activas del transversal.
 */
const CAPAS: readonly CapaItem[] = [
  {
    clave: "tests",
    titulo: "Tests automaticos",
    descripcion: "Verificacion funcional de tu solucion.",
  },
  {
    clave: "cualitativa",
    titulo: "Calidad del codigo",
    descripcion: "Evaluacion cualitativa de buenas practicas.",
  },
  {
    clave: "comprension",
    titulo: "Comprension",
    descripcion: "Conversacion corta sobre tu solucion.",
  },
]

export function LoQueSeEvaluara({ capasActivas }: LoQueSeEvaluaraProps) {
  const activas = CAPAS.filter((capa) => capasActivas[capa.clave])
  if (activas.length === 0) {
    return null
  }
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6">
      <h3 className="nx-eyebrow text-text-tertiary">Lo que se evaluara</h3>
      <ul className="flex flex-col gap-4">
        {activas.map((capa) => (
          <li key={capa.clave} className="flex items-start gap-3">
            <span
              aria-hidden={true}
              className="mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-pill bg-aurora-violet"
            />
            <div className="flex flex-col gap-0.5">
              <p className="font-medium text-body text-text-primary">{capa.titulo}</p>
              <p className="text-body-sm text-text-secondary">{capa.descripcion}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
