import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { APP_FILTER, APP_GUARD } from "@nestjs/core"
import { ScheduleModule } from "@nestjs/schedule"
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler"
import { AsignacionesModule } from "./asignaciones/asignaciones.module"
import { AuthModule } from "./auth/auth.module"
import { CatalogoModule } from "./catalogo/catalogo.module"
import { ColaboradoresModule } from "./colaboradores/colaboradores.module"
import { AiModule } from "./common/ai/ai.module"
import { AuditLogModule } from "./common/audit/audit-log.module"
import { PrismaExceptionFilter } from "./common/filters/prisma-exception.filter"
import { CsrfGuard } from "./common/guards/csrf.guard"
import { MotivoGuard } from "./common/guards/motivo.guard"
import { MustSetupMfaGuard } from "./common/guards/must-setup-mfa.guard"
import { RolesGuard } from "./common/guards/roles.guard"
import { SesionGuard } from "./common/guards/sesion.guard"
import { IdempotencyModule } from "./common/idempotency/idempotency.module"
import { PrismaModule } from "./common/prisma/prisma.module"
import { StorageModule } from "./common/storage/storage.module"
import { validateEnv } from "./config/env.validation"
import { CursosModule } from "./cursos/cursos.module"
import { EntrevistaIaModule } from "./entrevista-ia/entrevista-ia.module"
import { EvaluacionInicialModule } from "./evaluacion-inicial/evaluacion-inicial.module"
import { HealthModule } from "./health/health.module"
import { IntentosBloqueModule } from "./intentos-bloque/intentos-bloque.module"
import { NotificacionesModule } from "./notificaciones/notificaciones.module"
import { PlanPersonalModule } from "./plan-personal/plan-personal.module"
import { TransversalModule } from "./transversal/transversal.module"

/**
 * Modulo raiz.
 *
 * Orden de guards globales (APP_GUARD se aplica en orden de registro):
 *   1. SesionGuard       -> denegacion por defecto, allow-list via @Public.
 *   2. CsrfGuard         -> exige X-XSRF-TOKEN en mutaciones.
 *   3. MustSetupMfaGuard -> bloquea endpoints fuera del flujo MFA si el
 *                            usuario tiene `requiere_setup_mfa=true` (D-MFA-4).
 *                            Va despues de la sesion (necesita usuarioId) y
 *                            antes de Roles (incluso un admin debe completar
 *                            setup antes de operar).
 *   4. RolesGuard        -> @Roles(...) tras pasar autenticacion + CSRF.
 *   5. MotivoGuard       -> @RequiereMotivo() exige header X-Motivo.
 *   6. ThrottlerGuard    -> rate limiting por endpoint.
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
    ScheduleModule.forRoot(),
    PrismaModule,
    AuditLogModule,
    StorageModule,
    IdempotencyModule,
    AiModule,
    HealthModule,
    AuthModule,
    CatalogoModule,
    ColaboradoresModule,
    AsignacionesModule,
    CursosModule,
    EvaluacionInicialModule,
    PlanPersonalModule,
    IntentosBloqueModule,
    NotificacionesModule,
    TransversalModule,
    EntrevistaIaModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: SesionGuard },
    { provide: APP_GUARD, useClass: CsrfGuard },
    { provide: APP_GUARD, useClass: MustSetupMfaGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: MotivoGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: PrismaExceptionFilter },
  ],
})
export class AppModule {}
