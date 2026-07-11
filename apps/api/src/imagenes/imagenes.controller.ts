import { Readable } from "node:stream"
import {
  BadRequestException,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Param,
  ParseUUIDPipe,
  Post,
  StreamableFile,
  UploadedFile,
  UseFilters,
  UseInterceptors,
} from "@nestjs/common"
import { FileInterceptor } from "@nestjs/platform-express"
import { Throttle } from "@nestjs/throttler"
import { MAX_IMAGEN_BYTES, SubirImagenResponse } from "@nexott-learn/shared-types"
import { RolUsuario } from "@prisma/client"
import { memoryStorage } from "multer"
import { CurrentUser } from "../common/decorators/current-user.decorator"
import { Roles } from "../common/decorators/roles.decorator"
import { apiErrorCodes } from "../common/errors/api-error.codes"
import { SesionUsuario } from "../common/types/sesion.types"
import { ImagenesService } from "./imagenes.service"
import { MulterExceptionFilter } from "./multer-exception.filter"

const MINUTO_MS = 60 * 1000

@Controller("imagenes")
export class ImagenesController {
  constructor(private readonly imagenesService: ImagenesService) {}

  /**
   * Subida de una imagen de contenido (solo ADMIN, desde los editores del
   * builder). `memoryStorage` porque el `StorageService` recibe el buffer y lo
   * persiste en el volumen; el límite de tamaño lo aplica multer antes de tocar
   * memoria. El MIME real se valida por bytes en el service.
   */
  @Post()
  @Roles(RolUsuario.ADMIN)
  @Throttle({ short: { ttl: MINUTO_MS, limit: 30 } })
  @UseFilters(MulterExceptionFilter)
  @UseInterceptors(
    FileInterceptor("archivo", {
      storage: memoryStorage(),
      limits: { fileSize: MAX_IMAGEN_BYTES, files: 1 },
    }),
  )
  @HttpCode(HttpStatus.CREATED)
  subir(
    // biome-ignore lint/correctness/noUndeclaredVariables: `Express.Multer.File` es un tipo global de `@types/multer` que Biome no resuelve.
    @UploadedFile() archivo: Express.Multer.File | undefined,
    @CurrentUser() usuario: SesionUsuario | undefined,
  ): Promise<SubirImagenResponse> {
    if (!usuario) {
      // El SesionGuard global ya garantiza sesión; si falta aquí, es un fallo
      // interno, no una petición sin credenciales.
      throw new InternalServerErrorException({
        code: apiErrorCodes.errorInterno,
        message: "Sesión inválida tras pasar guards.",
      })
    }
    if (!archivo) {
      throw new BadRequestException({
        code: apiErrorCodes.invalidBody,
        message: "Falta el archivo 'archivo' en el multipart.",
      })
    }
    return this.imagenesService.subir({
      contenido: archivo.buffer,
      nombreOriginal: archivo.originalname,
      subidoPorUsuarioId: usuario.usuarioId,
    })
  }

  /**
   * Sirve una imagen de contenido. Requiere sesión (cualquier usuario
   * autenticado, no solo ADMIN): los participantes ven las imágenes del curso.
   * `Cache-Control: private` porque el recurso depende de la sesión.
   */
  @Get(":archivoId")
  // Override de ambos límites nombrados: el `long` global (100/min) capa el
  // servido de páginas con varias imágenes. Con Cache-Control el navegador
  // reusa las imágenes, así que 300/min es holgado sin abrir un agujero de DoS.
  @Throttle({ short: { ttl: MINUTO_MS, limit: 300 }, long: { ttl: MINUTO_MS, limit: 300 } })
  @Header("Cache-Control", "private, max-age=86400")
  // Helmet pone CORP `same-origin` global, lo que bloquearía cargar la imagen
  // en un `<img>` cuando la web y la API viven en dominios distintos. Estas
  // imágenes ya requieren sesión y no son secretas: permitimos cross-origin
  // solo en este endpoint. `nosniff` global evita que se interpreten como HTML.
  @Header("Cross-Origin-Resource-Policy", "cross-origin")
  async servir(@Param("archivoId", ParseUUIDPipe) archivoId: string): Promise<StreamableFile> {
    const { contenido, mimeType } = await this.imagenesService.obtener(archivoId)
    return new StreamableFile(Readable.from(contenido), {
      type: mimeType,
      disposition: "inline",
    })
  }
}
