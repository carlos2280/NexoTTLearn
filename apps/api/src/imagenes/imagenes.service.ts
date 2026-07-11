import { BadRequestException, Injectable } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { SubirImagenResponse } from "@nexott-learn/shared-types"
import { ArchivoTipo } from "@prisma/client"
import { apiErrorCodes } from "../common/errors/api-error.codes"
import { StorageService } from "../common/storage/storage.service"
import { LeerArchivoResult } from "../common/storage/storage.types"
import { detectarMimeImagen } from "./deteccion-mime-imagen"

const PREFIJO_API = "/api/v1"

interface SubirImagenInput {
  readonly contenido: Buffer
  readonly nombreOriginal: string
  readonly subidoPorUsuarioId: string
}

@Injectable()
export class ImagenesService {
  private readonly appBaseUrl: string

  constructor(
    private readonly storage: StorageService,
    configService: ConfigService,
  ) {
    this.appBaseUrl = configService.getOrThrow<string>("APP_BASE_URL")
  }

  /**
   * Persiste una imagen de contenido y devuelve la URL absoluta para insertarla
   * en el HTML del bloque. El MIME se determina por los bytes reales (no por lo
   * que declara el cliente); si no es una imagen de la whitelist, se rechaza.
   */
  async subir(input: SubirImagenInput): Promise<SubirImagenResponse> {
    const mimeType = detectarMimeImagen(input.contenido)
    if (!mimeType) {
      throw new BadRequestException({
        code: apiErrorCodes.imagenTipoNoSoportado,
        message: "El archivo no es una imagen válida (PNG, JPG, WebP o GIF).",
      })
    }

    const { archivoId } = await this.storage.guardar({
      contenido: input.contenido,
      mimeType,
      tipo: ArchivoTipo.IMAGEN_CONTENIDO,
      subidoPorUsuarioId: input.subidoPorUsuarioId,
      metadata: {
        tipo: ArchivoTipo.IMAGEN_CONTENIDO,
        nombreOriginal: input.nombreOriginal,
        subidoPorUsuarioId: input.subidoPorUsuarioId,
      },
    })

    return { archivoId, url: `${this.appBaseUrl}${PREFIJO_API}/imagenes/${archivoId}` }
  }

  /**
   * Lee una imagen para servirla. Acota la lectura a `IMAGEN_CONTENIDO`: el
   * StorageService responde 404 (sin tocar disco) si el id apunta a otro tipo
   * de archivo, de modo que este endpoint nunca expone los Excel de evaluación
   * inicial que comparten la tabla `archivos`.
   */
  obtener(archivoId: string): Promise<LeerArchivoResult> {
    return this.storage.leer(archivoId, [ArchivoTipo.IMAGEN_CONTENIDO])
  }
}
