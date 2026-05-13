import { Field } from "@/shared/components/ui/field"
import { Input } from "@/shared/components/ui/input"
import { cn } from "@/shared/lib/cn"

export type SolucionVisible = "tras_intento" | "al_aprobar" | "al_cerrar"

export interface ConfigQuiz {
  readonly intentosMax: number | null
  readonly solucionVisible: SolucionVisible
  readonly ordenAleatorio: boolean
  readonly notaMinima: number
}

interface QuizConfigProps {
  readonly config: ConfigQuiz
  readonly onCambiar: (siguiente: ConfigQuiz) => void
}

const SOLUCION_OPCIONES: ReadonlyArray<{
  readonly id: SolucionVisible
  readonly etiqueta: string
}> = [
  { id: "tras_intento", etiqueta: "Tras cada intento" },
  { id: "al_aprobar", etiqueta: "Al aprobar" },
  { id: "al_cerrar", etiqueta: "Al cerrar curso" },
]

export function QuizConfig({ config, onCambiar }: QuizConfigProps) {
  const intentosIlimitados = config.intentosMax === null

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4">
      <span className="nx-eyebrow text-text-tertiary">Configuración del quiz</span>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Intentos del participante">
          {() => (
            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-2 text-body-sm text-text-secondary">
                <input
                  type="radio"
                  checked={intentosIlimitados}
                  onChange={() => onCambiar({ ...config, intentosMax: null })}
                />
                Ilimitados
              </label>
              <label className="inline-flex items-center gap-2 text-body-sm text-text-secondary">
                <input
                  type="radio"
                  checked={!intentosIlimitados}
                  onChange={() => onCambiar({ ...config, intentosMax: 3 })}
                />
                Máximo
              </label>
              <Input
                type="number"
                min={1}
                max={20}
                disabled={intentosIlimitados}
                value={intentosIlimitados ? "" : (config.intentosMax ?? 1)}
                onChange={(e) =>
                  onCambiar({
                    ...config,
                    intentosMax: Math.max(1, Number(e.target.value) || 1),
                  })
                }
                className="w-20"
              />
            </div>
          )}
        </Field>

        <Field label="Nota mínima para aprobar" hint="Escala 0–100.">
          {(attrs) => (
            <div className="flex items-center gap-2">
              <Input
                {...attrs}
                type="number"
                min={0}
                max={100}
                value={config.notaMinima}
                onChange={(e) =>
                  onCambiar({
                    ...config,
                    notaMinima: Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                  })
                }
              />
              <span className="text-body-sm text-text-tertiary">/ 100</span>
            </div>
          )}
        </Field>
      </div>

      <Field label="Cuándo se muestra la solución">
        {() => (
          <div className="flex flex-wrap gap-2" role="radiogroup">
            {SOLUCION_OPCIONES.map((opt) => {
              const activo = config.solucionVisible === opt.id
              return (
                <label
                  key={opt.id}
                  className={cn(
                    "cursor-pointer rounded-pill border px-3 py-1.5 text-caption transition-colors",
                    activo
                      ? "border-accent bg-accent-soft text-accent-on-soft"
                      : "border-border bg-surface text-text-secondary hover:bg-subtle",
                  )}
                >
                  <input
                    type="radio"
                    name="quiz-solucion-visible"
                    checked={activo}
                    onChange={() => onCambiar({ ...config, solucionVisible: opt.id })}
                    className="sr-only"
                  />
                  {opt.etiqueta}
                </label>
              )
            })}
          </div>
        )}
      </Field>

      <label className="inline-flex items-center gap-2 text-body-sm text-text-secondary">
        <input
          type="checkbox"
          checked={config.ordenAleatorio}
          onChange={(e) => onCambiar({ ...config, ordenAleatorio: e.target.checked })}
          className="h-4 w-4 rounded border-border-strong text-accent focus:ring-accent"
        />
        Mostrar preguntas en orden aleatorio por participante
      </label>
    </div>
  )
}
