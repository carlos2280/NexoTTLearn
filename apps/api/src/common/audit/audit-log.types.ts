import { AccionAuditoria, Prisma } from "@prisma/client"

export { AccionAuditoria }

/**
 * Input para `AuditLogService.record()`. Solo metadatos.
 *
 * - `usuarioId`: identidad SIEMPRE de la sesion del request, nunca del body.
 *   Puede ser `null` cuando el evento ocurre antes de tener un usuario asociado
 *   (ej. LOGIN_FAIL con email inexistente).
 * - `recursoTipo`/`recursoId`: para acciones administrativas que tocan otra
 *   entidad (ej. `usuario` / `usuarioObjetivoId` en regenerar password).
 * - `ip`/`userAgent`/`requestId`: extraidos del `Request` por
 *   `extractContextoHttp`. Nunca contienen body, cookies ni tokens.
 * - `metadata`: payload JSONB opcional para enriquecer la auditoria con datos
 *   estructurales no sensibles (motivo del admin, contadores de referencias
 *   migradas, ids de recursos relacionados). Tipado con `Prisma.InputJsonValue`
 *   para que Prisma valide su forma al persistir. NUNCA debe contener
 *   passwordHash, tokens, cookies ni el body crudo de la request.
 */
export interface AuditLogInput {
  readonly usuarioId: string | null
  readonly accion: AccionAuditoria
  readonly exito: boolean
  readonly recursoTipo?: string
  readonly recursoId?: string
  readonly ip?: string
  readonly userAgent?: string
  readonly requestId?: string
  readonly metadata?: Prisma.InputJsonValue
}

export interface ContextoHttpAuditoria {
  readonly ip?: string
  readonly userAgent?: string
  readonly requestId?: string
}
