import type { TestStdinStdout } from "@nexott-learn/shared-types"
import { decidirPaso } from "./comparar-stdout"
import type {
  InputEjecucionSuite,
  ResultadoEjecucion,
  ResultadoEjecucionSuite,
  ResultadoTestUI,
  SolicitudEjecucion,
} from "./types"
import SandboxWorker from "./workers/sandbox.worker?worker"

/**
 * Ejecuta el código del participante contra cada test de la suite y devuelve
 * los resultados por test ya normalizados (mismo criterio que el evaluador
 * antiguo: trim + colapso de CRLF).
 *
 * Estrategia anti-bucle-infinito: cada test usa `Promise.race` con un
 * `setTimeout`. Si el timeout gana, `worker.terminate()` mata el hilo en
 * caliente y reporta `estado: timeout`. Reusamos el worker entre tests del
 * mismo run para no pagar el coste de cargar Pyodide más de una vez; si un
 * test agota timeout descartamos el worker y arrancamos uno fresco para el
 * siguiente test.
 */
export async function ejecutarSuite(input: InputEjecucionSuite): Promise<ResultadoEjecucionSuite> {
  const timeoutMs = input.timeoutSegPorTest * 1000
  let worker: Worker = new SandboxWorker()
  const resultados: ResultadoTestUI[] = []
  let testsPasados = 0

  try {
    for (const test of input.tests) {
      const outcome = await ejecutarTest(worker, {
        test,
        lenguaje: input.lenguaje,
        codigo: input.codigo,
        timeoutMs,
      })
      if (outcome.paso) {
        testsPasados += 1
      }
      resultados.push(outcome)
      if (outcome.estado === "timeout") {
        // El worker quedó atrapado en código del participante; mátalo y
        // arranca uno limpio para el resto de la suite.
        worker.terminate()
        worker = new SandboxWorker()
      }
    }
    return { resultados, testsPasados, testsTotales: input.tests.length }
  } finally {
    worker.terminate()
  }
}

interface InputEjecutarTest {
  readonly test: TestStdinStdout
  readonly lenguaje: InputEjecucionSuite["lenguaje"]
  readonly codigo: string
  readonly timeoutMs: number
}

async function ejecutarTest(worker: Worker, input: InputEjecutarTest): Promise<ResultadoTestUI> {
  const solicitud: SolicitudEjecucion = {
    id: input.test.id,
    lenguaje: input.lenguaje,
    codigo: input.codigo,
    stdin: input.test.entrada,
    timeoutMs: input.timeoutMs,
  }

  const resultado = await postarConTimeout(worker, solicitud, input.timeoutMs)
  const paso = decidirPaso(resultado, input.test)
  return {
    testId: input.test.id,
    descripcion: input.test.descripcion,
    visible: input.test.visible,
    paso,
    estado: resultado.estado,
    stdoutObtenido: resultado.stdout,
    stdoutEsperado: input.test.salidaEsperada,
    stderr: resultado.stderr,
    duracionMs: Math.round(resultado.duracionMs),
  }
}

interface OutcomeTimeout {
  readonly kind: "timeout"
}
interface OutcomeResult {
  readonly kind: "ok"
  readonly resultado: ResultadoEjecucion
}
type Outcome = OutcomeTimeout | OutcomeResult

function postarConTimeout(
  worker: Worker,
  solicitud: SolicitudEjecucion,
  timeoutMs: number,
): Promise<ResultadoEjecucion> {
  return new Promise<ResultadoEjecucion>((resolve, reject) => {
    // Box mutable para que `cleanup` (closure definida antes que el setTimeout)
    // pueda acceder al handle del timer una vez creado.
    const timer: { handle: number | undefined } = { handle: undefined }
    const onMessage = (event: MessageEvent<ResultadoEjecucion>): void => {
      if (event.data.id !== solicitud.id) {
        return
      }
      cleanup({ kind: "ok", resultado: event.data })
    }
    const onError = (error: ErrorEvent): void => {
      worker.removeEventListener("message", onMessage)
      worker.removeEventListener("error", onError)
      if (timer.handle !== undefined) {
        clearTimeout(timer.handle)
      }
      reject(new Error(error.message || "Worker error"))
    }
    const cleanup = (outcome: Outcome): void => {
      worker.removeEventListener("message", onMessage)
      worker.removeEventListener("error", onError)
      if (timer.handle !== undefined) {
        clearTimeout(timer.handle)
      }
      if (outcome.kind === "timeout") {
        resolve({
          id: solicitud.id,
          estado: "timeout",
          stdout: "",
          stderr: `Tiempo limite excedido (${timeoutMs}ms).`,
          duracionMs: timeoutMs,
        })
      } else {
        resolve(outcome.resultado)
      }
    }
    worker.addEventListener("message", onMessage)
    worker.addEventListener("error", onError)
    timer.handle = self.setTimeout(() => cleanup({ kind: "timeout" }), timeoutMs)
    worker.postMessage(solicitud)
  })
}
