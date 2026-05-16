import { Global, Module } from "@nestjs/common"
import { PrismaModule } from "../prisma/prisma.module"
import { IdempotencyService } from "./idempotency.service"

/**
 * Modulo global de idempotencia (D-EVI-3). Reservado para P5c y futuros
 * endpoints sensibles (asignaciones, cierres). P5a deja el esqueleto listo
 * sin consumidores en runtime.
 */
@Global()
@Module({
  imports: [PrismaModule],
  providers: [IdempotencyService],
  exports: [IdempotencyService],
})
export class IdempotencyModule {}
