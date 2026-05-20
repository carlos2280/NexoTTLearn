import { cn } from "@/shared/lib/cn"
import type { CoberturaAreaItem } from "@nexott-learn/shared-types"
import { AlertTriangle, ArrowUpRight } from "lucide-react"

interface TarjetaAreaProps {
  readonly area: CoberturaAreaItem
  readonly esPeorBrecha: boolean
  readonly esMejorCobertura: boolean
}

const SEGMENTOS: ReadonlyArray<{
  readonly key: keyof CoberturaAreaItem["conteoNiveles"]
  readonly etiqueta: string
  readonly color: string
}> = [
  { key: "excelencia", etiqueta: "excel", color: "rgb(var(--color-success-rgb) / 0.85)" },
  { key: "solido", etiqueta: "sólido", color: "rgb(var(--color-success-rgb) / 0.5)" },
  { key: "enDesarrollo", etiqueta: "enDes", color: "rgb(var(--color-warning-rgb) / 0.55)" },
  { key: "inicial", etiqueta: "inicial", color: "rgb(var(--color-danger-rgb) / 0.6)" },
  { key: "sinTocar", etiqueta: "s/tocar", color: "var(--color-muted)" },
]

/**
 * Tarjeta de un area en la vista ejecutiva global. Lectura en 3 segundos:
 * salud (icono + brecha), promedio vs benchmark, reparto por nivel.
 *
 * Si es la peor brecha, lleva borde izquierdo aurora-violet (1 sola tarjeta
 * destacada por pantalla — regla de identidad).
 */
export function TarjetaArea({ area, esPeorBrecha, esMejorCobertura }: TarjetaAreaProps) {
  const promedio = area.promedio
  const benchmark = area.benchmark
  const brecha = area.brecha
  const bajoBenchmark = brecha !== null && brecha < 0
  const headcountConDatos =
    area.conteoNiveles.excelencia +
    area.conteoNiveles.solido +
    area.conteoNiveles.enDesarrollo +
    area.conteoNiveles.inicial
  const totalCohorte = headcountConDatos + area.conteoNiveles.sinTocar

  return (
    <article
      className={cn(
        "relative flex flex-col gap-4 rounded-2xl border bg-surface p-5",
        "transition-[border-color,box-shadow] duration-base ease-default",
        "hover:border-border-strong hover:shadow-sm",
        esPeorBrecha ? "border-l-2 border-l-aurora-violet" : "border-border",
      )}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-body-lg text-text-primary">{area.nombre}</h3>
            {bajoBenchmark ? (
              <AlertTriangle className="h-3.5 w-3.5 text-warning" aria-label="Bajo benchmark" />
            ) : null}
            {esMejorCobertura ? (
              <ArrowUpRight className="h-3.5 w-3.5 text-success" aria-label="Mejor cobertura" />
            ) : null}
          </div>
          <p className="text-caption text-text-tertiary">
            <span className="tabular font-medium font-mono text-text-secondary">
              {totalCohorte}
            </span>{" "}
            colaboradores · {headcountConDatos} con datos
          </p>
        </div>
        <PromedioValue promedio={promedio} brecha={brecha} bajoBenchmark={bajoBenchmark} />
      </header>

      <BulletBar promedio={promedio} benchmark={benchmark} />

      <ConteoNiveles conteo={area.conteoNiveles} />
    </article>
  )
}

interface PromedioValueProps {
  readonly promedio: number | null
  readonly brecha: number | null
  readonly bajoBenchmark: boolean
}

function PromedioValue({ promedio, brecha, bajoBenchmark }: PromedioValueProps) {
  if (promedio === null) {
    return <span className="text-caption text-text-tertiary">sin datos</span>
  }
  return (
    <div className="flex flex-col items-end">
      <span className="tabular font-medium font-mono text-h2 text-text-primary leading-none">
        {Math.round(promedio)}
      </span>
      {brecha !== null ? (
        <span
          className={cn(
            "tabular mt-1 font-mono text-[10px]",
            bajoBenchmark ? "text-danger" : "text-success",
          )}
        >
          {brecha > 0 ? "+" : ""}
          {Math.round(brecha)} vs benchmark
        </span>
      ) : null}
    </div>
  )
}

interface BulletBarProps {
  readonly promedio: number | null
  readonly benchmark: number
}

function BulletBar({ promedio, benchmark }: BulletBarProps) {
  const pct = promedio === null ? 0 : Math.min(100, Math.max(0, promedio))
  const pctBenchmark = Math.min(100, Math.max(0, benchmark))

  return (
    <div className="relative h-2.5 w-full overflow-hidden rounded-pill bg-subtle">
      {/* Barra de promedio */}
      {promedio !== null ? (
        <div
          className={cn(
            "h-full rounded-pill transition-[width] duration-base ease-default",
            promedio >= benchmark ? "bg-success" : "bg-warning",
          )}
          style={{ width: `${pct}%` }}
          aria-hidden={true}
        />
      ) : null}
      {/* Marca de benchmark */}
      <div
        className="absolute top-0 h-full w-[2px] bg-text-primary"
        style={{ left: `calc(${pctBenchmark}% - 1px)` }}
        aria-label={`Benchmark ${benchmark}`}
      />
    </div>
  )
}

interface ConteoNivelesProps {
  readonly conteo: CoberturaAreaItem["conteoNiveles"]
}

function ConteoNiveles({ conteo }: ConteoNivelesProps) {
  return (
    <ul className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {SEGMENTOS.map((seg) => {
        const valor = conteo[seg.key]
        if (valor === 0) {
          return null
        }
        return (
          <li key={seg.key} className="flex items-center gap-1.5 text-caption">
            <span
              className="h-2 w-2.5 rounded-sm"
              style={{ background: seg.color }}
              aria-hidden={true}
            />
            <span className="text-text-secondary">{seg.etiqueta}</span>
            <span className="tabular font-medium font-mono text-text-primary">{valor}</span>
          </li>
        )
      })}
    </ul>
  )
}
