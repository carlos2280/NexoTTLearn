import { Button } from "@/shared/components/ui/button"
import { CheckCircle2, ChevronDown } from "lucide-react"

interface BloqueEvaluableColapsadoProps {
  readonly titulo: string
  readonly onExpandir: () => void
}

/**
 * Vista compacta para bloques evaluables ya aprobados. Solo render — la
 * decision de colapsar y la expansion al reintentar las maneja el wrapper
 * `EvaluableConColapso`.
 *
 * Implementa la ley 07 del manifiesto ("cumplido se desvanece"): el bloque
 * que el participante ya domino deja de competir por su atencion en
 * secciones largas. Sin esto, una seccion con 10 quizzes aprobados
 * grita 10 veces lo mismo.
 */
export function BloqueEvaluableColapsado({ titulo, onExpandir }: BloqueEvaluableColapsadoProps) {
  return (
    <article className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-subtle px-5 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <CheckCircle2
          className="h-4 w-4 shrink-0 text-success"
          strokeWidth={1.5}
          aria-hidden={true}
        />
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-body-sm text-text-primary">{titulo}</span>
          <span className="text-caption text-text-tertiary">
            Aprobado · Tu mejor intento cuenta.
          </span>
        </div>
      </div>
      <Button variant="ghost" size="sm" onClick={onExpandir}>
        Reintentar
        <ChevronDown className="ml-1 h-3.5 w-3.5" strokeWidth={1.5} aria-hidden={true} />
      </Button>
    </article>
  )
}
