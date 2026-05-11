import { BadRequestException, ExecutionContext, createParamDecorator } from "@nestjs/common"
import { Request } from "express"
import { z } from "zod"
import { apiErrorCodes } from "../errors/api-error.codes"

/**
 * Esquema Zod para el contenido del header `X-Motivo` (convenciones API §14, A09).
 *
 * Caracteres permitidos: letras unicode (`\p{L}`), digitos (`\p{N}`), espacio
 * simple (U+0020), y los signos `.,;:()-/`. Excluye explicitamente saltos de
 * linea (`\n`, `\r`), tabuladores, NUL y caracteres de control para mitigar
 * log poisoning si el motivo se renderiza aguas abajo. Longitud 1..500.
 */
const motivoRegex = /^[\p{L}\p{N} .,;:()\-/]{1,500}$/u

export const motivoSchema = z.string().regex(motivoRegex)

/**
 * Factory pura del decorator `@Motivo()`, expuesta para testing.
 *
 * - Header ausente o solo whitespace -> devuelve `undefined` (la obligatoriedad
 *   la gobierna `@RequiereMotivo()` aguas arriba con `MotivoGuard`).
 * - Header presente con caracteres no permitidos o longitud > 500 -> lanza
 *   `BadRequestException` con codigo `MOTIVO_INVALIDO`.
 * - Header presente y valido -> devuelve el valor trimmed.
 */
export function extractMotivo(_data: unknown, ctx: ExecutionContext): string | undefined {
  const request = ctx.switchToHttp().getRequest<Request>()
  const raw = request.headers["x-motivo"]
  if (typeof raw !== "string") {
    return undefined
  }
  const trimmed = raw.trim()
  if (trimmed.length === 0) {
    return undefined
  }
  const parsed = motivoSchema.safeParse(trimmed)
  if (!parsed.success) {
    throw new BadRequestException({
      code: apiErrorCodes.motivoInvalido,
      message: "El header X-Motivo contiene caracteres no permitidos o excede 500 caracteres.",
    })
  }
  return parsed.data
}

/**
 * Extrae y sanea el header `X-Motivo` (convenciones API §14).
 */
export const Motivo = createParamDecorator(extractMotivo)
