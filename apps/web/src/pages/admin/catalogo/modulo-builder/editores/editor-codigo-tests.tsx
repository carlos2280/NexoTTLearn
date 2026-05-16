import { useListarBloques } from "@/features/catalogo/hooks/use-listar-bloques"
import { Button } from "@/shared/components/ui/button"
import { EmptyState } from "@/shared/components/ui/empty-state"
import { Field } from "@/shared/components/ui/field"
import { Select } from "@/shared/components/ui/select"
import type { BloqueDetalleResponse } from "@nexott-learn/shared-types"
import { FlaskConical, Plus } from "lucide-react"
import { useMemo, useRef, useState } from "react"
import { CodigoTestFila, type TestUnit, testVacio } from "./codigo-tests/codigo-test-fila"
import { CodeEditor } from "./shared/code-editor"
import { EditorBloqueShell } from "./shared/editor-bloque-shell"
import { useAutoGuardarBloque } from "./shared/use-auto-guardar-bloque"

interface EditorCodigoTestsProps {
  readonly bloque: BloqueDetalleResponse
}

interface Borrador {
  readonly codigoPreguntasId: string
  readonly solucionReferencia: string
  readonly tests: readonly TestUnit[]
}

function leerInicial(contenido: Record<string, unknown> | null): Borrador {
  return {
    codigoPreguntasId:
      typeof contenido?.codigoPreguntasId === "string" ? contenido.codigoPreguntasId : "",
    solucionReferencia:
      typeof contenido?.solucionReferencia === "string" ? contenido.solucionReferencia : "",
    tests: Array.isArray(contenido?.tests) ? (contenido.tests as TestUnit[]) : [],
  }
}

export function EditorCodigoTests({ bloque }: EditorCodigoTestsProps) {
  const inicial = useMemo(() => leerInicial(bloque.contenido), [bloque.contenido])
  const [datos, setDatos] = useState<Borrador>(inicial)
  const datosRef = useRef<Borrador>(inicial)
  const [expandidoId, setExpandidoId] = useState<string | null>(inicial.tests[0]?.id ?? null)

  const hermanosQuery = useListarBloques({
    page: 1,
    pageSize: 100,
    seccionId: bloque.seccionId,
    tipo: "CODIGO_PREGUNTAS",
  })
  const hermanos = hermanosQuery.data?.data ?? []

  const auto = useAutoGuardarBloque({
    bloqueId: bloque.id,
    construirContenido: () => ({
      ...datosRef.current,
      tests: [...datosRef.current.tests],
    }),
  })

  function actualizar(siguiente: Borrador) {
    setDatos(siguiente)
    datosRef.current = siguiente
    auto.marcarSucio()
  }

  function actualizarTest(siguiente: TestUnit) {
    actualizar({
      ...datos,
      tests: datos.tests.map((t) => (t.id === siguiente.id ? siguiente : t)),
    })
  }

  function eliminarTest(id: string) {
    actualizar({ ...datos, tests: datos.tests.filter((t) => t.id !== id) })
    if (expandidoId === id) {
      setExpandidoId(null)
    }
  }

  function anadirTest() {
    const nuevo = testVacio()
    actualizar({ ...datos, tests: [...datos.tests, nuevo] })
    setExpandidoId(nuevo.id)
  }

  return (
    <EditorBloqueShell
      bloque={bloque}
      titulo="Tests automáticos"
      descripcion="Pares entrada → salida esperada que se ejecutan contra el código del participante. La nota es el porcentaje de tests pasados."
      estadoGuardado={auto.estado}
    >
      <Field
        label="Reto asociado"
        hint="Elige el bloque «Reto de código» de esta misma sección al que pertenecen estos tests."
      >
        {(attrs) => (
          <Select
            id={attrs.id}
            value={datos.codigoPreguntasId}
            onChange={(e) => actualizar({ ...datos, codigoPreguntasId: e.target.value })}
          >
            <option value="">— Selecciona un reto —</option>
            {hermanos.map((h) => (
              <option key={h.id} value={h.id}>
                Reto v{h.version} · #{h.orden}
              </option>
            ))}
          </Select>
        )}
      </Field>

      <Field
        label="Solución de referencia"
        hint="No visible para el participante. Sirve para auto-validar tus tests."
      >
        {(attrs) => (
          <CodeEditor
            id={attrs.id}
            value={datos.solucionReferencia}
            onValueChange={(v) => actualizar({ ...datos, solucionReferencia: v })}
            lenguaje="typescript"
            rows={10}
            placeholder="// Tu solución de referencia…"
          />
        )}
      </Field>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <span className="nx-eyebrow text-text-tertiary">Tests · {datos.tests.length}</span>
          <Button variant="secondary" size="sm" onClick={anadirTest}>
            <Plus className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
            Añadir test
          </Button>
        </div>

        {datos.tests.length === 0 ? (
          <EmptyState
            icono={FlaskConical}
            titulo="Aún no hay tests"
            descripcion="Añade el primer caso de prueba. Mezcla públicos (ayudan a debugear) con ocultos (verifican que no se hardcodee)."
          />
        ) : (
          <ol className="flex flex-col gap-2">
            {datos.tests.map((t, idx) => (
              <CodigoTestFila
                key={t.id}
                test={t}
                numero={idx + 1}
                expandido={expandidoId === t.id}
                onAlternar={() => setExpandidoId(expandidoId === t.id ? null : t.id)}
                onCambiar={actualizarTest}
                onEliminar={() => eliminarTest(t.id)}
              />
            ))}
          </ol>
        )}
      </div>
    </EditorBloqueShell>
  )
}
