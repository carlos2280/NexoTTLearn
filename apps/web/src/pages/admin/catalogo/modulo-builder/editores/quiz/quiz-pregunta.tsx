import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { Textarea } from "@/shared/components/ui/textarea"
import { cn } from "@/shared/lib/cn"
import { Check, ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react"

export interface PreguntaOpcion {
  readonly id: string
  readonly texto: string
  readonly esCorrecta: boolean
}

export interface PreguntaQuiz {
  readonly id: string
  readonly enunciado: string
  readonly opciones: readonly PreguntaOpcion[]
  readonly explicacion?: string
}

interface QuizPreguntaProps {
  readonly pregunta: PreguntaQuiz
  readonly numero: number
  readonly expandida: boolean
  readonly onAlternar: () => void
  readonly onCambiar: (siguiente: PreguntaQuiz) => void
  readonly onEliminar: () => void
}

function nuevoId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 12)
}

export function QuizPregunta({
  pregunta,
  numero,
  expandida,
  onAlternar,
  onCambiar,
  onEliminar,
}: QuizPreguntaProps) {
  const tieneCorrecta = pregunta.opciones.some((o) => o.esCorrecta)
  const sinSuficientesOpciones = pregunta.opciones.length < 2

  function actualizarOpcion(opcionId: string, parcial: Partial<PreguntaOpcion>) {
    onCambiar({
      ...pregunta,
      opciones: pregunta.opciones.map((o) => (o.id === opcionId ? { ...o, ...parcial } : o)),
    })
  }

  function marcarCorrecta(opcionId: string) {
    onCambiar({
      ...pregunta,
      opciones: pregunta.opciones.map((o) => ({
        ...o,
        esCorrecta: o.id === opcionId,
      })),
    })
  }

  function eliminarOpcion(opcionId: string) {
    if (pregunta.opciones.length <= 2) {
      return
    }
    onCambiar({
      ...pregunta,
      opciones: pregunta.opciones.filter((o) => o.id !== opcionId),
    })
  }

  function anadirOpcion() {
    onCambiar({
      ...pregunta,
      opciones: [...pregunta.opciones, { id: nuevoId(), texto: "", esCorrecta: false }],
    })
  }

  return (
    <li className="rounded-lg border border-border bg-surface shadow-xs">
      <button
        type="button"
        onClick={onAlternar}
        className="flex w-full items-center gap-2 rounded-lg px-4 py-3 text-left transition-colors duration-fast ease-default hover:bg-subtle/40"
      >
        <span className="text-text-tertiary">
          {expandida ? (
            <ChevronDown className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
          ) : (
            <ChevronRight className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
          )}
        </span>
        <span className="tabular shrink-0 text-caption text-text-tertiary">{numero}.</span>
        <span className="flex-1 truncate font-medium text-body-sm text-text-primary">
          {pregunta.enunciado || <span className="text-text-tertiary">Sin enunciado</span>}
        </span>
        {!tieneCorrecta || sinSuficientesOpciones ? (
          <span className="inline-flex items-center rounded-pill bg-warning-soft px-2 py-0.5 text-caption text-warning-on-soft">
            Pendiente
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-pill bg-success-soft px-2 py-0.5 text-caption text-success-on-soft">
            <Check className="h-3 w-3" strokeWidth={1.5} aria-hidden={true} />
            Lista
          </span>
        )}
      </button>

      {expandida ? (
        <div className="flex flex-col gap-4 border-border border-t px-4 py-4">
          <Textarea
            value={pregunta.enunciado}
            onChange={(e) => onCambiar({ ...pregunta, enunciado: e.target.value })}
            placeholder="Escribe la pregunta…"
            rows={2}
          />

          <div className="flex flex-col gap-2">
            <span className="nx-eyebrow text-text-tertiary">Opciones</span>
            <ul className="flex flex-col gap-2">
              {pregunta.opciones.map((o) => (
                <li key={o.id} className="flex items-center gap-2">
                  <label
                    aria-label={o.esCorrecta ? "Marcada correcta" : "Marcar como correcta"}
                    className={cn(
                      "flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full border transition-colors",
                      o.esCorrecta
                        ? "border-success bg-success-soft text-success-on-soft"
                        : "border-border-strong text-text-tertiary hover:border-accent",
                    )}
                  >
                    <input
                      type="radio"
                      name={`pregunta-${pregunta.id}`}
                      checked={o.esCorrecta}
                      onChange={() => marcarCorrecta(o.id)}
                      className="sr-only"
                    />
                    {o.esCorrecta ? (
                      <Check className="h-4 w-4" strokeWidth={2} aria-hidden={true} />
                    ) : null}
                  </label>
                  <Input
                    value={o.texto}
                    onChange={(e) => actualizarOpcion(o.id, { texto: e.target.value })}
                    placeholder={`Opción ${pregunta.opciones.indexOf(o) + 1}`}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Eliminar opción"
                    disabled={pregunta.opciones.length <= 2}
                    onClick={() => eliminarOpcion(o.id)}
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
                  </Button>
                </li>
              ))}
            </ul>
            <Button variant="ghost" size="sm" onClick={anadirOpcion}>
              <Plus className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
              Añadir opción
            </Button>
          </div>

          <Textarea
            value={pregunta.explicacion ?? ""}
            onChange={(e) => onCambiar({ ...pregunta, explicacion: e.target.value })}
            rows={2}
            placeholder="Explicación al aprobar (opcional). Se muestra cuando el participante responde correctamente."
          />

          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={onEliminar}
              className="text-danger-on-soft hover:bg-danger-soft"
            >
              <Trash2 className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
              Eliminar pregunta
            </Button>
          </div>
        </div>
      ) : null}
    </li>
  )
}

export function preguntaVacia(): PreguntaQuiz {
  return {
    id: nuevoId(),
    enunciado: "",
    opciones: [
      { id: nuevoId(), texto: "", esCorrecta: false },
      { id: nuevoId(), texto: "", esCorrecta: false },
    ],
    explicacion: "",
  }
}
