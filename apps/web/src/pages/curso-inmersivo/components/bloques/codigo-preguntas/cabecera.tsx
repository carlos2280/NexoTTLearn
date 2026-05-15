import { cn } from "@/shared/lib/cn"
import { Code2 } from "lucide-react"

interface CabeceraProps {
  readonly mejorNota: number | null
  readonly lenguaje: string
  readonly notaAprobado: number
}

export function Cabecera({ mejorNota, lenguaje, notaAprobado }: CabeceraProps) {
  const aprobado = (mejorNota ?? -1) >= notaAprobado
  return (
    <header className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-2">
        <Code2 className="h-4 w-4 text-aurora-violet" aria-hidden={true} />
        <span className="nx-eyebrow text-aurora-violet">Reto de código · {lenguaje}</span>
      </div>
      {mejorNota !== null ? (
        <div
          className={cn(
            "flex items-center gap-2 rounded-pill border px-3 py-1",
            aprobado
              ? "border-success/40 bg-success-soft text-success-on-soft"
              : "border-border bg-subtle text-text-secondary",
          )}
        >
          <span className="font-mono text-caption tracking-wider">Mejor intento</span>
          <span className="tabular font-mono font-semibold text-body-sm">
            {mejorNota.toFixed(0)}
          </span>
        </div>
      ) : null}
    </header>
  )
}
