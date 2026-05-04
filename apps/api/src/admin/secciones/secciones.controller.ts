import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common"
import {
  type ActualizarSeccionInput,
  type CrearSeccionInput,
  type ObtenerSeccionesAdminResponse,
  type ReordenarSeccionesInput,
  type SeccionAdminItem,
  actualizarSeccionInputSchema,
  crearSeccionInputSchema,
  reordenarSeccionesInputSchema,
} from "@nexott-learn/shared-types"
import { Roles } from "../../common/decorators/roles.decorator"
import { RolGuard } from "../../common/guards/rol.guard"
import { SesionGuard } from "../../common/guards/sesion.guard"
import { ZodValidationPipe } from "../../common/zod-validation.pipe"
import { SeccionesService } from "./secciones.service"

// IMPORTANTE: las rutas estaticas (`/orden`) van ANTES que las rutas con
// parametro (`/:seccionId`). NestJS resuelve por orden de declaracion y si
// `:seccionId` se declara primero, capturaria "orden" como id.
@Controller("admin/cursos/:cursoId/modulos/:moduloId/secciones")
@UseGuards(SesionGuard, RolGuard)
@Roles("ADMIN")
export class SeccionesController {
  constructor(private readonly seccionesService: SeccionesService) {}

  @Get()
  obtenerSecciones(
    @Param("cursoId") cursoId: string,
    @Param("moduloId") moduloId: string,
  ): Promise<ObtenerSeccionesAdminResponse> {
    return this.seccionesService.obtenerSecciones(cursoId, moduloId)
  }

  @Post()
  crearSeccion(
    @Param("cursoId") cursoId: string,
    @Param("moduloId") moduloId: string,
    @Body(new ZodValidationPipe(crearSeccionInputSchema)) input: CrearSeccionInput,
  ): Promise<SeccionAdminItem> {
    return this.seccionesService.crearSeccion(cursoId, moduloId, input)
  }

  @Patch("orden")
  reordenarSecciones(
    @Param("cursoId") cursoId: string,
    @Param("moduloId") moduloId: string,
    @Body(new ZodValidationPipe(reordenarSeccionesInputSchema)) input: ReordenarSeccionesInput,
  ): Promise<ObtenerSeccionesAdminResponse> {
    return this.seccionesService.reordenarSecciones(cursoId, moduloId, input)
  }

  @Patch(":seccionId")
  actualizarSeccion(
    @Param("cursoId") cursoId: string,
    @Param("moduloId") moduloId: string,
    @Param("seccionId") seccionId: string,
    @Body(new ZodValidationPipe(actualizarSeccionInputSchema)) input: ActualizarSeccionInput,
  ): Promise<SeccionAdminItem> {
    return this.seccionesService.actualizarSeccion(cursoId, moduloId, seccionId, input)
  }

  @Delete(":seccionId")
  eliminarSeccion(
    @Param("cursoId") cursoId: string,
    @Param("moduloId") moduloId: string,
    @Param("seccionId") seccionId: string,
  ): Promise<{ ok: true }> {
    return this.seccionesService.eliminarSeccion(cursoId, moduloId, seccionId)
  }
}
