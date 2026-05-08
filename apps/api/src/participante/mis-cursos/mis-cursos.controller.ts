// Controller de mis-cursos del participante. Read-only, RolGuard PARTICIPANTE.

import { Controller, Get, Param, UseGuards } from "@nestjs/common"
import type {
  ParticipanteMisCursosResponse,
  ParticipanteVistaCursoResponse,
} from "@nexott-learn/shared-types"
import type { UsuarioSesion } from "../../auth/tipos"
import { Roles } from "../../common/decorators/roles.decorator"
import { UsuarioActual } from "../../common/decorators/usuario-actual.decorator"
import { RolGuard } from "../../common/guards/rol.guard"
import { SesionGuard } from "../../common/guards/sesion.guard"
import { MisCursosService } from "./mis-cursos.service"

@Controller("participante/cursos")
@UseGuards(SesionGuard, RolGuard)
@Roles("PARTICIPANTE")
export class MisCursosController {
  constructor(private readonly misCursos: MisCursosService) {}

  @Get()
  obtenerMisCursos(
    @UsuarioActual() usuario: UsuarioSesion,
  ): Promise<ParticipanteMisCursosResponse> {
    return this.misCursos.obtenerMisCursos(usuario.id)
  }

  @Get(":slug")
  obtenerVistaCurso(
    @UsuarioActual() usuario: UsuarioSesion,
    @Param("slug") slug: string,
  ): Promise<ParticipanteVistaCursoResponse> {
    return this.misCursos.obtenerVistaCurso(usuario.id, slug)
  }
}
