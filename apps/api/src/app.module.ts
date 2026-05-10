import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { APP_FILTER, APP_GUARD } from "@nestjs/core"
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler"
import { AuthModule } from "./auth/auth.module"
import { ColaboradoresModule } from "./colaboradores/colaboradores.module"
import { AuditLogModule } from "./common/audit/audit-log.module"
import { PrismaExceptionFilter } from "./common/filters/prisma-exception.filter"
import { CsrfGuard } from "./common/guards/csrf.guard"
import { MotivoGuard } from "./common/guards/motivo.guard"
import { RolesGuard } from "./common/guards/roles.guard"
import { SesionGuard } from "./common/guards/sesion.guard"
import { PrismaModule } from "./common/prisma/prisma.module"
import { validateEnv } from "./config/env.validation"
import { HealthModule } from "./health/health.module"

/**
 * Modulo raiz.
 *
 * Orden de guards globales (APP_GUARD se aplica en orden de registro):
 *   1. SesionGuard      -> denegacion por defecto, allow-list via @Public.
 *   2. CsrfGuard        -> exige X-XSRF-TOKEN en mutaciones.
 *   3. RolesGuard       -> @Roles(...) tras pasar autenticacion + CSRF.
 *   4. MotivoGuard      -> @RequiereMotivo() exige header X-Motivo.
 *   5. ThrottlerGuard   -> rate limiting por endpoint.
 *
 * El correlation id se inyecta como middleware Express en main.ts (antes de
 * session/cors) para cubrir respuestas generadas por guards globales antes de
 * que llegue al controller.
 *
 * El PrismaExceptionFilter convierte errores de Prisma a HTTP estables antes
 * que cualquier filter de Nest los toque.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnv,
    }),
    ThrottlerModule.forRoot([
      { name: "short", ttl: 1000, limit: 10 },
      { name: "long", ttl: 60_000, limit: 100 },
    ]),
    PrismaModule,
    AuditLogModule,
    HealthModule,
    AuthModule,
    ColaboradoresModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: SesionGuard },
    { provide: APP_GUARD, useClass: CsrfGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: MotivoGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: PrismaExceptionFilter },
  ],
})
export class AppModule {}
