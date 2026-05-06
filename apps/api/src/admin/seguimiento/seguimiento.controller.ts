// Iter 10 · controller admin de seguimiento. Read-only, RolGuard ADMIN.

import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards } from "@nestjs/common"
import {
  type CeldaDetalleResponse,
  type KpisCursoResponse,
  type MatrizCursoResponse,
  type SeguimientoMatrizQuery,
  type SeguimientoTabQuery,
  seguimientoMatrizQuerySchema,
  seguimientoTabQuerySchema,
} from "@nexott-learn/shared-types"
import { Roles } from "../../common/decorators/roles.decorator"
import { RolGuard } from "../../common/guards/rol.guard"
import { SesionGuard } from "../../common/guards/sesion.guard"
import { ZodValidationPipe } from "../../common/zod-validation.pipe"
import { SeguimientoService } from "./seguimiento.service"

@Controller("admin/cursos/:cursoId/seguimiento")
@UseGuards(SesionGuard, RolGuard)
@Roles("ADMIN")
export class SeguimientoController {
  constructor(private readonly seguimiento: SeguimientoService) {}

  @Get("matriz")
  obtenerMatriz(
    @Param("cursoId", new ParseUUIDPipe()) cursoId: string,
    @Query(new ZodValidationPipe(seguimientoMatrizQuerySchema)) query: SeguimientoMatrizQuery,
  ): Promise<MatrizCursoResponse> {
    return this.seguimiento.obtenerMatriz(cursoId, query)
  }

  @Get("kpis")
  obtenerKpis(
    @Param("cursoId", new ParseUUIDPipe()) cursoId: string,
    @Query(new ZodValidationPipe(seguimientoTabQuerySchema)) query: SeguimientoTabQuery,
  ): Promise<KpisCursoResponse> {
    if (query.tab === "actual") {
      return this.seguimiento.obtenerKpisActualConEntrevista(cursoId)
    }
    return this.seguimiento.obtenerKpis(cursoId, query.tab)
  }

  @Get("celda/:inscripcionId/:areaId")
  obtenerCelda(
    @Param("cursoId", new ParseUUIDPipe()) cursoId: string,
    @Param("inscripcionId", new ParseUUIDPipe()) inscripcionId: string,
    @Param("areaId", new ParseUUIDPipe()) areaId: string,
    @Query(new ZodValidationPipe(seguimientoTabQuerySchema)) query: SeguimientoTabQuery,
  ): Promise<CeldaDetalleResponse> {
    return this.seguimiento.obtenerCelda(cursoId, inscripcionId, areaId, query.tab)
  }
}
