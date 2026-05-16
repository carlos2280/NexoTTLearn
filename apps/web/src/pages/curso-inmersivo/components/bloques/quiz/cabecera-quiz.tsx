import { cn } from "@/shared/lib/cn"
import { Sparkles } from "lucide-react"

interface CabeceraQuizProps {
  readonly notaMinima: number
  readonly totalPreguntas: number
  readonly mejorNota: number | null
  readonly aprobado: boolean
}

export function CabeceraQuiz({
  notaMinima,
  totalPreguntas,
  mejorNota,
  aprobado,
}: CabeceraQuizProps) {
  return (
    <header className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-aurora-violet" aria-hidden={true} />
        <span className="nx-eyebrow text-aurora-violet">
          Quiz · {totalPreguntas} pregunta{totalPreguntas === 1 ? "" : "s"}
        </span>
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
          <span className="text-caption">/ {notaMinima.toFixed(0)}</span>
        </div>
      ) : null}
    </header>
  )
}
