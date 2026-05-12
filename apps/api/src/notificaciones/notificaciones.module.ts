import { Module, Provider } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { CifradoModule } from "../common/crypto/cifrado.module"
import { CifradoService } from "../common/crypto/cifrado.service"
import { PrismaModule } from "../common/prisma/prisma.module"
import { PrismaService } from "../common/prisma/prisma.service"
import { AppEnv } from "../config/env.validation"
import { ArchivarNotificacionesCron } from "./cron/archivar-notificaciones.cron"
import { IEmailProvider } from "./email/email-provider.interface"
import { EMAIL_PROVIDER } from "./email/email-provider.token"
import { MockEmailProvider } from "./email/mock-email-provider.service"
import { ResendEmailProvider } from "./email/resend-email-provider.service"
import { NotificacionesController } from "./notificaciones.controller"
import { NotificacionesService } from "./notificaciones.service"

/**
 * Factory del provider de email — patron heredado D-S8-B2 (`AI_PROVIDER_TOKEN`).
 *
 *  - `NODE_ENV=test`  -> `MockEmailProvider` (in-memory; vitest jamas toca Resend).
 *  - resto            -> `ResendEmailProvider`. La key cifrada y el modo
 *                        AUTOMATICO/MANUAL se leen en cada envio desde
 *                        `ConfiguracionSistema`, asi que el provider no
 *                        intenta nada si esta deshabilitado.
 *
 * El factory inyecta tanto `MockEmailProvider` como las dependencias del real
 * para evitar instanciar el cliente Resend en tests (D-S10-B2).
 */
const emailProviderProvider: Provider = {
  provide: EMAIL_PROVIDER,
  useFactory: (
    config: ConfigService<AppEnv, true>,
    mock: MockEmailProvider,
    prisma: PrismaService,
    cifrado: CifradoService,
  ): IEmailProvider => {
    const nodeEnv = config.get("NODE_ENV", { infer: true })
    if (nodeEnv === "test") {
      return mock
    }
    return new ResendEmailProvider(prisma, cifrado)
  },
  inject: [ConfigService, MockEmailProvider, PrismaService, CifradoService],
}

/**
 * `NotificacionesModule` — Slice 10 P10a foundation (D-S10-B1).
 *
 * Expone `NotificacionesService` para que en P10c los modulos
 * `PlanPersonalModule` y `AsignacionesModule` lo inyecten en sus triggers.
 * En P10a el modulo NO registra controller — los 8 endpoints inbox/preferencias
 * son tarea de P10b.
 */
@Module({
  imports: [PrismaModule, CifradoModule],
  controllers: [NotificacionesController],
  providers: [
    MockEmailProvider,
    emailProviderProvider,
    NotificacionesService,
    ArchivarNotificacionesCron,
  ],
  exports: [NotificacionesService],
})
export class NotificacionesModule {}
