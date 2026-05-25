import { Button } from "@/shared/components/ui/button"
import { Field } from "@/shared/components/ui/field"
import { Switch } from "@/shared/components/ui/switch"
import { cn } from "@/shared/lib/cn"
import { extraerTextoPlano } from "@/shared/lib/sanitize-html"
import { ChevronDown, ChevronRight, Eye, EyeOff, Trash2 } from "lucide-react"
import { CodeEditor } from "../shared/code-editor"
import { TiptapEditor } from "../shared/tiptap-editor"
import { extensionesMinimas } from "../shared/tiptap-extensiones"

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
  const resumen = extraerTextoPlano(test.descripcion)
  return (
    <li className="rounded-lg border border-border bg-surface shadow-xs">
      <button
        type="button"
        onClick={onAlternar}
        className="flex w-full items-center gap-2 rounded-lg px-4 py-3 text-left transition-colors duration-fast ease-default hover:bg-subtle/40"
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
          {resumen.length > 0 ? (
            resumen
          ) : (
            <span className="text-text-tertiary">Sin descripción</span>
          )}
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
          <Field
            label="Descripción"
            hint="Resumen del caso. Acepta negrita, cursiva, listas, código inline y enlaces."
          >
            {(_attrs) => (
              <TiptapEditor
                key={test.id}
                htmlInicial={test.descripcion}
                extensiones={extensionesMinimas("Ej. Lista vacía retorna 0")}
                variante="minima"
                altoMin="80px"
                onCambio={(html) => onCambiar({ ...test, descripcion: html })}
              />
            )}
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Entrada">
              {(attrs) => (
                <CodeEditor
                  id={attrs.id}
                  value={test.entrada}
                  onValueChange={(v) => onCambiar({ ...test, entrada: v })}
                  rows={5}
                  compacto={true}
                  placeholder="[]"
                />
              )}
            </Field>
            <Field label="Salida esperada">
              {(attrs) => (
                <CodeEditor
                  id={attrs.id}
                  value={test.salidaEsperada}
                  onValueChange={(v) => onCambiar({ ...test, salidaEsperada: v })}
                  rows={5}
                  compacto={true}
                  placeholder="0"
                />
              )}
            </Field>
          </div>

          <div className="flex items-center justify-between gap-3">
            <Switch
              checked={test.visible}
              onCambio={(v) => onCambiar({ ...test, visible: v })}
              label="Visible para el participante"
              descripcion="Si está apagado, el caso es oculto: el participante sabe que falló pero no la entrada/salida."
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={onEliminar}
              className="text-danger-on-soft hover:bg-danger-soft"
            >
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
