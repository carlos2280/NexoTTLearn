import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from "@nestjs/common"
import { ZodError, ZodType, ZodTypeDef } from "zod"
import { apiErrorCodes } from "../errors/api-error.codes"

/**
 * Pipe de validacion basado en Zod (convenciones API §9).
 *
 * Se aplica por endpoint (NO global): ValidationPipe global de Nest opera
 * sobre class-validator y entra en conflicto con la transformacion de Zod.
 *
 * Emite codigos de error distintos segun el origen del valor:
 * - `@Body()`  -> `INVALID_BODY`  ("El cuerpo de la peticion no cumple el contrato.")
 * - `@Query()` -> `INVALID_QUERY` ("Los parametros de consulta no cumplen el contrato.")
 *
 * Uso:
 *   @UsePipes(new ZodValidationPipe(crearCursoSchema))
 *   async crear(@Body() input: CrearCursoInput) { ... }
 */
@Injectable()
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  // `ZodType<T, ZodTypeDef, unknown>` permite schemas con Input distinto del
  // Output — caso comun cuando se usan `.default()`, `.coerce.*` o
  // `.transform()` (FIX P10b — listarNotificacionesQuerySchema combina varios).
  constructor(private readonly schema: ZodType<T, ZodTypeDef, unknown>) {}

  transform(value: unknown, metadata: ArgumentMetadata): T {
    const result = this.schema.safeParse(value)
    if (!result.success) {
      const isQuery = metadata.type === "query"
      throw new BadRequestException({
        code: isQuery ? apiErrorCodes.invalidQuery : apiErrorCodes.invalidBody,
        message: isQuery
          ? "Los parametros de consulta no cumplen el contrato."
          : "El cuerpo de la peticion no cumple el contrato.",
        details: this.formatErrors(result.error),
      })
    }
    return result.data
  }

  private formatErrors(error: ZodError): Record<string, readonly string[]> {
    const acumulado: Record<string, string[]> = {}
    for (const issue of error.issues) {
      const path = issue.path.length > 0 ? issue.path.join(".") : "root"
      const lista = acumulado[path] ?? []
      lista.push(issue.message)
      acumulado[path] = lista
    }
    return acumulado
  }
}
