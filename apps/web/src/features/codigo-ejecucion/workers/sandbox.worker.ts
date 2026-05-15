/// <reference lib="WebWorker" />

import { type PyodideInterface, loadPyodide } from "pyodide"
import { transform } from "sucrase"
import type { ResultadoEjecucion, SolicitudEjecucion } from "../types"

/**
 * Sandbox worker — ejecuta el código del participante en un hilo aparte para
 * no bloquear la UI durante runs largos. La estrategia depende del lenguaje:
 *
 *  - python:     Pyodide (CPython 3.12 sobre WASM). Carga lazy en el primer
 *                request Python (1ª llamada ~3-5s, siguientes <50ms). El
 *                runtime se baja desde el CDN oficial vía `indexURL` para no
 *                obligar a Vite a empacar ~6MB de wasm.
 *  - typescript: Transpila a JS con sucrase (síncrono) y ejecuta como JS.
 *  - javascript: Eval directo en el worker.
 *
 * El worker NO impone timeout: el hilo principal usa `worker.terminate()` si
 * el run no responde en `timeoutMs`. Esto es necesario porque dentro del
 * worker no podemos cortar un `eval` síncrono ni Python que esté en bucle.
 *
 * Cada solicitud crea un contexto fresco — no comparte stdout/locals con
 * solicitudes previas. La instancia de Pyodide sí se reusa entre tests Python
 * para no pagar el coste de carga otra vez.
 */

declare const self: DedicatedWorkerGlobalScope

const PYODIDE_INDEX_URL = "https://cdn.jsdelivr.net/pyodide/v0.29.4/full/"

let pyodidePromise: Promise<PyodideInterface> | null = null

function obtenerPyodide(): Promise<PyodideInterface> {
  if (!pyodidePromise) {
    pyodidePromise = loadPyodide({ indexURL: PYODIDE_INDEX_URL })
  }
  return pyodidePromise
}

self.addEventListener("message", (event: MessageEvent<SolicitudEjecucion>) => {
  const solicitud = event.data
  ejecutar(solicitud)
    .then((resultado) => self.postMessage(resultado))
    .catch((error: unknown) => {
      const resultado: ResultadoEjecucion = {
        id: solicitud.id,
        estado: "fallo",
        stdout: "",
        stderr: error instanceof Error ? error.message : String(error),
        duracionMs: 0,
      }
      self.postMessage(resultado)
    })
})

async function ejecutar(solicitud: SolicitudEjecucion): Promise<ResultadoEjecucion> {
  const inicio = performance.now()
  try {
    if (solicitud.lenguaje === "python") {
      return await ejecutarPython(solicitud, inicio)
    }
    return ejecutarJavascript(solicitud, inicio)
  } catch (error) {
    return {
      id: solicitud.id,
      estado: "fallo",
      stdout: "",
      stderr: error instanceof Error ? error.message : String(error),
      duracionMs: performance.now() - inicio,
    }
  }
}

async function ejecutarPython(
  solicitud: SolicitudEjecucion,
  inicio: number,
): Promise<ResultadoEjecucion> {
  const pyodide = await obtenerPyodide()
  let stdout = ""
  let stderr = ""
  pyodide.setStdout({
    batched: (chunk: string) => {
      stdout += chunk
    },
  })
  pyodide.setStderr({
    batched: (chunk: string) => {
      stderr += chunk
    },
  })
  pyodide.setStdin({ stdin: () => solicitud.stdin })

  try {
    await pyodide.runPythonAsync(solicitud.codigo)
    return {
      id: solicitud.id,
      estado: "ok",
      stdout,
      stderr,
      duracionMs: performance.now() - inicio,
    }
  } catch (error) {
    return {
      id: solicitud.id,
      estado: "ok",
      stdout,
      stderr: stderr || (error instanceof Error ? error.message : String(error)),
      duracionMs: performance.now() - inicio,
    }
  } finally {
    // Restablecer stdin para que la siguiente solicitud no herede esta.
    pyodide.setStdin({ stdin: () => "" })
  }
}

function ejecutarJavascript(solicitud: SolicitudEjecucion, inicio: number): ResultadoEjecucion {
  const codigoJs =
    solicitud.lenguaje === "typescript"
      ? transform(solicitud.codigo, {
          transforms: ["typescript", "imports"],
          disableESTransforms: false,
          production: true,
        }).code
      : solicitud.codigo

  const buffersStdout: string[] = []
  const buffersStderr: string[] = []

  const consoleProxy = {
    log: (...args: unknown[]) => buffersStdout.push(args.map(formatear).join(" ")),
    info: (...args: unknown[]) => buffersStdout.push(args.map(formatear).join(" ")),
    warn: (...args: unknown[]) => buffersStderr.push(args.map(formatear).join(" ")),
    error: (...args: unknown[]) => buffersStderr.push(args.map(formatear).join(" ")),
    debug: (...args: unknown[]) => buffersStdout.push(args.map(formatear).join(" ")),
  }

  let stdinRestante = solicitud.stdin
  const readline = (): string | null => {
    if (stdinRestante.length === 0) {
      return null
    }
    const nlIndex = stdinRestante.indexOf("\n")
    if (nlIndex === -1) {
      const linea = stdinRestante
      stdinRestante = ""
      return linea
    }
    const linea = stdinRestante.slice(0, nlIndex)
    stdinRestante = stdinRestante.slice(nlIndex + 1)
    return linea
  }
  const readAll = (): string => {
    const restante = stdinRestante
    stdinRestante = ""
    return restante
  }

  // Wrapper: exponemos `console`, `readline`, `readAll` y `stdin` al código
  // del participante. Esto cubre los patrones más comunes en retos didácticos
  // sin obligar a usar `process.stdin`.
  const fn = new Function(
    "console",
    "readline",
    "readAll",
    "stdin",
    `"use strict";\n${codigoJs}\nif (typeof main === "function") { main(); }`,
  )
  try {
    fn(consoleProxy, readline, readAll, solicitud.stdin)
    return {
      id: solicitud.id,
      estado: "ok",
      stdout: buffersStdout.join("\n"),
      stderr: buffersStderr.join("\n"),
      duracionMs: performance.now() - inicio,
    }
  } catch (error) {
    return {
      id: solicitud.id,
      estado: "ok",
      stdout: buffersStdout.join("\n"),
      stderr:
        buffersStderr.join("\n") +
        (buffersStderr.length > 0 ? "\n" : "") +
        (error instanceof Error ? `${error.name}: ${error.message}` : String(error)),
      duracionMs: performance.now() - inicio,
    }
  }
}

function formatear(valor: unknown): string {
  if (typeof valor === "string") {
    return valor
  }
  try {
    return JSON.stringify(valor)
  } catch {
    return String(valor)
  }
}
