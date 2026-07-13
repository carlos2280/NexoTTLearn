import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { Plus, X } from "lucide-react"

const MAX_CRITERIOS = 15

interface EditorCriteriosTransversalProps {
  readonly criterios: readonly string[]
  readonly onCambio: (criterios: readonly string[]) => void
}

/**
 * Editor de la "Lista a evaluar" del proyecto transversal: ítems concretos que
 * la IA verifica uno por uno sobre el repo, aparte del brief en prosa. Opcional
 * (sin ítems se comporta como antes). Los ítems vacíos se descartan al guardar.
 */
export function EditorCriteriosTransversal({
  criterios,
  onCambio,
}: EditorCriteriosTransversalProps) {
  const editar = (indice: number, valor: string) =>
    onCambio(criterios.map((c, i) => (i === indice ? valor : c)))
  const quitar = (indice: number) => onCambio(criterios.filter((_, i) => i !== indice))
  const agregar = () => onCambio([...criterios, ""])

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <span className="nx-eyebrow text-text-tertiary">Lista a evaluar (opcional)</span>
        <p className="text-body-sm text-text-secondary">
          Cada ítem es algo concreto que la IA revisa sobre el repositorio. También lo ve el
          participante antes de entregar.
        </p>
      </div>

      {criterios.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {criterios.map((criterio, indice) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: editable por posición; el contenido lo controla `value`, quitar solo puede mover el foco.
            <li key={indice} className="flex items-center gap-2">
              <Input
                value={criterio}
                onChange={(e) => editar(indice, e.target.value)}
                placeholder="Ej: README claro con qué hace y cómo se ejecuta"
                maxLength={200}
                aria-label={`Criterio ${indice + 1}`}
              />
              <Button
                variant="ghost"
                size="icon"
                type="button"
                onClick={() => quitar(indice)}
                aria-label={`Quitar criterio ${indice + 1}`}
              >
                <X className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-body-sm text-text-tertiary">
          Sin lista: la IA solo puntúa las skills. Añade ítems para guiar qué evaluar.
        </p>
      )}

      {criterios.length < MAX_CRITERIOS ? (
        <div>
          <Button variant="secondary" size="sm" type="button" onClick={agregar}>
            <Plus className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
            Agregar ítem
          </Button>
        </div>
      ) : null}
    </div>
  )
}
