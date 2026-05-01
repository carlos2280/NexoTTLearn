import { type ArgumentMetadata, BadRequestException, type PipeTransform } from "@nestjs/common"
import type { ZodSchema } from "zod"

export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodSchema<T>) {}

  transform(value: unknown, _metadata: ArgumentMetadata): T {
    const result = this.schema.safeParse(value)
    if (!result.success) {
      throw new BadRequestException({
        message: "Validacion fallida",
        errors: result.error.flatten().fieldErrors,
      })
    }
    return result.data
  }
}
