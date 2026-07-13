import { Module } from "@nestjs/common"
import { ImagenesController } from "./imagenes.controller"
import { ImagenesService } from "./imagenes.service"

/**
 * ImagenesModule — subida y servido de imágenes de contenido (editores TipTap).
 * `StorageModule` es global (no se reimporta): el service usa `StorageService`
 * para persistir en el volumen y leer de él.
 */
@Module({
  controllers: [ImagenesController],
  providers: [ImagenesService],
})
export class ImagenesModule {}
