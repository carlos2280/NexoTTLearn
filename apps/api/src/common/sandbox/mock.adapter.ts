import { Injectable, Logger } from "@nestjs/common"
import type { EjecutarCodigoInput, EjecutarCodigoResultado, ISandboxService } from "./sandbox.types"

/**
 * Adaptador mock del sandbox para tests + entornos sin Piston disponible.
 *
 * Estrategia (suficiente para Vitest y dev offline):
 *  - Si el codigo coincide con un patron `// MOCK_STDOUT: <texto>`, devuelve
 *    ese texto. Permite a los tests forzar resultados sin ejecutar nada.
 *  - Si el codigo no trae directiva, devuelve `stdin` tal cual (echo).
 *  - El estado siempre es `"ok"` con `exitCode=0` salvo que el codigo lleve
 *    `// MOCK_TIMEOUT` (→ timeout) o `// MOCK_FALLO` (→ fallo).
 *
 * En produccion NUNCA debe registrarse este adaptador (env validation
 * asegura `SANDBOX_PROVIDER=piston`).
 */
const MOCK_STDOUT_DIRECTIVA = /\/\/ MOCK_STDOUT:\s*(.+)/

@Injectable()
export class MockSandboxAdapter implements ISandboxService {
  private readonly logger = new Logger(MockSandboxAdapter.name)

  // biome-ignore lint/suspicious/useAwait: signature async requerida por la interfaz ISandboxService.
  async ejecutar(input: EjecutarCodigoInput): Promise<EjecutarCodigoResultado> {
    this.logger.debug(`Mock sandbox ejecutando ${input.lenguaje} (${input.codigo.length} bytes)`)
    if (input.codigo.includes("// MOCK_TIMEOUT")) {
      return {
        estado: "timeout",
        stdout: "",
        stderr: "MOCK_TIMEOUT",
        duracionMs: 1,
        exitCode: null,
      }
    }
    if (input.codigo.includes("// MOCK_FALLO")) {
      return {
        estado: "fallo",
        stdout: "",
        stderr: "MOCK_FALLO",
        duracionMs: 1,
        exitCode: 1,
      }
    }
    const directiva = input.codigo.match(MOCK_STDOUT_DIRECTIVA)
    const stdout = directiva ? directiva[1] : input.stdin
    return {
      estado: "ok",
      stdout: stdout ?? "",
      stderr: "",
      duracionMs: 1,
      exitCode: 0,
    }
  }
}
