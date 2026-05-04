import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common"
import {
  type ActualizarModuloInput,
  type ClonarModuloInput,
  type CrearModuloInput,
  type ModuloAdminItem,
  type ObtenerModulosAdminResponse,
  type ReordenarModulosInput,
  actualizarModuloInputSchema,
  clonarModuloInputSchema,
  crearModuloInputSchema,
  reordenarModulosInputSchema,
} from "@nexott-learn/shared-types"
import { Roles } from "../../common/decorators/roles.decorator"
import { RolGuard } from "../../common/guards/rol.guard"
import { SesionGuard } from "../../common/guards/sesion.guard"
import { ZodValidationPipe } from "../../common/zod-validation.pipe"
import { ModulosService } from "./modulos.service"

// IMPORTANTE: las rutas estaticas (`/clonar`, `/reorder`) van ANTES que las
// rutas con parametro (`/:moduloId`). NestJS resuelve por orden de declaracion
// y si `:moduloId` se declara primero, capturaria "clonar" / "reorder" como id.
@Controller("admin/cursos/:cursoId/modulos")
@UseGuards(SesionGuard, RolGuard)
@Roles("ADMIN")
export class ModulosController {
  constructor(private readonly modulosService: ModulosService) {}

  @Get()
  obtenerModulos(@Param("cursoId") cursoId: string): Promise<ObtenerModulosAdminResponse> {
    return this.modulosService.obtenerModulos(cursoId)
  }

  @Post()
  crearModulo(
    @Param("cursoId") cursoId: string,
    @Body(new ZodValidationPipe(crearModuloInputSchema)) input: CrearModuloInput,
  ): Promise<ModuloAdminItem> {
    return this.modulosService.crearModulo(cursoId, input)
  }

  @Post("clonar")
  clonarModulo(
    @Param("cursoId") cursoId: string,
    @Body(new ZodValidationPipe(clonarModuloInputSchema)) input: ClonarModuloInput,
  ): Promise<ModuloAdminItem> {
    return this.modulosService.clonarModulo(cursoId, input)
  }

  @Patch("reorder")
  reordenarModulos(
    @Param("cursoId") cursoId: string,
    @Body(new ZodValidationPipe(reordenarModulosInputSchema)) input: ReordenarModulosInput,
  ): Promise<ObtenerModulosAdminResponse> {
    return this.modulosService.reordenarModulos(cursoId, input)
  }

  @Get(":moduloId")
  obtenerModulo(
    @Param("cursoId") cursoId: string,
    @Param("moduloId") moduloId: string,
  ): Promise<ModuloAdminItem> {
    return this.modulosService.obtenerModulo(cursoId, moduloId)
  }

  @Patch(":moduloId")
  actualizarModulo(
    @Param("cursoId") cursoId: string,
    @Param("moduloId") moduloId: string,
    @Body(new ZodValidationPipe(actualizarModuloInputSchema)) input: ActualizarModuloInput,
  ): Promise<ModuloAdminItem> {
    return this.modulosService.actualizarModulo(cursoId, moduloId, input)
  }

  @Delete(":moduloId")
  eliminarModulo(
    @Param("cursoId") cursoId: string,
    @Param("moduloId") moduloId: string,
  ): Promise<{ ok: true }> {
    return this.modulosService.eliminarModulo(cursoId, moduloId)
  }
}
