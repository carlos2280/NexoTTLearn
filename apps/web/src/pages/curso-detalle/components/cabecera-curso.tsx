import { type TonoDeadline, formatearDeadline } from "@/features/me/lib/deadline-curso"
import { etiquetaEstadoAsignacion } from "@/features/me/lib/etiqueta-asignacion"
import { Badge } from "@/shared/components/ui/badge"
import { cn } from "@/shared/lib/cn"
import type { MeCursoResumen } from "@nexott-learn/shared-types"

interface CabeceraCursoProps {
  readonly titulo: string
  readonly asignacion: MeCursoResumen
  readonly porcentajeAvance: number
  readonly transversalDisponible: boolean | undefined
  readonly entrevistaIaDisponible: boolean | undefined
  readonly muestraTransversal: boolean
  readonly muestraEntrevistaIa: boolean
}

const CLASES_DEADLINE: Record<TonoDeadline, string> = {
  lejos: "text-text-tertiary",
  cercano: "text-warmth",
  vencido: "text-danger",
}

export function CabeceraCurso({
  titulo,
  asignacion,
  porcentajeAvance,
  transversalDisponible,
  entrevistaIaDisponible,
  muestraTransversal,
  muestraEntrevistaIa,
}: CabeceraCursoProps) {
  const deadline = formatearDeadline(asignacion.fechaDeadline)
  const esVoluntario = asignacion.rol === "VOLUNTARIO"
  const estadoTexto = etiquetaEstadoAsignacion(asignacion)
  const muestraBadgesEval = muestraTransversal || muestraEntrevistaIa

  return (
    <header className="sticky top-0 z-raised flex flex-col gap-2 border-border border-b bg-surface px-1 py-4 backdrop-blur">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="truncate text-h2 text-text-primary">{titulo}</h1>
        <Badge tono={esVoluntario ? "contorno" : "acento"}>
          {esVoluntario ? "Voluntario" : "Asignado"}
        </Badge>
        <span className="text-body-sm text-text-secondary">{estadoTexto}</span>
        <span className="tabular text-body-sm text-text-secondary">· {porcentajeAvance}%</span>
        <span className={cn("text-body-sm", CLASES_DEADLINE[deadline.tono])}>
          · Deadline {deadline.textoFecha} ({deadline.textoRelativo})
        </span>
      </div>
      {muestraBadgesEval ? (
        <BadgesEvaluacion
          muestraTransversal={muestraTransversal}
          muestraEntrevistaIa={muestraEntrevistaIa}
          transversalDisponible={transversalDisponible}
          entrevistaIaDisponible={entrevistaIaDisponible}
        />
      ) : null}
    </header>
  )
}

interface BadgesEvaluacionProps {
  readonly muestraTransversal: boolean
  readonly muestraEntrevistaIa: boolean
  readonly transversalDisponible: boolean | undefined
  readonly entrevistaIaDisponible: boolean | undefined
}

function BadgesEvaluacion({
  muestraTransversal,
  muestraEntrevistaIa,
  transversalDisponible,
  entrevistaIaDisponible,
}: BadgesEvaluacionProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 text-caption text-text-tertiary">
      {muestraTransversal ? (
        <span className="flex items-center gap-1.5">
          Transversal
          <Badge tono={transversalDisponible ? "success" : "contorno"}>
            {transversalDisponible ? "disponible" : "bloqueado"}
          </Badge>
        </span>
      ) : null}
      {muestraEntrevistaIa ? (
        <span className="flex items-center gap-1.5">
          Entrevista IA
          <Badge tono={entrevistaIaDisponible ? "success" : "contorno"}>
            {entrevistaIaDisponible ? "disponible" : "bloqueado"}
          </Badge>
        </span>
      ) : null}
    </div>
  )
}
