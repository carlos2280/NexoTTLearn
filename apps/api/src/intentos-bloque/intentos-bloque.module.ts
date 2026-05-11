import { Module } from "@nestjs/common"
import { PrismaModule } from "../common/prisma/prisma.module"
import { IntentosBloqueController } from "./intentos-bloque.controller"
import { IntentosBloqueService } from "./intentos-bloque.service"

/**
 * Modulo `intentos-bloque` — Slice 7 P7b. Expone los 5 endpoints del dominio.
 *
 * Depende de `PrismaModule` para el cliente Prisma. `AuditLogModule` e
 * `IdempotencyModule` ya estan registrados como `@Global` en el `AppModule`,
 * por lo que el servicio puede inyectarlos sin import explicito.
 */
@Module({
  imports: [PrismaModule],
  controllers: [IntentosBloqueController],
  providers: [IntentosBloqueService],
  exports: [IntentosBloqueService],
})
export class IntentosBloqueModule {}
