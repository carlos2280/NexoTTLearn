import { Card } from "@/shared/components/ui/card"
import type { LucideIcon } from "lucide-react"

export interface RankingItem {
  readonly id: string
  readonly nombre: string
  /** Cuántas veces se reutilizó (vecesUsado en módulos, vecesExigida en skills). */
  readonly vecesUsado: number
  /** En cuántos cursos únicos aparece. */
  readonly cursosUnicos: number
}

interface ReutilizacionRankingProps {
  readonly eyebrow: string
  readonly titulo: string
  readonly descripcion: string
  readonly etiquetaMetricaPrincipal: string
  readonly icono: LucideIcon
  readonly items: readonly RankingItem[]
  readonly vacioMensaje: string
}

export function ReutilizacionRanking({
  eyebrow,
  titulo,
  descripcion,
  etiquetaMetricaPrincipal,
  icono: Icono,
  items,
  vacioMensaje,
}: ReutilizacionRankingProps) {
  if (items.length === 0) {
    return (
      <Card tono="plano" densidad="generosa" className="flex h-full flex-col gap-5">
        <CabeceraRanking
          eyebrow={eyebrow}
          titulo={titulo}
          descripcion={descripcion}
          icono={Icono}
        />
        <p className="text-body-sm text-text-secondary">{vacioMensaje}</p>
      </Card>
    )
  }

  const ordenados = [...items].sort((a, b) => b.vecesUsado - a.vecesUsado)
  const maxVeces = ordenados[0]?.vecesUsado ?? 0

  return (
    <Card tono="plano" densidad="generosa" className="flex h-full flex-col gap-5">
      <CabeceraRanking eyebrow={eyebrow} titulo={titulo} descripcion={descripcion} icono={Icono} />

      <ol className="flex flex-col gap-2">
        {ordenados.map((item, i) => (
          <FilaRanking
            key={item.id}
            posicion={i + 1}
            item={item}
            maxVeces={maxVeces}
            etiquetaMetricaPrincipal={etiquetaMetricaPrincipal}
          />
        ))}
      </ol>
    </Card>
  )
}

interface CabeceraRankingProps {
  readonly eyebrow: string
  readonly titulo: string
  readonly descripcion: string
  readonly icono: LucideIcon
}

function CabeceraRanking({ eyebrow, titulo, descripcion, icono: Icono }: CabeceraRankingProps) {
  return (
    <header className="flex items-start gap-3">
      <span
        aria-hidden={true}
        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-subtle text-text-secondary"
      >
        <Icono className="h-[16px] w-[16px]" />
      </span>
      <div className="flex flex-col gap-0.5">
        <span className="nx-eyebrow text-text-tertiary">{eyebrow}</span>
        <h2 className="text-h3 text-text-primary">{titulo}</h2>
        <p className="text-body-sm text-text-secondary">{descripcion}</p>
      </div>
    </header>
  )
}

interface FilaRankingProps {
  readonly posicion: number
  readonly item: RankingItem
  readonly maxVeces: number
  readonly etiquetaMetricaPrincipal: string
}

function FilaRanking({ posicion, item, maxVeces, etiquetaMetricaPrincipal }: FilaRankingProps) {
  const peso = maxVeces > 0 ? item.vecesUsado / maxVeces : 0
  const pctBarra = Math.round(peso * 100)

  return (
    <li className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2.5">
      <span className="tabular w-6 shrink-0 font-mono text-caption text-text-tertiary">
        {String(posicion).padStart(2, "0")}
      </span>

      <div className="flex flex-1 flex-col gap-1.5">
        <span className="font-medium text-body-sm text-text-primary">{item.nombre}</span>
        <div
          className="h-1 w-full overflow-hidden rounded-pill bg-subtle"
          role="img"
          aria-label={`${item.vecesUsado} ${etiquetaMetricaPrincipal}`}
        >
          <div
            className="h-full rounded-pill bg-accent/50"
            style={{ width: `${pctBarra}%` }}
            aria-hidden={true}
          />
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <span className="tabular font-medium font-mono text-body-sm text-text-primary">
          {item.vecesUsado}
        </span>
        <span className="text-caption text-text-tertiary">
          {item.cursosUnicos} {item.cursosUnicos === 1 ? "curso" : "cursos"}
        </span>
      </div>
    </li>
  )
}
