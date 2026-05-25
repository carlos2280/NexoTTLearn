import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { cn } from "@/shared/lib/cn"
import { Check, Plus, Trash2 } from "lucide-react"
import type { KeyboardEvent } from "react"
import { type PreguntaOpcion, type PreguntaOpcionMultiple, nuevoId } from "../quiz-tipos"

interface CuerpoOpcionMultipleProps {
  readonly pregunta: PreguntaOpcionMultiple
  readonly onCambiar: (siguiente: PreguntaOpcionMultiple) => void
}

const MAX_OPCIONES = 6

export function CuerpoOpcionMultiple({ pregunta, onCambiar }: CuerpoOpcionMultipleProps) {
  const haxMaximas = pregunta.opciones.length >= MAX_OPCIONES
  const totalCorrectas = pregunta.opciones.filter((o) => o.esCorrecta).length

  function actualizarOpcion(opcionId: string, parcial: Partial<PreguntaOpcion>) {
    onCambiar({
      ...pregunta,
      opciones: pregunta.opciones.map((o) => (o.id === opcionId ? { ...o, ...parcial } : o)),
    })
  }

  function alternarCorrecta(opcionId: string) {
    onCambiar({
      ...pregunta,
      opciones: pregunta.opciones.map((o) =>
        o.id === opcionId ? { ...o, esCorrecta: !o.esCorrecta } : o,
      ),
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
    if (haxMaximas) {
      return
    }
    onCambiar({
      ...pregunta,
      opciones: [...pregunta.opciones, { id: nuevoId(), texto: "", esCorrecta: false }],
    })
  }

  function alPulsarEnterEnOpcion(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      anadirOpcion()
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="nx-eyebrow text-text-tertiary">
            Opciones · {totalCorrectas} correctas
          </span>
          <span className="tabular text-caption text-text-tertiary">
            {pregunta.opciones.length}/{MAX_OPCIONES}
          </span>
        </div>
        <ul className="flex flex-col gap-2">
          {pregunta.opciones.map((o, idx) => (
            <li key={o.id} className="flex items-center gap-2">
              <label
                aria-label={o.esCorrecta ? "Marcada correcta" : "Marcar como correcta"}
                className={cn(
                  "flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md border transition-colors",
                  o.esCorrecta
                    ? "border-success bg-success-soft text-success-on-soft"
                    : "border-border-strong text-text-tertiary hover:border-accent",
                )}
              >
                <input
                  type="checkbox"
                  checked={o.esCorrecta}
                  onChange={() => alternarCorrecta(o.id)}
                  className="sr-only"
                />
                {o.esCorrecta ? (
                  <Check className="h-4 w-4" strokeWidth={2} aria-hidden={true} />
                ) : null}
              </label>
              <Input
                value={o.texto}
                onChange={(e) => actualizarOpcion(o.id, { texto: e.target.value })}
                onKeyDown={alPulsarEnterEnOpcion}
                placeholder={`Opción ${idx + 1}`}
              />
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Eliminar opción ${idx + 1}`}
                disabled={pregunta.opciones.length <= 2}
                onClick={() => eliminarOpcion(o.id)}
              >
                <Trash2 className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
              </Button>
            </li>
          ))}
        </ul>
        <Button variant="ghost" size="sm" onClick={anadirOpcion} disabled={haxMaximas}>
          <Plus className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
          Añadir opción
        </Button>
      </div>

      <label className="inline-flex items-center gap-2 text-body-sm text-text-secondary">
        <input
          type="checkbox"
          checked={pregunta.puntuacionParcial}
          onChange={(e) => onCambiar({ ...pregunta, puntuacionParcial: e.target.checked })}
          className="h-4 w-4 rounded border-border-strong text-accent focus:ring-accent"
        />
        Puntuación parcial — sumar puntos proporcionales al número de aciertos.
      </label>
    </div>
  )
}
