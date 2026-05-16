import { randomUUID } from "node:crypto"
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common"
import { Request, Response } from "express"
import { Observable } from "rxjs"

const HEADER_REQUEST_ID = "x-request-id"

/**
 * Garantiza un identificador de correlacion por request (convenciones API §16).
 * Si el cliente envia `X-Request-Id`, se respeta y se devuelve en la respuesta.
 * Si no lo envia, se genera uno UUIDv4. El header expuesto via CORS lo permite
 * leer al frontend para incluirlo en reportes de error.
 */
@Injectable()
export class RequestIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp()
    const request = http.getRequest<Request>()
    const response = http.getResponse<Response>()

    const incoming = request.headers[HEADER_REQUEST_ID]
    const requestId = typeof incoming === "string" && incoming.length > 0 ? incoming : randomUUID()

    request.headers[HEADER_REQUEST_ID] = requestId
    response.setHeader("X-Request-Id", requestId)

    return next.handle()
  }
}
