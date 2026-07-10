import { useListarBloques } from "@/features/catalogo/hooks/use-listar-bloques"
import { Field } from "@/shared/components/ui/field"
import { Select, SelectItem } from "@/shared/components/ui/select"
import type { BloqueDetalleResponse } from "@nexott-learn/shared-types"
import { useMemo, useRef, useState } from "react"
import { CamposTestsReto } from "./codigo-tests/campos-tests-reto"
import type { TestUnit } from "./codigo-tests/codigo-test-fila"
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
            value={datos.codigoPreguntasId === "" ? undefined : datos.codigoPreguntasId}
            onValueChange={(v) => actualizar({ ...datos, codigoPreguntasId: v })}
            placeholder="— Selecciona un reto —"
          >
            {hermanos.map((h) => (
              <SelectItem key={h.id} value={h.id}>
                Reto v{h.version} · #{h.orden}
              </SelectItem>
            ))}
          </Select>
        )}
      </Field>

      <CamposTestsReto
        valor={{ solucionReferencia: datos.solucionReferencia, tests: datos.tests }}
        onCambio={(v) => actualizar({ ...datos, ...v })}
      />
    </EditorBloqueShell>
  )
}
