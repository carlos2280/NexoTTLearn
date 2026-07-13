import { Button } from "@/shared/components/ui/button"
import { Field } from "@/shared/components/ui/field"
import { Switch } from "@/shared/components/ui/switch"
import { Trash2 } from "lucide-react"
import { CodeEditor } from "../shared/code-editor"
import { TiptapEditor } from "../shared/tiptap-editor"
import { extensionesMinimas } from "../shared/tiptap-extensiones"
import type { TestSqlUnit } from "./fila-test-sql"

interface FilaTestSqlDetalleProps {
  readonly test: TestSqlUnit
  readonly onCambiar: (siguiente: TestSqlUnit) => void
  readonly onEliminar: () => void
}

/**
 * Panel expandido de un caso de test SQL: descripción + semilla propia opcional
 * + consulta de referencia + switches. Extraído de `FilaTestSql` para respetar
 * el límite de 150 líneas por archivo.
 */
export function FilaTestSqlDetalle({ test, onCambiar, onEliminar }: FilaTestSqlDetalleProps) {
  return (
    <div className="flex flex-col gap-4 border-border border-t px-4 py-4">
      <Field
        label="Descripción"
        hint="Resumen del caso. Acepta negrita, cursiva, listas, código inline y enlaces."
      >
        {(_attrs) => (
          <TiptapEditor
            key={test.id}
            htmlInicial={test.descripcion}
            extensiones={extensionesMinimas("Ej. Solo los empleados del área ventas")}
            variante="minima"
            altoMin="80px"
            onCambio={(html) => onCambiar({ ...test, descripcion: html })}
          />
        )}
      </Field>

      <Field
        label="Esquema semilla del test"
        hint="Opcional. Si lo dejas vacío, usa la semilla del reto. Úsalo para que la respuesta no se pueda hardcodear."
      >
        {(attrs) => (
          <CodeEditor
            id={attrs.id}
            value={test.esquemaSemilla}
            onValueChange={(v) => onCambiar({ ...test, esquemaSemilla: v })}
            lenguaje="sql"
            rows={5}
            compacto={true}
            placeholder="-- Vacío = hereda la semilla del reto"
          />
        )}
      </Field>

      <Field
        label="Consulta de referencia"
        hint="La SQL correcta. Su resultado define las filas esperadas. Requerida."
      >
        {(attrs) => (
          <CodeEditor
            id={attrs.id}
            value={test.consultaReferencia}
            onValueChange={(v) => onCambiar({ ...test, consultaReferencia: v })}
            lenguaje="sql"
            rows={5}
            compacto={true}
            placeholder="SELECT nombre FROM empleados WHERE area = 'ventas';"
          />
        )}
      </Field>

      <div className="flex flex-col gap-3">
        <Switch
          id={`${test.id}-visible`}
          checked={test.visible}
          onCambio={(v) => onCambiar({ ...test, visible: v })}
          label="Visible para el participante"
          descripcion="Si está apagado, el caso es oculto: el participante sabe que falló pero no la consulta esperada."
        />
        <Switch
          id={`${test.id}-orden`}
          checked={test.ordenImporta}
          onCambio={(v) => onCambiar({ ...test, ordenImporta: v })}
          label="El orden de las filas importa"
          descripcion="Actívalo solo si la consulta usa ORDER BY; si no, se comparan las filas como conjunto."
        />
      </div>

      <div className="flex justify-end">
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
  )
}
