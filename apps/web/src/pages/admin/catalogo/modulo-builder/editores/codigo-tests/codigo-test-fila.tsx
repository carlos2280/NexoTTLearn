import { Button } from "@/shared/components/ui/button"
import { Field } from "@/shared/components/ui/field"
import { Input } from "@/shared/components/ui/input"
import { cn } from "@/shared/lib/cn"
import { ChevronDown, ChevronRight, Eye, EyeOff, Trash2 } from "lucide-react"
import { CodigoTextarea } from "../shared/codigo-textarea"

export interface TestUnit {
  readonly id: string
  readonly descripcion: string
  readonly entrada: string
  readonly salidaEsperada: string
  readonly visible: boolean
}

interface CodigoTestFilaProps {
  readonly test: TestUnit
  readonly numero: number
  readonly expandido: boolean
  readonly onAlternar: () => void
  readonly onCambiar: (siguiente: TestUnit) => void
  readonly onEliminar: () => void
}

export function CodigoTestFila({
  test,
  numero,
  expandido,
  onAlternar,
  onCambiar,
  onEliminar,
}: CodigoTestFilaProps) {
  return (
    <li className="rounded-lg border border-border bg-surface">
      <button
        type="button"
        onClick={onAlternar}
        className="flex w-full items-center gap-2 px-4 py-3 text-left"
      >
        <span className="text-text-tertiary">
          {expandido ? (
            <ChevronDown className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
          ) : (
            <ChevronRight className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
          )}
        </span>
        <span className="tabular shrink-0 text-caption text-text-tertiary">{numero}.</span>
        <span className="flex-1 truncate font-medium text-body-sm text-text-primary">
          {test.descripcion || <span className="text-text-tertiary">Sin descripción</span>}
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-caption",
            test.visible ? "bg-info-soft text-info-on-soft" : "bg-subtle text-text-secondary",
          )}
        >
          {test.visible ? (
            <Eye className="h-3 w-3" strokeWidth={1.5} aria-hidden={true} />
          ) : (
            <EyeOff className="h-3 w-3" strokeWidth={1.5} aria-hidden={true} />
          )}
          {test.visible ? "Público" : "Oculto"}
        </span>
      </button>

      {expandido ? (
        <div className="flex flex-col gap-4 border-border border-t px-4 py-4">
          <Field label="Descripción" hint="Resumen corto del caso de prueba.">
            {(attrs) => (
              <Input
                {...attrs}
                value={test.descripcion}
                onChange={(e) => onCambiar({ ...test, descripcion: e.target.value })}
                placeholder="Ej. Lista vacía retorna 0"
              />
            )}
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Entrada">
              {(attrs) => (
                <CodigoTextarea
                  id={attrs.id}
                  value={test.entrada}
                  onValueChange={(v) => onCambiar({ ...test, entrada: v })}
                  rows={5}
                  placeholder="[]"
                />
              )}
            </Field>
            <Field label="Salida esperada">
              {(attrs) => (
                <CodigoTextarea
                  id={attrs.id}
                  value={test.salidaEsperada}
                  onValueChange={(v) => onCambiar({ ...test, salidaEsperada: v })}
                  rows={5}
                  placeholder="0"
                />
              )}
            </Field>
          </div>

          <div className="flex items-center justify-between gap-3">
            <label className="inline-flex items-center gap-2 text-body-sm text-text-secondary">
              <input
                type="checkbox"
                checked={test.visible}
                onChange={(e) => onCambiar({ ...test, visible: e.target.checked })}
                className="h-4 w-4 rounded border-border-strong text-accent focus:ring-accent"
              />
              Visible para el participante
            </label>
            <Button variant="ghost" size="sm" onClick={onEliminar}>
              <Trash2 className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
              Eliminar test
            </Button>
          </div>
        </div>
      ) : null}
    </li>
  )
}

export function testVacio(): TestUnit {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2, 12)
  return {
    id,
    descripcion: "",
    entrada: "",
    salidaEsperada: "",
    visible: true,
  }
}
