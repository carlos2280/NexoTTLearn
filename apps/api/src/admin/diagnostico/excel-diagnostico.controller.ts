import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common"
import { FileInterceptor } from "@nestjs/platform-express"
import type {
  ExcelConfirmarBody,
  ExcelConfirmarResponse,
  ExcelPreviewResponse,
} from "@nexott-learn/shared-types"
import { excelConfirmarBodySchema } from "@nexott-learn/shared-types"
import type { Response } from "express"
import { Roles } from "../../common/decorators/roles.decorator"
import { UsuarioActual } from "../../common/decorators/usuario-actual.decorator"
import { RolGuard } from "../../common/guards/rol.guard"
import { SesionGuard } from "../../common/guards/sesion.guard"
import { ZodValidationPipe } from "../../common/zod-validation.pipe"
import { ExcelConfirmarService } from "./excel-confirmar.service"
import { ExcelPlantillaService } from "./excel-plantilla.service"
import { ExcelPreviewService } from "./excel-preview.service"

const XLSX_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

interface MulterFile {
  readonly buffer: Buffer
  readonly mimetype: string
  readonly originalname: string
  readonly size: number
}

@Controller("admin/cursos/:cursoId/diagnostico/excel")
@UseGuards(SesionGuard, RolGuard)
@Roles("ADMIN")
export class ExcelDiagnosticoController {
  constructor(
    private readonly plantillaService: ExcelPlantillaService,
    private readonly previewService: ExcelPreviewService,
    private readonly confirmarService: ExcelConfirmarService,
  ) {}

  @Get("plantilla")
  async descargarPlantilla(
    @Param("cursoId", new ParseUUIDPipe()) cursoId: string,
    @Res() res: Response,
  ): Promise<void> {
    const { buffer, filename } = await this.plantillaService.generar({ cursoId })
    res.setHeader("Content-Type", XLSX_CONTENT_TYPE)
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
    )
    res.setHeader("Content-Length", String(buffer.length))
    res.end(buffer)
  }

  @Post("preview")
  @HttpCode(200)
  @UseInterceptors(FileInterceptor("archivo"))
  preview(
    @Param("cursoId", new ParseUUIDPipe()) cursoId: string,
    @UploadedFile() file: MulterFile | undefined,
  ): Promise<ExcelPreviewResponse> {
    return this.previewService.preview({ cursoId, file: file ?? null })
  }

  @Post("confirmar")
  @HttpCode(200)
  confirmar(
    @Param("cursoId", new ParseUUIDPipe()) cursoId: string,
    @Body(new ZodValidationPipe(excelConfirmarBodySchema)) body: ExcelConfirmarBody,
    @UsuarioActual() usuario: { id: string } | undefined,
  ): Promise<ExcelConfirmarResponse> {
    if (!usuario?.id) {
      throw new BadRequestException("Usuario de sesion no disponible")
    }
    return this.confirmarService.confirmar({
      cursoId,
      uploadId: body.uploadId,
      actorId: usuario.id,
    })
  }
}
