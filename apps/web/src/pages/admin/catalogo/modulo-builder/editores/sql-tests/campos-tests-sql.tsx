import { Button } from "@/shared/components/ui/button"
import { EmptyState } from "@/shared/components/ui/empty-state"
import { FlaskConical, Plus } from "lucide-react"
import { useState } from "react"
import { FilaTestSql, type TestSqlUnit, testSqlVacio } from "./fila-test-sql"

export interface BorradorTestsSql {
  readonly tests: readonly TestSqlUnit[]
}

interface CamposTestsSqlProps {
  readonly valor: BorradorTestsSql
  readonly onCambio: (valor: BorradorTestsSql) => void
}

/**
 * Campos de edición de los tests de un reto SQL: solo la lista de casos, cada
 * uno con su propia consulta de referencia. A diferencia de CODIGO, NO hay
 * "solución de referencia" global — cada test la lleva embebida. Presentacional
 * (no persiste): el padre le pasa el borrador y recibe los cambios.
 */
export function CamposTestsSql({ valor, onCambio }: CamposTestsSqlProps) {
  const [expandidoId, setExpandidoId] = useState<string | null>(valor.tests[0]?.id ?? null)

  function cambiarTest(siguiente: TestSqlUnit) {
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
    const nuevo = testSqlVacio()
    onCambio({ ...valor, tests: [...valor.tests, nuevo] })
    setExpandidoId(nuevo.id)
  }

  return (
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
          descripcion="Añade el primer caso. Cada uno lleva su consulta de referencia; mezcla públicos (ayudan a debugear) con ocultos (verifican que no se hardcodee)."
        />
      ) : (
        <ol className="flex flex-col gap-2">
          {valor.tests.map((t, idx) => (
            <FilaTestSql
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
  )
}
