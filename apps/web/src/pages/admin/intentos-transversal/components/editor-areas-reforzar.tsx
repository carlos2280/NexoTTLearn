import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { Plus, Trash2 } from "lucide-react"
import { MAX_AREAS_REFORZAR } from "./informe-curado.helpers"

/** Fila del editor de "áreas a reforzar" con id estable (clave de React). */
export interface FilaReforzar {
  readonly id: number
  readonly que: string
  readonly sugerencia: string
}

interface EditorAreasReforzarProps {
  readonly filas: readonly FilaReforzar[]
  readonly disabled: boolean
  readonly onEditar: (id: number, campo: "que" | "sugerencia", valor: string) => void
  readonly onQuitar: (id: number) => void
  readonly onAgregar: () => void
}

/**
 * Lista editable de "áreas a reforzar" (qué + sugerencia) del informe curado.
 * Presentacional: el estado vive en el editor padre. Usa un id por fila como
 * clave estable (nunca el índice) para no perder el foco al editar/quitar.
 */
export function EditorAreasReforzar({
  filas,
  disabled,
  onEditar,
  onQuitar,
  onAgregar,
}: EditorAreasReforzarProps) {
  return (
    <div className="flex flex-col gap-3">
      <span className="nx-eyebrow text-text-tertiary">Áreas a reforzar</span>
      {filas.length === 0 ? (
        <p className="text-body-sm text-text-tertiary">Sin áreas a reforzar todavía.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {filas.map((fila, i) => (
            <li
              key={fila.id}
              className="flex items-start gap-2 rounded-xl border border-border bg-canvas p-3"
            >
              <div className="flex flex-1 flex-col gap-2">
                <Input
                  aria-label={`Área ${i + 1}: qué reforzar`}
                  placeholder="Qué reforzar"
                  value={fila.que}
                  disabled={disabled}
                  maxLength={300}
                  onChange={(e) => onEditar(fila.id, "que", e.target.value)}
                />
                <Input
                  aria-label={`Área ${i + 1}: sugerencia`}
                  placeholder="Sugerencia concreta"
                  value={fila.sugerencia}
                  disabled={disabled}
                  maxLength={500}
                  onChange={(e) => onEditar(fila.id, "sugerencia", e.target.value)}
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                disabled={disabled}
                aria-label={`Quitar área ${i + 1}`}
                onClick={() => onQuitar(fila.id)}
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden={true} />
              </Button>
            </li>
          ))}
        </ul>
      )}
      <Button
        variant="secondary"
        size="sm"
        className="self-start"
        disabled={disabled || filas.length >= MAX_AREAS_REFORZAR}
        onClick={onAgregar}
      >
        <Plus className="mr-2 h-3.5 w-3.5" aria-hidden={true} />
        Agregar área
      </Button>
    </div>
  )
}
