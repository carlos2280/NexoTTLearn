import type { CursoDetalle } from "@nexott-learn/shared-types"
import { Settings } from "lucide-react"

interface ConfigParametrosProps {
  readonly curso: CursoDetalle
}

interface Parametro {
  readonly id: string
  readonly etiqueta: string
  readonly valor: string
  readonly descripcion: string
}

function construirParametros(curso: CursoDetalle): readonly Parametro[] {
  return [
    {
      id: "voluntarios",
      etiqueta: "Voluntarios habilitados",
      valor: curso.toggleVoluntarios ? "Sí" : "No",
      descripcion: curso.toggleVoluntarios
        ? "Cualquier colaborador puede inscribirse al curso por su cuenta."
        : "Solo los asignados explícitamente pueden cursarlo.",
    },
    {
      id: "cierre-auto",
      etiqueta: "Cierre automático",
      valor: curso.toggleCierreAutomatico ? "Sí" : "No",
      descripcion: curso.toggleCierreAutomatico
        ? "El curso cierra automáticamente al alcanzar el deadline."
        : "El cierre requiere acción manual del administrador.",
    },
    {
      id: "desbloqueo",
      etiqueta: "Desbloqueo de contenidos",
      valor: curso.desbloqueo === "SIEMPRE" ? "Siempre" : "Secuencial",
      descripcion:
        curso.desbloqueo === "SIEMPRE"
          ? "Todos los módulos están disponibles desde el inicio."
          : "Los módulos se desbloquean conforme el participante avanza.",
    },
  ]
}

export function ConfigParametros({ curso }: ConfigParametrosProps) {
  const params = construirParametros(curso)
  return (
    <section className="flex flex-col gap-5 rounded-lg border border-border bg-surface p-5">
      <header className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent-on-soft">
          <Settings className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
        </div>
        <div className="flex flex-col">
          <h2 className="text-h3 text-text-primary">Parámetros del curso</h2>
          <p className="text-body-sm text-text-secondary">
            Comportamiento básico del curso. La edición se habilitará en una próxima iteración.
          </p>
        </div>
      </header>
      <dl className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {params.map((p) => (
          <div key={p.id} className="flex flex-col gap-1.5">
            <dt className="nx-eyebrow text-text-tertiary">{p.etiqueta}</dt>
            <dd className="text-h3 text-text-primary">{p.valor}</dd>
            <p className="text-caption text-text-tertiary leading-relaxed">{p.descripcion}</p>
          </div>
        ))}
      </dl>
    </section>
  )
}
