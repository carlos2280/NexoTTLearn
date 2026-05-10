import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards } from "@nestjs/common"
import type { MatrizDiagnosticoQuery, MatrizDiagnosticoResponse } from "@nexott-learn/shared-types"
import { matrizDiagnosticoQuerySchema } from "@nexott-learn/shared-types"
import { Roles } from "../../common/decorators/roles.decorator"
import { RolGuard } from "../../common/guards/rol.guard"
import { SesionGuard } from "../../common/guards/sesion.guard"
import { ZodValidationPipe } from "../../common/zod-validation.pipe"
import { DiagnosticoMatrizService } from "./diagnostico-matriz.service"

@Controller("admin/cursos/:cursoId/diagnostico/matriz")
@UseGuards(SesionGuard, RolGuard)
@Roles("ADMIN")
export class DiagnosticoMatrizController {
  constructor(private readonly matrizService: DiagnosticoMatrizService) {}

  @Get()
  obtener(
    @Param("cursoId", new ParseUUIDPipe()) cursoId: string,
    @Query(new ZodValidationPipe(matrizDiagnosticoQuerySchema))
    query: MatrizDiagnosticoQuery,
  ): Promise<MatrizDiagnosticoResponse> {
    return this.matrizService.obtenerMatriz(cursoId, query)
  }
}
