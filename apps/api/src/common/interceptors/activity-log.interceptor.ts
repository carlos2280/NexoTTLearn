import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from "@nestjs/common"
import { Request } from "express"
import { Observable } from "rxjs"
import { tap } from "rxjs/operators"

/**
 * Logger estructurado por request (convenciones API §16, OWASP A09).
 *
 * Formato: `METHOD URL | usuario=<id|anonimo> | rid=<requestId> | <duracion>ms`
 *
 * No registra cuerpos ni headers que puedan contener datos sensibles
 * (passwords, tokens). El logging detallado de acciones criticas se delega
 * a la tabla de auditoria (P3+).
 *
 * Slice 0: definido y disponible. Su registro como APP_INTERCEPTOR queda
 * para Slice P1 (observabilidad) cuando se introduzca pino.
 */
@Injectable()
export class ActivityLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger("ActivityLog")

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>()
    const inicio = Date.now()
    const { method, url } = request
    const usuarioId = request.session?.usuarioId ?? "anonimo"
    const headerRequestId = request.headers["x-request-id"]
    const requestId = typeof headerRequestId === "string" ? headerRequestId : "-"

    return next.handle().pipe(
      tap({
        next: () => {
          const duracion = Date.now() - inicio
          this.logger.log(
            `${method} ${url} | usuario=${usuarioId} | rid=${requestId} | ${duracion}ms`,
          )
        },
        error: (err: unknown) => {
          const duracion = Date.now() - inicio
          const mensaje = err instanceof Error ? err.message : "error desconocido"
          this.logger.warn(
            `${method} ${url} | usuario=${usuarioId} | rid=${requestId} | ${duracion}ms | ERROR: ${mensaje}`,
          )
        },
      }),
    )
  }
}
