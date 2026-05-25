import { Injectable } from "@nestjs/common"
import { EnvioArgs, EnvioResultado, IEmailProvider } from "./email-provider.interface"

/**
 * Provider mock para tests (D-S10-B2 + Slice 12 P12 D-S12-B1..B5).
 *
 * Almacena todas las llamadas en memoria para asserts. Nunca toca red ni
 * la SDK real de Resend. Se resuelve cuando `NODE_ENV=test` en el factory
 * del modulo.
 *
 * §5.123 fix (D-S12-B1/B2): el provider se registra en `globalThis` con un
 * `Symbol.for(...)` para garantizar una unica instancia compartida entre el
 * `app` Nest cargado desde `dist/` (CJS) y el spec Vitest que importa el mock
 * para hacer asserts (ESM). Sin esto, Nest resolvia su instancia y el spec
 * resolvia otra distinta, dejando los asserts sobre `obtenerLlamadas()`
 * permanentemente en 0 (lo que mantenia §5.131 con 4 e2e skipped).
 *
 * `Symbol.for(...)` accede al registry global de simbolos: la misma clave
 * resuelve a la misma instancia independientemente del realm o el formato
 * (CJS vs ESM) desde el que se importe este archivo.
 */

const MOCK_PROVIDER_KEY = Symbol.for("nexott-learn.mock-email-provider")

type GlobalConKey = Record<symbol, unknown>

/**
 * Lista mutable compartida via `globalThis` para los emails recibidos en
 * tests. Si un realm (Vitest ESM) crea una instancia distinta del provider
 * que Nest registro en `dist/` (CJS), ambas leen y escriben sobre el mismo
 * array — D-S12-B1/B2.
 */
interface RegistroGlobal {
  llamadas: EnvioArgs[]
  respuestaProgramada: EnvioResultado
}

function obtenerRegistroGlobal(): RegistroGlobal {
  const registry = globalThis as unknown as GlobalConKey
  const existing = registry[MOCK_PROVIDER_KEY]
  if (existing && typeof existing === "object" && "llamadas" in existing) {
    return existing as RegistroGlobal
  }
  const creado: RegistroGlobal = { llamadas: [], respuestaProgramada: { enviado: true } }
  registry[MOCK_PROVIDER_KEY] = creado
  return creado
}

@Injectable()
export class MockEmailProvider implements IEmailProvider {
  public readonly providerName = "mock" as const

  private readonly registro = obtenerRegistroGlobal()

  /**
   * Devuelve la instancia compartida sin pasar por Nest DI. Util para que un
   * spec e2e (que carga `dist/` dinamicamente) obtenga la misma vista del
   * registro que Nest registro por inyeccion (R-S12-2 mitigacion).
   */
  static instance(): MockEmailProvider {
    return new MockEmailProvider()
  }

  enviar(args: EnvioArgs): Promise<EnvioResultado> {
    this.registro.llamadas.push(args)
    return Promise.resolve(this.registro.respuestaProgramada)
  }

  /** Programa la siguiente respuesta. Util para simular fallos en tests. */
  programarRespuesta(respuesta: EnvioResultado): void {
    this.registro.respuestaProgramada = respuesta
  }

  /** Devuelve la lista inmutable de llamadas para asserts. */
  obtenerLlamadas(): readonly EnvioArgs[] {
    return [...this.registro.llamadas]
  }

  /** Resetea estado entre tests. */
  resetear(): void {
    this.registro.llamadas.length = 0
    this.registro.respuestaProgramada = { enviado: true }
  }
}
