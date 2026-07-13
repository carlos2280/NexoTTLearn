import { Module } from "@nestjs/common"
import { RepoFetchService } from "./repo-fetch.service"

/**
 * Módulo del `RepoFetchService` (descarga + empaquetado del repo entregado).
 * Infraestructura reutilizable: hoy lo consume el job del transversal para la
 * capa cualitativa; se exporta para quien más lo necesite.
 */
@Module({
  providers: [RepoFetchService],
  exports: [RepoFetchService],
})
export class RepoFetchModule {}
