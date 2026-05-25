import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { Plus, Trash2 } from "lucide-react"
import type { NormalizacionRespuestaCorta, PreguntaRespuestaCorta } from "../quiz-tipos"

interface CuerpoRespuestaCortaProps {
  readonly pregunta: PreguntaRespuestaCorta
  readonly onCambiar: (siguiente: PreguntaRespuestaCorta) => void
}

const MAX_RESPUESTAS = 10

interface ToggleNormalizacion {
  readonly clave: keyof NormalizacionRespuestaCorta
  readonly etiqueta: string
}

const TOGGLES: ReadonlyArray<ToggleNormalizacion> = [
  { clave: "trim", etiqueta: "Ignorar espacios al inicio y al final" },
  { clave: "ignorarMayusculas", etiqueta: "Ignorar mayúsculas y minúsculas" },
  { clave: "ignorarAcentos", etiqueta: "Ignorar acentos y diacríticos" },
  { clave: "ignorarEspaciosDobles", etiqueta: "Colapsar espacios dobles" },
]

export function CuerpoRespuestaCorta({ pregunta, onCambiar }: CuerpoRespuestaCortaProps) {
  const haxMaximas = pregunta.respuestasAceptadas.length >= MAX_RESPUESTAS

  function actualizarRespuesta(idx: number, valor: string) {
    onCambiar({
      ...pregunta,
      respuestasAceptadas: pregunta.respuestasAceptadas.map((r, i) => (i === idx ? valor : r)),
    })
  }

  function eliminarRespuesta(idx: number) {
    if (pregunta.respuestasAceptadas.length <= 1) {
      return
    }
    onCambiar({
      ...pregunta,
      respuestasAceptadas: pregunta.respuestasAceptadas.filter((_, i) => i !== idx),
    })
  }

  function anadirRespuesta() {
    if (haxMaximas) return
    onCambiar({
      ...pregunta,
      respuestasAceptadas: [...pregunta.respuestasAceptadas, ""],
    })
  }

  function alPulsarEnter(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      anadirRespuesta()
    }
  }

  function actualizarNormalizacion(clave: keyof NormalizacionRespuestaCorta, valor: boolean) {
    onCambiar({
      ...pregunta,
      normalizacion: { ...pregunta.normalizacion, [clave]: valor },
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="nx-eyebrow text-text-tertiary">Respuestas aceptadas</span>
          <span className="tabular text-caption text-text-tertiary">
            {pregunta.respuestasAceptadas.length}/{MAX_RESPUESTAS}
          </span>
        </div>
        <ul className="flex flex-col gap-2">
          {pregunta.respuestasAceptadas.map((respuesta, idx) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: el orden es la identidad del item; no hay id porque el contrato Zod es array de strings.
            <li key={idx} className="flex items-center gap-2">
              <Input
                value={respuesta}
                onChange={(e) => actualizarRespuesta(idx, e.target.value)}
                onKeyDown={alPulsarEnter}
                placeholder={`Respuesta ${idx + 1}`}
              />
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Eliminar respuesta ${idx + 1}`}
                disabled={pregunta.respuestasAceptadas.length <= 1}
                onClick={() => eliminarRespuesta(idx)}
              >
                <Trash2 className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
              </Button>
            </li>
          ))}
        </ul>
        <Button variant="ghost" size="sm" onClick={anadirRespuesta} disabled={haxMaximas}>
          <Plus className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
          Añadir respuesta aceptada
        </Button>
      </div>

      <div className="flex flex-col gap-2 rounded-lg border border-border bg-subtle/40 p-3">
        <span className="nx-eyebrow text-text-tertiary">Normalización al comparar</span>
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {TOGGLES.map((t) => (
            <label
              key={t.clave}
              className="inline-flex items-center gap-2 text-body-sm text-text-secondary"
            >
              <input
                type="checkbox"
                checked={pregunta.normalizacion[t.clave]}
                onChange={(e) => actualizarNormalizacion(t.clave, e.target.checked)}
                className="h-4 w-4 rounded border-border-strong text-accent focus:ring-accent"
              />
              {t.etiqueta}
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}
