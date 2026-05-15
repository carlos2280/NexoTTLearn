import { Card } from "@/shared/components/ui/card"
import { EASE } from "@/shared/lib/motion"
import { motion, useReducedMotion } from "framer-motion"
import type { ResumenCursoKpis } from "../lib/resumen-curso.builder"

interface CursoResumenDistribucionProps {
  readonly kpis: ResumenCursoKpis
}

interface Tramo {
  readonly id: string
  readonly etiqueta: string
  readonly valor: number
  readonly color: string
}

function porcentaje(valor: number, total: number): number {
  if (total === 0) {
    return 0
  }
  return Math.round((valor / total) * 100)
}

function construirTramos(kpis: ResumenCursoKpis): readonly Tramo[] {
  return [
    {
      id: "activos",
      etiqueta: "En curso",
      valor: kpis.activos,
      color: "var(--color-state-progreso)",
    },
    {
      id: "listo",
      etiqueta: "Listo · esperando veredicto",
      valor: kpis.listo,
      color: "var(--color-state-en-desarrollo)",
    },
    {
      id: "aptos",
      etiqueta: "Apto / Completado",
      valor: kpis.aptos,
      color: "var(--color-state-apto)",
    },
    {
      id: "no-aptos",
      etiqueta: "No apto",
      valor: kpis.noAptos,
      color: "var(--color-state-no-apto)",
    },
    {
      id: "retirados",
      etiqueta: "Retirado",
      valor: kpis.retirados,
      color: "var(--color-state-pendiente)",
    },
  ]
}

export function CursoResumenDistribucion({ kpis }: CursoResumenDistribucionProps) {
  const total = kpis.total
  const tramos = construirTramos(kpis).filter((t) => t.valor > 0)

  return (
    <Card tono="plano" className="flex flex-col gap-5">
      <header className="flex items-center justify-between">
        <h3 className="text-h3 text-text-primary">Distribución por estado</h3>
        <span className="tabular text-caption text-text-tertiary">{total} asignación(es)</span>
      </header>

      {total === 0 ? (
        <p className="text-body-sm text-text-tertiary">Aún no hay asignaciones en este curso.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {tramos.map((t, i) => (
            <FilaTramo key={t.id} tramo={t} total={total} indice={i} />
          ))}
        </ul>
      )}
    </Card>
  )
}

interface FilaTramoProps {
  readonly tramo: Tramo
  readonly total: number
  readonly indice: number
}

function FilaTramo({ tramo, total, indice }: FilaTramoProps) {
  const reduceMotion = useReducedMotion()
  const pct = porcentaje(tramo.valor, total)
  const delay = reduceMotion ? 0 : 0.1 + indice * 0.08

  return (
    <li className="flex flex-col gap-2">
      <div className="flex items-baseline gap-2 text-body-sm">
        <span className="flex-1 text-text-primary">{tramo.etiqueta}</span>
        <span className="tabular text-text-tertiary">
          <span className="text-text-primary">{tramo.valor}</span>
          <span className="mx-1.5 text-text-disabled">·</span>
          {pct}%
        </span>
      </div>
      <div className="relative h-1 w-full overflow-hidden rounded-pill bg-subtle">
        <motion.div
          initial={reduceMotion ? { width: `${pct}%` } : { width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: reduceMotion ? 0 : 0.6, delay, ease: EASE.default }}
          className="absolute inset-y-0 left-0 rounded-pill"
          style={{ background: tramo.color }}
        />
      </div>
    </li>
  )
}
