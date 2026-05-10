import { BadRequestException, Injectable, PipeTransform } from "@nestjs/common"
import { ZodError, ZodSchema } from "zod"
import { apiErrorCodes } from "../errors/api-error.codes"

/**
 * Pipe de validacion basado en Zod (convenciones API §9).
 *
 * Se aplica por endpoint (NO global): ValidationPipe global de Nest opera
 * sobre class-validator y entra en conflicto con la transformacion de Zod.
 *
 * Uso:
 *   @UsePipes(new ZodValidationPipe(crearCursoSchema))
 *   async crear(@Body() input: CrearCursoInput) { ... }
 */
@Injectable()
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodSchema<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value)
    if (!result.success) {
      throw new BadRequestException({
        code: apiErrorCodes.invalidBody,
        message: "El cuerpo de la peticion no cumple el contrato.",
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
