import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common"
import { CrearColaboradorInput, crearColaboradorSchema } from "@nexott-learn/shared-types"
import { RolUsuario } from "@prisma/client"
import { Roles } from "../common/decorators/roles.decorator"
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe"
import { ColaboradoresService } from "./colaboradores.service"
import { AltaColaboradorResponse } from "./colaboradores.types"

@Controller("colaboradores")
export class ColaboradoresController {
  constructor(private readonly colaboradoresService: ColaboradoresService) {}

  @Post()
  @Roles(RolUsuario.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async crear(
    @Body(new ZodValidationPipe(crearColaboradorSchema)) input: CrearColaboradorInput,
  ): Promise<AltaColaboradorResponse> {
    return await this.colaboradoresService.crear(input)
  }
}
