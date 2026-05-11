import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
} from "@nestjs/common"
import {
  CrearSkillInput,
  ListarSkillsQuery,
  Paginated,
  RenombrarSkillInput,
  SkillResponse,
  crearSkillSchema,
  listarSkillsQuerySchema,
  renombrarSkillSchema,
} from "@nexott-learn/shared-types"
import { RolUsuario } from "@prisma/client"
import { Request } from "express"
import { extractContextoHttp } from "../../common/audit/extract-contexto"
import { CurrentUser } from "../../common/decorators/current-user.decorator"
import { Motivo } from "../../common/decorators/motivo.decorator"
import { RequiereMotivo } from "../../common/decorators/requiere-motivo.decorator"
import { Roles } from "../../common/decorators/roles.decorator"
import { apiErrorCodes } from "../../common/errors/api-error.codes"
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe"
import { SesionUsuario } from "../../common/types/sesion.types"
import { CoberturaSkillResponse, HistoricoSkillResponse, SkillsService } from "./skills.service"

const HEADER_FORZAR = "x-forzar-creacion"

function parsearForzarCreacion(header: string | undefined): boolean {
  return typeof header === "string" && header.trim().toLowerCase() === "true"
}

@Controller("catalogo/skills")
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @Get()
  @Roles(RolUsuario.ADMIN, RolUsuario.PARTICIPANTE)
  async listar(
    @Query(new ZodValidationPipe(listarSkillsQuerySchema)) query: ListarSkillsQuery,
  ): Promise<Paginated<SkillResponse>> {
    return await this.skillsService.listar(query)
  }

  @Get(":id")
  @Roles(RolUsuario.ADMIN, RolUsuario.PARTICIPANTE)
  async obtener(@Param("id", ParseUUIDPipe) id: string): Promise<SkillResponse> {
    return await this.skillsService.obtenerPorIdOrThrow(id)
  }

  @Post()
  @Roles(RolUsuario.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async crear(
    @Body(new ZodValidationPipe(crearSkillSchema)) input: CrearSkillInput,
    @Headers(HEADER_FORZAR) forzarHeader: string | undefined,
    @CurrentUser() admin: SesionUsuario | undefined,
    @Req() req: Request,
  ): Promise<SkillResponse> {
    if (!admin) {
      throw new InternalServerErrorException({
        code: apiErrorCodes.errorInterno,
        message: "Sesion invalida tras pasar guards.",
      })
    }
    return await this.skillsService.crear(
      input,
      { forzarCreacion: parsearForzarCreacion(forzarHeader) },
      admin.usuarioId,
      extractContextoHttp(req),
    )
  }

  @Patch(":id")
  @Roles(RolUsuario.ADMIN)
  @RequiereMotivo()
  async renombrar(
    @Param("id", ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(renombrarSkillSchema)) input: RenombrarSkillInput,
    @Motivo() motivo: string | undefined,
    @CurrentUser() admin: SesionUsuario | undefined,
    @Req() req: Request,
  ): Promise<SkillResponse> {
    if (!admin) {
      throw new InternalServerErrorException({
        code: apiErrorCodes.errorInterno,
        message: "Sesion invalida tras pasar guards.",
      })
    }
    // El MotivoGuard global ya rechaza si falta; el undefined aqui solo cubre tipos.
    const motivoFinal = motivo ?? ""
    return await this.skillsService.renombrar(
      id,
      input,
      motivoFinal,
      admin.usuarioId,
      extractContextoHttp(req),
    )
  }

  @Post(":id/archivar")
  @Roles(RolUsuario.ADMIN)
  @RequiereMotivo()
  @HttpCode(HttpStatus.NO_CONTENT)
  async archivar(
    @Param("id", ParseUUIDPipe) id: string,
    @Motivo() motivo: string | undefined,
    @CurrentUser() admin: SesionUsuario | undefined,
    @Req() req: Request,
  ): Promise<void> {
    if (!admin) {
      throw new InternalServerErrorException({
        code: apiErrorCodes.errorInterno,
        message: "Sesion invalida tras pasar guards.",
      })
    }
    await this.skillsService.archivar(id, motivo ?? "", admin.usuarioId, extractContextoHttp(req))
  }

  @Post(":id/desarchivar")
  @Roles(RolUsuario.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async desarchivar(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() admin: SesionUsuario | undefined,
    @Req() req: Request,
  ): Promise<void> {
    if (!admin) {
      throw new InternalServerErrorException({
        code: apiErrorCodes.errorInterno,
        message: "Sesion invalida tras pasar guards.",
      })
    }
    await this.skillsService.desarchivar(id, admin.usuarioId, extractContextoHttp(req))
  }

  @Delete(":id")
  @Roles(RolUsuario.ADMIN)
  @RequiereMotivo()
  @HttpCode(HttpStatus.NO_CONTENT)
  async eliminar(
    @Param("id", ParseUUIDPipe) id: string,
    @Motivo() motivo: string | undefined,
    @CurrentUser() admin: SesionUsuario | undefined,
    @Req() req: Request,
  ): Promise<void> {
    if (!admin) {
      throw new InternalServerErrorException({
        code: apiErrorCodes.errorInterno,
        message: "Sesion invalida tras pasar guards.",
      })
    }
    await this.skillsService.eliminar(id, motivo ?? "", admin.usuarioId, extractContextoHttp(req))
  }

  @Get(":id/historico")
  @Roles(RolUsuario.ADMIN)
  async historico(@Param("id", ParseUUIDPipe) id: string): Promise<HistoricoSkillResponse> {
    return await this.skillsService.historico(id)
  }

  @Get(":id/cobertura")
  @Roles(RolUsuario.ADMIN)
  async cobertura(@Param("id", ParseUUIDPipe) id: string): Promise<CoberturaSkillResponse> {
    return await this.skillsService.cobertura(id)
  }
}
