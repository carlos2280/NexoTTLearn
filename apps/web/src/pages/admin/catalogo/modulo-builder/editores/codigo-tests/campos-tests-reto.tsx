import { Button } from "@/shared/components/ui/button"
import { EmptyState } from "@/shared/components/ui/empty-state"
import { Field } from "@/shared/components/ui/field"
import { FlaskConical, Plus } from "lucide-react"
import { useState } from "react"
import { CodeEditor } from "../shared/code-editor"
import { CodigoTestFila, type TestUnit, testVacio } from "./codigo-test-fila"

export interface BorradorTests {
  readonly solucionReferencia: string
  readonly tests: readonly TestUnit[]
}

interface CamposTestsRetoProps {
  readonly valor: BorradorTests
  readonly onCambio: (valor: BorradorTests) => void
}

/**
 * Campos de edición de los tests de un reto: solución de referencia + casos
 * stdin → salida esperada. Presentacional (no persiste): el padre le pasa el
 * borrador y recibe los cambios. Lo usan el editor de Tests standalone y el
 * editor del Reto (sección embebida), así ambos comparten exactamente la UI.
 */
export function CamposTestsReto({ valor, onCambio }: CamposTestsRetoProps) {
  const [expandidoId, setExpandidoId] = useState<string | null>(valor.tests[0]?.id ?? null)

  function cambiarTest(siguiente: TestUnit) {
    onCambio({
      ...valor,
      tests: valor.tests.map((t) => (t.id === siguiente.id ? siguiente : t)),
    })
  }

  function eliminarTest(id: string) {
    onCambio({ ...valor, tests: valor.tests.filter((t) => t.id !== id) })
    if (expandidoId === id) {
      setExpandidoId(null)
    }
  }

  function anadirTest() {
    const nuevo = testVacio()
    onCambio({ ...valor, tests: [...valor.tests, nuevo] })
    setExpandidoId(nuevo.id)
  }

  return (
    <div className="flex flex-col gap-4">
      <Field
        label="Solución de referencia"
        hint="No visible para el participante. Sirve para auto-validar tus tests."
      >
        {(attrs) => (
          <CodeEditor
            id={attrs.id}
            value={valor.solucionReferencia}
            onValueChange={(v) => onCambio({ ...valor, solucionReferencia: v })}
            lenguaje="typescript"
            rows={10}
            placeholder="// Tu solución de referencia…"
          />
        )}
      </Field>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <span className="nx-eyebrow text-text-tertiary">Tests · {valor.tests.length}</span>
          <Button variant="secondary" size="sm" onClick={anadirTest}>
            <Plus className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
            Añadir test
          </Button>
        </div>

        {valor.tests.length === 0 ? (
          <EmptyState
            icono={FlaskConical}
            titulo="Aún no hay tests"
            descripcion="Añade el primer caso de prueba. Mezcla públicos (ayudan a debugear) con ocultos (verifican que no se hardcodee)."
          />
        ) : (
          <ol className="flex flex-col gap-2">
            {valor.tests.map((t, idx) => (
              <CodigoTestFila
                key={t.id}
                test={t}
                numero={idx + 1}
                expandido={expandidoId === t.id}
                onAlternar={() => setExpandidoId(expandidoId === t.id ? null : t.id)}
                onCambiar={cambiarTest}
                onEliminar={() => eliminarTest(t.id)}
              />
            ))}
          </ol>
        )}
      </div>
    </div>
  )
}
