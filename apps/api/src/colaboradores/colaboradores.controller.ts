import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
} from "@nestjs/common"
import {
  CrearColaboradorInput,
  EntradaHistoricoNotaSkill,
  FichaResponse,
  PaginacionQuery,
  Paginated,
  crearColaboradorSchema,
  paginacionQuerySchema,
} from "@nexott-learn/shared-types"
import { RolUsuario } from "@prisma/client"
import { Request } from "express"
import { extractContextoHttp } from "../common/audit/extract-contexto"
import { CurrentUser } from "../common/decorators/current-user.decorator"
import { Roles } from "../common/decorators/roles.decorator"
import { apiErrorCodes } from "../common/errors/api-error.codes"
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe"
import { SesionUsuario } from "../common/types/sesion.types"
import { ColaboradoresService } from "./colaboradores.service"
import { AltaColaboradorResponse } from "./colaboradores.types"
import { FichaService } from "./ficha/ficha.service"

@Controller("colaboradores")
export class ColaboradoresController {
  constructor(
    private readonly colaboradoresService: ColaboradoresService,
    private readonly fichaService: FichaService,
  ) {}

  @Post()
  @Roles(RolUsuario.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async crear(
    @Body(new ZodValidationPipe(crearColaboradorSchema)) input: CrearColaboradorInput,
    @CurrentUser() admin: SesionUsuario | undefined,
    @Req() req: Request,
  ): Promise<AltaColaboradorResponse> {
    return await this.colaboradoresService.crear(
      input,
      this.requireUsuario(admin).usuarioId,
      extractContextoHttp(req),
    )
  }

  @Get(":colaboradorId/ficha")
  @Roles(RolUsuario.ADMIN, RolUsuario.PARTICIPANTE)
  async obtenerFicha(
    @Param("colaboradorId", ParseUUIDPipe) colaboradorId: string,
    @CurrentUser() usuario: SesionUsuario | undefined,
  ): Promise<FichaResponse> {
    return await this.fichaService.obtenerFicha(colaboradorId, this.requireUsuario(usuario))
  }

  @Get(":colaboradorId/ficha/skills/:skillId/historico")
  @Roles(RolUsuario.ADMIN, RolUsuario.PARTICIPANTE)
  async historicoSkill(
    @Param("colaboradorId", ParseUUIDPipe) colaboradorId: string,
    @Param("skillId", ParseUUIDPipe) skillId: string,
    @Query(new ZodValidationPipe(paginacionQuerySchema)) query: PaginacionQuery,
    @CurrentUser() usuario: SesionUsuario | undefined,
  ): Promise<Paginated<EntradaHistoricoNotaSkill>> {
    return await this.fichaService.listarHistoricoSkill(
      colaboradorId,
      skillId,
      query,
      this.requireUsuario(usuario),
    )
  }

  private requireUsuario(usuario: SesionUsuario | undefined): SesionUsuario {
    if (!usuario) {
      throw new InternalServerErrorException({
        code: apiErrorCodes.errorInterno,
        message: "Sesion invalida tras pasar guards.",
      })
    }
    return usuario
  }
}
