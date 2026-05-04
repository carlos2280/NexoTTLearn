import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common"
import {
  type ActualizarCursoInput,
  type ActualizarPesosCursoInput,
  type CrearCursoInput,
  type CursoAdminDetalle,
  type ObtenerCursosAdminResponse,
  actualizarCursoInputSchema,
  actualizarPesosCursoInputSchema,
  crearCursoInputSchema,
} from "@nexott-learn/shared-types"
import { Roles } from "../../common/decorators/roles.decorator"
import { RolGuard } from "../../common/guards/rol.guard"
import { SesionGuard } from "../../common/guards/sesion.guard"
import { ZodValidationPipe } from "../../common/zod-validation.pipe"
import { CursosService } from "./cursos.service"

@Controller("admin/cursos")
@UseGuards(SesionGuard, RolGuard)
@Roles("ADMIN")
export class CursosController {
  constructor(private readonly cursosService: CursosService) {}

  @Get()
  obtenerCursos(): Promise<ObtenerCursosAdminResponse> {
    return this.cursosService.obtenerCursos()
  }

  @Get(":id")
  obtenerCurso(@Param("id") id: string): Promise<CursoAdminDetalle> {
    return this.cursosService.obtenerCursoPorId(id)
  }

  @Post()
  crearCurso(
    @Body(new ZodValidationPipe(crearCursoInputSchema)) input: CrearCursoInput,
  ): Promise<CursoAdminDetalle> {
    return this.cursosService.crearCurso(input)
  }

  @Patch(":id")
  actualizarCurso(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(actualizarCursoInputSchema)) input: ActualizarCursoInput,
  ): Promise<CursoAdminDetalle> {
    return this.cursosService.actualizarCurso(id, input)
  }

  // Endpoint dedicado para gestion de pesos (decision P3.1). Separado del
  // PATCH general porque tiene reglas de validacion propias (suma=100 intra,
  // <=100 nivel curso) y por simetria con la pantalla del front.
  @Patch(":id/pesos")
  actualizarPesos(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(actualizarPesosCursoInputSchema))
    input: ActualizarPesosCursoInput,
  ): Promise<CursoAdminDetalle> {
    return this.cursosService.actualizarPesos(id, input)
  }
}
