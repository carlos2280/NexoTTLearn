import type { BloqueDetalleResponse } from "@nexott-learn/shared-types"
import { useMemo, useRef, useState } from "react"
import { type BorradorTests, CamposTestsReto } from "../codigo-tests/campos-tests-reto"
import type { TestUnit } from "../codigo-tests/codigo-test-fila"
import { IndicadorGuardado } from "../shared/indicador-guardado"
import { useAutoGuardarBloque } from "../shared/use-auto-guardar-bloque"

interface EditorTestsEmbebidoProps {
  readonly bloque: BloqueDetalleResponse
  /** Lenguaje del reto pareado, para resaltar la "Solución de referencia". */
  readonly lenguaje: string
  /** Tiempo límite por test del reto, para validar la solución de referencia. */
  readonly tiempoLimiteSeg: number
}

function leerInicial(contenido: Record<string, unknown> | null): {
  readonly codigoPreguntasId: string
  readonly borrador: BorradorTests
} {
  return {
    codigoPreguntasId:
      typeof contenido?.codigoPreguntasId === "string" ? contenido.codigoPreguntasId : "",
    borrador: {
      solucionReferencia:
        typeof contenido?.solucionReferencia === "string" ? contenido.solucionReferencia : "",
      tests: Array.isArray(contenido?.tests) ? (contenido.tests as TestUnit[]) : [],
    },
  }
}

/**
 * Edición de los tests de un reto, embebida dentro del editor del Reto. Es su
 * propio auto-guardado sobre el bloque CODIGO_TESTS pareado; preserva el
 * `codigoPreguntasId` (el enlace al reto) que ya no se edita a mano.
 */
export function EditorTestsEmbebido({
  bloque,
  lenguaje,
  tiempoLimiteSeg,
}: EditorTestsEmbebidoProps) {
  const inicial = useMemo(() => leerInicial(bloque.contenido), [bloque.contenido])
  const [datos, setDatos] = useState<BorradorTests>(inicial.borrador)
  const datosRef = useRef<BorradorTests>(inicial.borrador)

  const auto = useAutoGuardarBloque({
    bloqueId: bloque.id,
    // El indicador global del topbar lo maneja el editor del Reto (nivel
    // superior); aquí solo mostramos el indicador local para no pisarlo.
    reportarGlobal: false,
    construirContenido: () => ({
      codigoPreguntasId: inicial.codigoPreguntasId,
      solucionReferencia: datosRef.current.solucionReferencia,
      tests: [...datosRef.current.tests],
    }),
  })

  function actualizar(valor: BorradorTests) {
    setDatos(valor)
    datosRef.current = valor
    auto.marcarSucio()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <IndicadorGuardado estado={auto.estado} />
      </div>
      <CamposTestsReto
        valor={datos}
        onCambio={actualizar}
        lenguaje={lenguaje}
        tiempoLimiteSeg={tiempoLimiteSeg}
      />
    </div>
  )
}
