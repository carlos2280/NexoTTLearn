import type { TransversalResponse } from "@nexott-learn/shared-types"

type CapaVisible = "tests" | "cualitativa"

interface LoQueSeEvaluaraProps {
  readonly capasActivas: TransversalResponse["capasActivas"]
}

interface CapaItem {
  readonly clave: CapaVisible
  readonly titulo: string
  readonly descripcion: string
}

/**
 * Texto fijo del sistema para describir las capas que el participante VE
 * (no del admin — decision 2026-05-15 spec 05).
 *
 * NOTA producto (2026-05-16): la capa `comprension` del modelo NO se expone
 * al participante. El transversal evalua codigo (tests + calidad). La
 * conversacion del cierre vive en la Entrevista IA (pantalla 06) cuando el
 * curso la tiene configurada; si no, el transversal aprobado cierra solo.
 */
const CAPAS: readonly CapaItem[] = [
  {
    clave: "tests",
    titulo: "Tests",
    descripcion: "Verificacion funcional de tu solucion.",
  },
  {
    clave: "cualitativa",
    titulo: "Calidad del codigo",
    descripcion: "Evaluacion cualitativa de buenas practicas.",
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
