import { cn } from "@/shared/lib/cn"
import { ChevronRight } from "lucide-react"

interface EtapaFunnel {
  readonly key: string
  readonly etiqueta: string
  readonly valor: number
  readonly tono?: "neutral" | "accent" | "aurora" | "success" | "danger"
}

interface FunnelRutaColaboradorProps {
  readonly etapas: readonly EtapaFunnel[]
  readonly className?: string
}

/**
 * Funnel horizontal de la "ruta del colaborador". Composición CSS pura.
 *
 * Visualmente: barras horizontales decrecientes con porcentaje absoluto y
 * porcentaje de conversión vs etapa anterior. Sin gradients aurora salvo en
 * la etapa final (recompensa). Sigue identidad: calma editorial, sólo el
 * "premio" lleva aurora.
 */
export function FunnelRutaColaborador({ etapas, className }: FunnelRutaColaboradorProps) {
  const base = etapas[0]?.valor ?? 0
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <ol className="flex flex-col gap-2">
        {etapas.map((etapa, i) => (
          <EtapaFila
            key={etapa.key}
            etapa={etapa}
            previa={i === 0 ? null : (etapas[i - 1] ?? null)}
            base={base}
          />
        ))}
      </ol>
    </div>
  )
}

interface EtapaFilaProps {
  readonly etapa: EtapaFunnel
  readonly previa: EtapaFunnel | null
  readonly base: number
}

function EtapaFila({ etapa, previa, base }: EtapaFilaProps) {
  const pctTotal = base > 0 ? Math.round((etapa.valor / base) * 100) : 0
  const pctConv = previa && previa.valor > 0 ? Math.round((etapa.valor / previa.valor) * 100) : null
  const tono = etapa.tono ?? "neutral"

  return (
    <li className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-3">
        <span className="text-body-sm text-text-secondary">{etapa.etiqueta}</span>
        <div className="flex items-baseline gap-3">
          <span className="tabular font-medium font-mono text-h3 text-text-primary leading-none">
            {etapa.valor.toLocaleString("es-ES")}
          </span>
          <span className="tabular w-12 text-right font-mono text-caption text-text-tertiary">
            {pctTotal}%
          </span>
        </div>
      </div>
      <div className="relative h-2.5 w-full overflow-hidden rounded-pill bg-subtle">
        <div
          className={cn(
            "h-full rounded-pill transition-[width] duration-base ease-default",
            claseTono(tono),
          )}
          style={{
            width: `${pctTotal}%`,
            ...(tono === "aurora" ? { background: "var(--gradient-aurora)" } : {}),
          }}
          aria-hidden={true}
        />
      </div>
      {pctConv !== null && previa ? (
        <div className="flex items-center gap-1 text-caption text-text-tertiary">
          <ChevronRight className="h-3 w-3" aria-hidden={true} />
          <span>
            <span className="tabular font-medium font-mono text-text-secondary">{pctConv}%</span>{" "}
            pasa desde {previa.etiqueta.toLowerCase()}
          </span>
        </div>
      ) : null}
    </li>
  )
}

function claseTono(tono: NonNullable<EtapaFunnel["tono"]>): string {
  switch (tono) {
    case "accent":
      return "bg-accent"
    case "success":
      return "bg-success"
    case "danger":
      return "bg-danger"
    case "aurora":
      return ""
    default:
      return "bg-border-emphasis"
  }
}
