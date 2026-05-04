import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { APP_GUARD } from "@nestjs/core"
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler"
import { AreasCompetenciaModule } from "./admin/areas-competencia/areas-competencia.module"
import { ContenidosModule } from "./admin/contenidos/contenidos.module"
import { CursosModule } from "./admin/cursos/cursos.module"
import { DashboardModule } from "./admin/dashboard/dashboard.module"
import { ModulosModule } from "./admin/modulos/modulos.module"
import { SeccionesModule } from "./admin/secciones/secciones.module"
import { AuthModule } from "./auth/auth.module"
import { PrismaModule } from "./common/prisma/prisma.module"
import { HealthModule } from "./health/health.module"

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env", "../../.env"],
    }),
    // Rate limit global. El default es generoso (60/min); endpoints sensibles
    // declaran su propio limite con @Throttle (ver auth.controller).
    ThrottlerModule.forRoot([
      {
        name: "default",
        ttl: 60_000,
        limit: 60,
      },
    ]),
    PrismaModule,
    AuthModule,
    HealthModule,
    DashboardModule,
    CursosModule,
    ModulosModule,
    SeccionesModule,
    ContenidosModule,
    AreasCompetenciaModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
