import { useCrearIntentoBloque } from "@/features/intentos-bloque/hooks/use-crear-intento-bloque"
import { type ResultadoEjecucionSql, useEjecutarSql } from "@/features/sql-ejecucion"
import type {
  ContenidoSqlEjercicio,
  ContenidoSqlTests,
  IntentoBloqueResponse,
  ResultadoTestSqlReportado,
} from "@nexott-learn/shared-types"
import { useState } from "react"

interface InputFlujo {
  readonly bloqueId: string
  readonly cursoId: string
  readonly contenido: ContenidoSqlEjercicio
  readonly contenidoTests: ContenidoSqlTests | null
}

interface OutputFlujo {
  readonly consulta: string
  readonly setConsulta: (valor: string) => void
  readonly reset: () => void
  readonly puedeEjecutar: boolean
  /** Corre la suite en el navegador (PGlite) sin persistir intento. */
  readonly ejecutar: () => Promise<void>
  /** Corre la suite Y persiste el intento en el backend (decisión oficial). */
  readonly enviar: () => Promise<void>
  readonly isEjecutando: boolean
  readonly isEnviando: boolean
  readonly ejecucion: ResultadoEjecucionSql | null
  /** Consulta enviada al runner en la última ejecución (para detectar cambios
   * sin probar). `null` si nunca se ejecutó. */
  readonly consultaEjecutada: string | null
  readonly ultimoIntento: IntentoBloqueResponse | null
  readonly errorEjecucion: Error | null
}

/**
 * Orquesta el flujo "ejecutar la consulta en PGlite (navegador) → enviar los
 * resultados por test al backend → mostrar nota". Si el bloque no trae
 * `SQL_TESTS` hermano, `puedeEjecutar` es false: la sección está mal
 * configurada. El backend NUNCA confía en una nota del cliente: recuenta desde
 * los `paso` reportados (mismo modelo que CODIGO_PREGUNTAS).
 */
export function useFlujoSql(input: InputFlujo): OutputFlujo {
  const [consulta, setConsulta] = useState<string>(input.contenido.consultaInicial)
  const [ejecucion, setEjecucion] = useState<ResultadoEjecucionSql | null>(null)
  const [consultaEjecutada, setConsultaEjecutada] = useState<string | null>(null)
  const [ultimoIntento, setUltimoIntento] = useState<IntentoBloqueResponse | null>(null)
  const ejecutor = useEjecutarSql()
  const crear = useCrearIntentoBloque()

  const puedeEjecutar = input.contenidoTests !== null

  const reset = (): void => {
    setConsulta(input.contenido.consultaInicial)
    setEjecucion(null)
    setConsultaEjecutada(null)
    setUltimoIntento(null)
  }

  async function ejecutarLocal(): Promise<ResultadoEjecucionSql | null> {
    // `puedeEjecutar` implica `contenidoTests !== null`; el check defensivo
    // permite usar `input.contenidoTests` sin `!` abajo.
    if (!puedeEjecutar || input.contenidoTests === null || consulta.trim().length === 0) {
      return null
    }
    setEjecucion(null)
    const consultaSnapshot = consulta
    const resultado = await ejecutor.mutateAsync({
      esquemaSemillaEjercicio: input.contenido.esquemaSemilla,
      tests: input.contenidoTests.tests,
      consulta: consultaSnapshot,
      tiempoLimiteSeg: input.contenido.tiempoLimiteSeg,
    })
    setEjecucion(resultado)
    setConsultaEjecutada(consultaSnapshot)
    return resultado
  }

  const ejecutar = async (): Promise<void> => {
    await ejecutarLocal()
  }

  const enviar = async (): Promise<void> => {
    setUltimoIntento(null)
    const resultado = await ejecutarLocal()
    if (!resultado) {
      return
    }
    const resultadosTests: ResultadoTestSqlReportado[] = resultado.resultados.map((r) => ({
      testId: r.testId,
      paso: r.paso,
      estado: r.estado,
      filasObtenidas: JSON.stringify(r.obtenido),
      error: r.error,
      duracionMs: r.duracionMs,
    }))
    const intento = await crear.mutateAsync({
      body: {
        bloqueId: input.bloqueId,
        cursoId: input.cursoId,
        respuestas: {
          tipo: "SQL_EJERCICIO",
          consultaEnviada: consulta,
          resultadosTests,
        },
      },
    })
    setUltimoIntento(intento)
  }

  return {
    consulta,
    setConsulta,
    reset,
    puedeEjecutar,
    ejecutar,
    enviar,
    isEjecutando: ejecutor.isPending,
    isEnviando: crear.isPending,
    ejecucion,
    consultaEjecutada,
    ultimoIntento,
    errorEjecucion: ejecutor.error,
  }
}
