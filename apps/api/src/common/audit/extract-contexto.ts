import { Request } from "express"
import { ContextoHttpAuditoria } from "./audit-log.types"

const HEADER_REQUEST_ID = "x-request-id"
const HEADER_USER_AGENT = "user-agent"
const MAX_USER_AGENT_LENGTH = 512

/**
 * Extrae los metadatos HTTP que persiste el audit log: ip, user-agent y
 * requestId. NO toca body ni cookies. El `requestId` lo inyecta antes el
 * middleware `crearMiddlewareRequestId` (request-id-middleware.ts).
 *
 * El `userAgent` se trunca a 512 chars para evitar abuso del header.
 */
export function extractContextoHttp(req: Request): ContextoHttpAuditoria {
  const requestIdHeader = req.headers[HEADER_REQUEST_ID]
  const requestId =
    typeof requestIdHeader === "string" && requestIdHeader.length > 0 ? requestIdHeader : undefined

  const userAgentHeader = req.headers[HEADER_USER_AGENT]
  const userAgent =
    typeof userAgentHeader === "string" && userAgentHeader.length > 0
      ? userAgentHeader.slice(0, MAX_USER_AGENT_LENGTH)
      : undefined

  const ip = typeof req.ip === "string" && req.ip.length > 0 ? req.ip : undefined

  return { ip, userAgent, requestId }
}
