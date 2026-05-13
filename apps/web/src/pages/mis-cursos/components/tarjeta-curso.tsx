import { type TonoDeadline, formatearDeadline } from "@/features/me/lib/deadline-curso"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import { RUTAS } from "@/shared/constants/rutas"
import { cn } from "@/shared/lib/cn"
import type { EstadoAsignado, EstadoVoluntario, MeCursoResumen } from "@nexott-learn/shared-types"
import { useNavigate } from "react-router-dom"

interface TarjetaCursoProps {
  readonly curso: MeCursoResumen
}

const CLASES_DEADLINE: Record<TonoDeadline, string> = {
  lejos: "text-text-tertiary",
  cercano: "text-warmth",
  vencido: "text-danger",
}

const ETIQUETA_ESTADO_ASIGNADO: ReadonlyMap<EstadoAsignado, string> = new Map([
  ["ASIGNADO", "Asignado"],
  ["EN_PROGRESO", "En progreso"],
  ["LISTO", "Listo"],
  ["APTO", "Apto"],
  ["NO_APTO", "No apto"],
  ["RETIRADO", "Retirado"],
])

const ETIQUETA_ESTADO_VOLUNTARIO: ReadonlyMap<EstadoVoluntario, string> = new Map([
  ["INSCRITO", "Inscrito"],
  ["EN_PROGRESO", "En progreso"],
  ["LISTO", "Listo"],
  ["COMPLETADO", "Completado"],
  ["RETIRADO", "Retirado"],
])

export function TarjetaCurso({ curso }: TarjetaCursoProps) {
  const navigate = useNavigate()
  const deadline = formatearDeadline(curso.fechaDeadline)
  const esVoluntario = curso.rol === "VOLUNTARIO"
  const estadoTexto =
    (esVoluntario
      ? curso.estadoVoluntario && ETIQUETA_ESTADO_VOLUNTARIO.get(curso.estadoVoluntario)
      : curso.estadoAsignado && ETIQUETA_ESTADO_ASIGNADO.get(curso.estadoAsignado)) ?? "—"

  return (
    <article className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h3 className="truncate text-h3 text-text-primary">{curso.cursoTitulo}</h3>
          <div className="flex items-center gap-2">
            <Badge tono={esVoluntario ? "contorno" : "acento"}>
              {esVoluntario ? "Voluntario" : "Asignado"}
            </Badge>
            <span className="text-caption text-text-secondary">{estadoTexto}</span>
          </div>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate(RUTAS.participante.cursoDetalle(curso.cursoId))}
          aria-label={`Continuar con ${curso.cursoTitulo}`}
        >
          Continuar
        </Button>
      </header>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <span className="text-caption text-text-tertiary">Avance</span>
          <span className="tabular text-caption text-text-secondary">
            {curso.porcentajeAvance}%
          </span>
        </div>
        <div aria-hidden={true} className="h-1.5 w-full overflow-hidden rounded-pill bg-subtle">
          <div
            className="h-full rounded-pill bg-accent"
            style={{ width: `${curso.porcentajeAvance}%` }}
          />
        </div>
      </div>
      <footer className={cn("text-caption", CLASES_DEADLINE[deadline.tono])}>
        {esVoluntario && deadline.tono === "lejos"
          ? "Sin deadline · ritmo libre"
          : `Deadline ${deadline.textoFecha} · ${deadline.textoRelativo}`}
      </footer>
    </article>
  )
}
