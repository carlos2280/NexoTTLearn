import { Injectable } from "@nestjs/common"
import { EnvioArgs, EnvioResultado, IEmailProvider } from "./email-provider.interface"

/**
 * Provider mock para tests (D-S10-B2).
 *
 * Almacena todas las llamadas en memoria para asserts. Nunca toca red ni
 * la SDK real de Resend. Se resuelve cuando `NODE_ENV=test` en el factory
 * del modulo.
 */
@Injectable()
export class MockEmailProvider implements IEmailProvider {
  public readonly providerName = "mock" as const

  private readonly llamadas: EnvioArgs[] = []
  private respuestaProgramada: EnvioResultado = { enviado: true }

  enviar(args: EnvioArgs): Promise<EnvioResultado> {
    this.llamadas.push(args)
    return Promise.resolve(this.respuestaProgramada)
  }

  /** Programa la siguiente respuesta. Util para simular fallos en tests. */
  programarRespuesta(respuesta: EnvioResultado): void {
    this.respuestaProgramada = respuesta
  }

  /** Devuelve la lista inmutable de llamadas para asserts. */
  obtenerLlamadas(): readonly EnvioArgs[] {
    return [...this.llamadas]
  }

  /** Resetea estado entre tests. */
  resetear(): void {
    this.llamadas.length = 0
    this.respuestaProgramada = { enviado: true }
  }
}
