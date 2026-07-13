import type { BloqueDetalleResponse } from "@nexott-learn/shared-types"
import { useMemo, useRef, useState } from "react"
import { IndicadorGuardado } from "../shared/indicador-guardado"
import { useAutoGuardarBloque } from "../shared/use-auto-guardar-bloque"
import { type BorradorTestsSql, CamposTestsSql } from "../sql-tests/campos-tests-sql"
import type { TestSqlUnit } from "../sql-tests/fila-test-sql"
import { construirContenidoTestsSql } from "./borrador-tests-sql"

interface EditorTestsSqlEmbebidoProps {
  readonly bloque: BloqueDetalleResponse
}

function leerInicial(contenido: Record<string, unknown> | null): {
  readonly sqlEjercicioId: string
  readonly borrador: BorradorTestsSql
} {
  return {
    sqlEjercicioId: typeof contenido?.sqlEjercicioId === "string" ? contenido.sqlEjercicioId : "",
    borrador: {
      tests: Array.isArray(contenido?.tests) ? (contenido.tests as TestSqlUnit[]) : [],
    },
  }
}

/**
 * Edición de los tests de un reto SQL, embebida dentro del editor del Reto SQL.
 * Es su propio auto-guardado sobre el bloque SQL_TESTS pareado; preserva el
 * `sqlEjercicioId` (el enlace al reto) que ya no se edita a mano. A diferencia
 * de CODIGO no hay solución global: el contenido es `{ sqlEjercicioId, tests }`.
 */
export function EditorTestsSqlEmbebido({ bloque }: EditorTestsSqlEmbebidoProps) {
  const inicial = useMemo(() => leerInicial(bloque.contenido), [bloque.contenido])
  const [datos, setDatos] = useState<BorradorTestsSql>(inicial.borrador)
  const datosRef = useRef<BorradorTestsSql>(inicial.borrador)

  const auto = useAutoGuardarBloque({
    bloqueId: bloque.id,
    // El indicador global del topbar lo maneja el editor del Reto (nivel
    // superior); aquí solo mostramos el indicador local para no pisarlo.
    reportarGlobal: false,
    construirContenido: () =>
      construirContenidoTestsSql(inicial.sqlEjercicioId, datosRef.current.tests),
  })

  function actualizar(valor: BorradorTestsSql) {
    setDatos(valor)
    datosRef.current = valor
    auto.marcarSucio()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <IndicadorGuardado estado={auto.estado} />
      </div>
      <CamposTestsSql valor={datos} onCambio={actualizar} />
    </div>
  )
}
