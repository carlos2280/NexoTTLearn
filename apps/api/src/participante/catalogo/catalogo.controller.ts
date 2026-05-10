// Controller del catalogo libre del participante. Read-only + auto-inscripcion.
// RolGuard PARTICIPANTE.

import { Controller, Get, HttpCode, Param, Post, Query, UseGuards } from "@nestjs/common"
import {
  type CatalogoFichaResponse,
  type CatalogoInscribirmeResponse,
  type CatalogoVitrinaQuery,
  type CatalogoVitrinaResponse,
  catalogoVitrinaQuerySchema,
} from "@nexott-learn/shared-types"
import type { UsuarioSesion } from "../../auth/tipos"
import { Roles } from "../../common/decorators/roles.decorator"
import { UsuarioActual } from "../../common/decorators/usuario-actual.decorator"
import { RolGuard } from "../../common/guards/rol.guard"
import { SesionGuard } from "../../common/guards/sesion.guard"
import { ZodValidationPipe } from "../../common/zod-validation.pipe"
import { CatalogoService } from "./catalogo.service"

@Controller("participante/catalogo")
@UseGuards(SesionGuard, RolGuard)
@Roles("PARTICIPANTE")
export class CatalogoController {
  constructor(private readonly catalogo: CatalogoService) {}

  @Get()
  obtenerVitrina(
    @UsuarioActual() usuario: UsuarioSesion,
    @Query(new ZodValidationPipe(catalogoVitrinaQuerySchema)) query: CatalogoVitrinaQuery,
  ): Promise<CatalogoVitrinaResponse> {
    return this.catalogo.obtenerVitrina(usuario.id, query)
  }

  @Get(":slug")
  obtenerFicha(
    @UsuarioActual() usuario: UsuarioSesion,
    @Param("slug") slug: string,
  ): Promise<CatalogoFichaResponse> {
    return this.catalogo.obtenerFicha(usuario.id, slug)
  }

  @Post(":slug/inscribirme")
  @HttpCode(201)
  inscribirme(
    @UsuarioActual() usuario: UsuarioSesion,
    @Param("slug") slug: string,
  ): Promise<CatalogoInscribirmeResponse> {
    return this.catalogo.inscribirse(usuario.id, slug)
  }
}
