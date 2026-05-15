import { type ResultadoEjecucionSuite, useEjecutarCodigo } from "@/features/codigo-ejecucion"
import { useCrearIntentoBloque } from "@/features/intentos-bloque/hooks/use-crear-intento-bloque"
import type {
  ContenidoCodigoPreguntas,
  ContenidoCodigoTests,
  IntentoBloqueResponse,
  ResultadoTestReportado,
} from "@nexott-learn/shared-types"
import { useState } from "react"

interface InputFlujo {
  readonly bloqueId: string
  readonly cursoId: string
  readonly contenido: ContenidoCodigoPreguntas
  readonly contenidoTests: ContenidoCodigoTests | null
}

interface OutputFlujo {
  readonly codigo: string
  readonly setCodigo: (valor: string) => void
  readonly reset: () => void
  readonly puedeEjecutar: boolean
  readonly ejecutar: () => Promise<void>
  readonly isEjecutando: boolean
  readonly isEnviando: boolean
  readonly ejecucion: ResultadoEjecucionSuite | null
  readonly ultimoIntento: IntentoBloqueResponse | null
  readonly errorEjecucion: Error | null
}

/**
 * Orquesta el flujo "ejecutar tests en el navegador → enviar resultados al
 * backend → mostrar nota". Cuando `modoSimple=true` o no hay tests asociados,
 * `puedeEjecutar` es false y el componente debe mostrar el aviso correspondiente.
 */
export function useFlujoCodigoPregunta(input: InputFlujo): OutputFlujo {
  const [codigo, setCodigo] = useState<string>(input.contenido.esqueletoInicial)
  const [ejecucion, setEjecucion] = useState<ResultadoEjecucionSuite | null>(null)
  const [ultimoIntento, setUltimoIntento] = useState<IntentoBloqueResponse | null>(null)
  const ejecutor = useEjecutarCodigo()
  const crear = useCrearIntentoBloque()

  const puedeEjecutar = !input.contenido.modoSimple && input.contenidoTests !== null

  const reset = (): void => {
    setCodigo(input.contenido.esqueletoInicial)
    setEjecucion(null)
    setUltimoIntento(null)
  }

  const ejecutar = async (): Promise<void> => {
    // `puedeEjecutar` implica `contenidoTests !== null`; el check defensivo
    // permite usar `input.contenidoTests` sin `!` abajo.
    if (!puedeEjecutar || input.contenidoTests === null || codigo.trim().length === 0) {
      return
    }
    setUltimoIntento(null)
    setEjecucion(null)

    const resultado = await ejecutor.mutateAsync({
      lenguaje: input.contenido.lenguaje as InputEjecucionLenguaje,
      codigo,
      tests: input.contenidoTests.tests,
      timeoutSegPorTest: input.contenido.tiempoLimiteSeg,
    })
    setEjecucion(resultado)

    const resultadosTests: ResultadoTestReportado[] = resultado.resultados.map((r) => ({
      testId: r.testId,
      paso: r.paso,
      estado: r.estado,
      stdoutObtenido: r.stdoutObtenido,
      stderr: r.stderr,
      duracionMs: r.duracionMs,
    }))
    const intento = await crear.mutateAsync({
      body: {
        bloqueId: input.bloqueId,
        cursoId: input.cursoId,
        respuestas: {
          tipo: "CODIGO_PREGUNTAS",
          codigoEnviado: codigo,
          resultadosTests,
        },
      },
    })
    setUltimoIntento(intento)
  }

  return {
    codigo,
    setCodigo,
    reset,
    puedeEjecutar,
    ejecutar,
    isEjecutando: ejecutor.isPending,
    isEnviando: crear.isPending,
    ejecucion,
    ultimoIntento,
    errorEjecucion: ejecutor.error,
  }
}

// `ContenidoCodigoPreguntas.lenguaje` es `string` en el schema (admite valores
// que el editor del admin acepta pero que aún no son ejecutables — `java`,
// `go`...). La guarda `puedeEjecutar` se apoya en `contenidoTests`, que solo
// existe para los retos auto-corregibles; el runner se llama únicamente con
// los 3 lenguajes soportados (`LenguajeEjecutable`).
type InputEjecucionLenguaje = "javascript" | "typescript" | "python"
