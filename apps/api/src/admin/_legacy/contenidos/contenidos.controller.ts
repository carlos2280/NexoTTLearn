import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common"
import {
  type ActualizarContenidoInput,
  type ContenidoAdminItem,
  type CrearContenidoInput,
  type ObtenerContenidosAdminResponse,
  type ReordenarContenidosInput,
  actualizarContenidoInputSchema,
  crearContenidoInputSchema,
  reordenarContenidosInputSchema,
} from "@nexott-learn/shared-types"
import { Roles } from "../../common/decorators/roles.decorator"
import { RolGuard } from "../../common/guards/rol.guard"
import { SesionGuard } from "../../common/guards/sesion.guard"
import { ZodValidationPipe } from "../../common/zod-validation.pipe"
import { ContenidosService } from "./contenidos.service"

// IMPORTANTE: las rutas estaticas (`/orden`) van ANTES que las rutas con
// parametro (`/:contenidoId`). NestJS resuelve por orden de declaracion y si
// `:contenidoId` se declara primero, capturaria "orden" como id.
@Controller("admin/cursos/:cursoId/modulos/:moduloId/secciones/:seccionId/contenidos")
@UseGuards(SesionGuard, RolGuard)
@Roles("ADMIN")
export class ContenidosController {
  constructor(private readonly contenidosService: ContenidosService) {}

  @Get()
  obtenerContenidos(
    @Param("cursoId") cursoId: string,
    @Param("moduloId") moduloId: string,
    @Param("seccionId") seccionId: string,
    // biome-ignore lint/nursery/noSecrets: nombre de query param, no es un secreto
    @Query("incluirArchivados") incluirArchivados?: string,
  ): Promise<ObtenerContenidosAdminResponse> {
    // Query string llega siempre como string. "true" en cualquier capitalizacion
    // activa el flag; cualquier otro valor (o ausencia) lo deja en false.
    const incluir = incluirArchivados?.toLowerCase() === "true"
    return this.contenidosService.obtenerContenidos(cursoId, moduloId, seccionId, incluir)
  }

  @Post()
  crearContenido(
    @Param("cursoId") cursoId: string,
    @Param("moduloId") moduloId: string,
    @Param("seccionId") seccionId: string,
    @Body(new ZodValidationPipe(crearContenidoInputSchema)) input: CrearContenidoInput,
  ): Promise<ContenidoAdminItem> {
    return this.contenidosService.crearContenido(cursoId, moduloId, seccionId, input)
  }

  @Patch("orden")
  reordenarContenidos(
    @Param("cursoId") cursoId: string,
    @Param("moduloId") moduloId: string,
    @Param("seccionId") seccionId: string,
    @Body(new ZodValidationPipe(reordenarContenidosInputSchema)) input: ReordenarContenidosInput,
  ): Promise<ObtenerContenidosAdminResponse> {
    return this.contenidosService.reordenarContenidos(cursoId, moduloId, seccionId, input)
  }

  @Get(":contenidoId")
  obtenerContenido(
    @Param("cursoId") cursoId: string,
    @Param("moduloId") moduloId: string,
    @Param("seccionId") seccionId: string,
    @Param("contenidoId") contenidoId: string,
  ): Promise<ContenidoAdminItem> {
    return this.contenidosService.obtenerContenido(cursoId, moduloId, seccionId, contenidoId)
  }

  @Patch(":contenidoId")
  actualizarContenido(
    @Param("cursoId") cursoId: string,
    @Param("moduloId") moduloId: string,
    @Param("seccionId") seccionId: string,
    @Param("contenidoId") contenidoId: string,
    @Body(new ZodValidationPipe(actualizarContenidoInputSchema)) input: ActualizarContenidoInput,
  ): Promise<ContenidoAdminItem> {
    return this.contenidosService.actualizarContenido(
      cursoId,
      moduloId,
      seccionId,
      contenidoId,
      input,
    )
  }

  @Delete(":contenidoId")
  @HttpCode(HttpStatus.NO_CONTENT)
  async eliminarContenido(
    @Param("cursoId") cursoId: string,
    @Param("moduloId") moduloId: string,
    @Param("seccionId") seccionId: string,
    @Param("contenidoId") contenidoId: string,
  ): Promise<void> {
    await this.contenidosService.eliminarContenido(cursoId, moduloId, seccionId, contenidoId)
  }

  @Post(":contenidoId/archivar")
  archivarContenido(
    @Param("cursoId") cursoId: string,
    @Param("moduloId") moduloId: string,
    @Param("seccionId") seccionId: string,
    @Param("contenidoId") contenidoId: string,
  ): Promise<ContenidoAdminItem> {
    return this.contenidosService.archivarContenido(cursoId, moduloId, seccionId, contenidoId)
  }

  @Post(":contenidoId/restaurar")
  restaurarContenido(
    @Param("cursoId") cursoId: string,
    @Param("moduloId") moduloId: string,
    @Param("seccionId") seccionId: string,
    @Param("contenidoId") contenidoId: string,
  ): Promise<ContenidoAdminItem> {
    return this.contenidosService.restaurarContenido(cursoId, moduloId, seccionId, contenidoId)
  }
}
