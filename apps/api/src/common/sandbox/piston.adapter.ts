import { Injectable, Logger } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import type { LenguajeEjecutable } from "@nexott-learn/shared-types"
import type { AppEnv } from "../../config/env.validation"
import type { EjecutarCodigoInput, EjecutarCodigoResultado, ISandboxService } from "./sandbox.types"

/**
 * Adaptador de Piston (https://github.com/engineer-man/piston).
 *
 * Piston ejecuta codigo en `nsjail` con limites de CPU/memoria. Se pueden
 * desplegar muchos `runtimes` (versiones de cada lenguaje). El MVP usa los
 * defaults que vienen con la imagen `ghcr.io/engineer-man/piston`.
 *
 * Endpoint:
 *   POST {SANDBOX_URL}/api/v2/execute
 *
 * Body:
 *   { language, version, files: [{ content }], stdin, run_timeout, compile_timeout }
 *
 * Respuesta relevante:
 *   { run: { stdout, stderr, code, signal, output } }
 *   `signal` !== null indica que el proceso fue matado (TIMEOUT en Piston
 *   se manifiesta como `signal === "SIGKILL"` y `stdout`/`stderr` cortados).
 */

interface PistonExecuteBody {
  readonly language: string
  readonly version: string
  readonly files: ReadonlyArray<{ readonly content: string }>
  readonly stdin: string
  // biome-ignore lint/style/useNamingConvention: campo de la API de Piston.
  readonly run_timeout: number
  // biome-ignore lint/style/useNamingConvention: campo de la API de Piston.
  readonly compile_timeout: number
}

interface PistonExecuteResponse {
  readonly run?: {
    readonly stdout: string
    readonly stderr: string
    readonly code: number | null
    readonly signal: string | null
  }
  readonly compile?: {
    readonly stdout: string
    readonly stderr: string
    readonly code: number | null
    readonly signal: string | null
  }
  readonly message?: string
}

/**
 * Mapeo de nuestro `LenguajeEjecutable` a (language, version) de Piston.
 * `*` deja que Piston elija la version mas reciente instalada.
 */
const PISTON_LANGUAGE: Record<LenguajeEjecutable, { language: string; version: string }> = {
  javascript: { language: "javascript", version: "*" },
  typescript: { language: "typescript", version: "*" },
  python: { language: "python", version: "*" },
}

/**
 * Nombre del archivo que Piston usa para guardar el codigo del usuario. La
 * extension debe coincidir con el lenguaje para que el runtime lo compile.
 */
const PISTON_FILENAME: Record<LenguajeEjecutable, string> = {
  javascript: "main.js",
  typescript: "main.ts",
  python: "main.py",
}

/** Compilado una sola vez: elimina trailing slash en la URL base. */
const TRAILING_SLASH = /\/$/

@Injectable()
export class PistonAdapter implements ISandboxService {
  private readonly logger = new Logger(PistonAdapter.name)
  private readonly baseUrl: string
  private readonly timeoutMs: number

  constructor(configService: ConfigService<AppEnv, true>) {
    this.baseUrl = configService.get("SANDBOX_URL", { infer: true })
    this.timeoutMs = configService.get("SANDBOX_TIMEOUT_MS", { infer: true })
  }

  async ejecutar(input: EjecutarCodigoInput): Promise<EjecutarCodigoResultado> {
    const inicio = Date.now()
    const { language, version } = PISTON_LANGUAGE[input.lenguaje]
    const filename = PISTON_FILENAME[input.lenguaje]
    const body: PistonExecuteBody = {
      language,
      version,
      files: [{ content: input.codigo }],
      stdin: input.stdin,
      // biome-ignore lint/style/useNamingConvention: campo de la API de Piston.
      run_timeout: input.timeoutSeg * 1000,
      // biome-ignore lint/style/useNamingConvention: campo de la API de Piston.
      compile_timeout: input.timeoutSeg * 1000,
    }

    const abort = new AbortController()
    const abortTimer = setTimeout(() => abort.abort(), this.timeoutMs)
    try {
      const url = `${this.baseUrl.replace(TRAILING_SLASH, "")}/api/v2/execute`
      const httpResponse = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Filename": filename,
        },
        body: JSON.stringify(body),
        signal: abort.signal,
      })
      if (!httpResponse.ok) {
        const errorBody = await this.safeReadText(httpResponse)
        this.logger.warn(`Piston respondio ${httpResponse.status}: ${errorBody.slice(0, 200)}`)
        return {
          estado: "fallo",
          stdout: "",
          stderr: errorBody.slice(0, 1000),
          duracionMs: Date.now() - inicio,
          exitCode: null,
        }
      }
      const data = (await httpResponse.json()) as PistonExecuteResponse
      return this.mapearRespuesta(data, Date.now() - inicio)
    } catch (error) {
      const esTimeout = error instanceof Error && error.name === "AbortError"
      if (!esTimeout) {
        const detalle = error instanceof Error ? error.message : "error desconocido"
        this.logger.warn(`Piston llamada fallo: ${detalle}`)
      }
      return {
        estado: esTimeout ? "timeout" : "fallo",
        stdout: "",
        stderr: esTimeout ? "TIMEOUT" : "SANDBOX_UNREACHABLE",
        duracionMs: Date.now() - inicio,
        exitCode: null,
      }
    } finally {
      clearTimeout(abortTimer)
    }
  }

  private mapearRespuesta(
    data: PistonExecuteResponse,
    duracionMs: number,
  ): EjecutarCodigoResultado {
    // Fallo de compilacion (TS, lenguajes con compile step).
    if (data.compile && data.compile.code !== 0 && data.compile.code !== null) {
      return {
        estado: "fallo",
        stdout: data.compile.stdout ?? "",
        stderr: data.compile.stderr || "COMPILE_ERROR",
        duracionMs,
        exitCode: data.compile.code,
      }
    }
    const run = data.run
    if (!run) {
      return {
        estado: "fallo",
        stdout: "",
        stderr: data.message ?? "PISTON_RESPONSE_SIN_RUN",
        duracionMs,
        exitCode: null,
      }
    }
    // Piston mata por SIGKILL cuando excede `run_timeout`.
    if (run.signal === "SIGKILL") {
      return {
        estado: "timeout",
        stdout: run.stdout,
        stderr: run.stderr,
        duracionMs,
        exitCode: run.code,
      }
    }
    return {
      estado: "ok",
      stdout: run.stdout,
      stderr: run.stderr,
      duracionMs,
      exitCode: run.code,
    }
  }

  private async safeReadText(response: Response): Promise<string> {
    try {
      return await response.text()
    } catch {
      return ""
    }
  }
}
