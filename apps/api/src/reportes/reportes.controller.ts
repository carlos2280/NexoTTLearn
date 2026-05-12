import { Controller, Get, Query, UnprocessableEntityException } from "@nestjs/common"
import { Throttle } from "@nestjs/throttler"
import {
  type AvanceCursoQuery,
  type BrechasDetectadasQuery,
  type BrechasDetectadasResponse,
  type CentroRevisionQuery,
  type CentroRevisionResponse,
  type DetalleColaboradorQuery,
  type DetalleColaboradorResponse,
  type EventoHistorico,
  type FilaAvanceCurso,
  avanceCursoQuerySchema,
  brechasDetectadasQuerySchema,
  centroRevisionQuerySchema,
  detalleColaboradorQuerySchema,
} from "@nexott-learn/shared-types"
import { RolUsuario } from "@prisma/client"
import { Roles } from "../common/decorators/roles.decorator"
import { apiErrorCodes } from "../common/errors/api-error.codes"
import { Paginated } from "../common/http/paginated"
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe"
import { ReportesService } from "./reportes.service"

/**
 * Controller del modulo reportes (Slice 11 P11b — 4 endpoints operativos).
 *
 *  E1 GET /reportes/avance-curso         — Paginated<FilaAvanceCurso | EventoHistorico>.
 *  E2 GET /reportes/detalle-colaborador  — agregado plan + ficha + ultimos intentos.
 *  E3 GET /reportes/brechas-detectadas   — conteo no_cumple/cerca/cumple por skill.
 *  E4 GET /reportes/centro-revision      — transversales/entrevistas pendientes.
 *
 * Auth/autorizacion: SesionGuard + RolesGuard estan registrados como
 * APP_GUARD globales en `app.module.ts`. Aqui solo se exige el rol con
 * `@Roles(ADMIN)` a nivel clase (D-S11-B10). PARTICIPANTE -> 403 limpio.
 *
 * Throttle a nivel clase 30/min heredando convencion P10b estrategicos.
 *
 * `format` por endpoint: solo `json` en P11b. CSV/XLSX/PDF se difieren a P11c
 * con `ExportService`. El schema Zod rechaza otros valores; este controller
 * deja un cinturon de defensa adicional por si el alcance futuro relaja.
 */
@Controller("reportes")
@Roles(RolUsuario.ADMIN)
@Throttle({ default: { ttl: 60_000, limit: 30 } })
export class ReportesController {
  constructor(private readonly reportes: ReportesService) {}

  @Get("avance-curso")
  obtenerAvanceCurso(
    @Query(new ZodValidationPipe(avanceCursoQuerySchema)) query: AvanceCursoQuery,
  ): Promise<Paginated<FilaAvanceCurso> | Paginated<EventoHistorico>> {
    this.exigirFormatoJson(query.format)
    return this.reportes.obtenerAvanceCurso(query)
  }

  @Get("detalle-colaborador")
  obtenerDetalleColaborador(
    @Query(new ZodValidationPipe(detalleColaboradorQuerySchema))
    query: DetalleColaboradorQuery,
  ): Promise<DetalleColaboradorResponse> {
    this.exigirFormatoJson(query.format)
    return this.reportes.obtenerDetalleColaborador(query)
  }

  @Get("brechas-detectadas")
  obtenerBrechasDetectadas(
    @Query(new ZodValidationPipe(brechasDetectadasQuerySchema))
    query: BrechasDetectadasQuery,
  ): Promise<BrechasDetectadasResponse> {
    this.exigirFormatoJson(query.format)
    return this.reportes.obtenerBrechasDetectadas(query)
  }

  @Get("centro-revision")
  obtenerCentroRevision(
    @Query(new ZodValidationPipe(centroRevisionQuerySchema))
    query: CentroRevisionQuery,
  ): Promise<CentroRevisionResponse> {
    this.exigirFormatoJson(query.format)
    return this.reportes.obtenerCentroRevision(query)
  }

  private exigirFormatoJson(formato: string): void {
    if (formato !== "json") {
      throw new UnprocessableEntityException({
        code: apiErrorCodes.formatoNoSoportadoEnP11b,
        message: "Solo se admite format=json en P11b. CSV/XLSX/PDF se difieren a P11c.",
      })
    }
  }
}
