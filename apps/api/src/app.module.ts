import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { APP_GUARD } from "@nestjs/core"
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler"
import { AreasModule } from "./admin/areas/areas.module"
import { CentroRevisionModule } from "./admin/centro-revision/centro-revision.module"
import { CursosModule } from "./admin/cursos/cursos.module"
import { DashboardModule } from "./admin/dashboard/dashboard.module"
import { DiagnosticoModule } from "./admin/diagnostico/diagnostico.module"
import { InscripcionesModule } from "./admin/inscripciones/inscripciones.module"
import { ParticipantesModule } from "./admin/participantes/participantes.module"
import { SeguimientoModule } from "./admin/seguimiento/seguimiento.module"
import { UsuariosModule } from "./admin/usuarios/usuarios.module"
import { AuthModule } from "./auth/auth.module"
import { PrismaModule } from "./common/prisma/prisma.module"
import { HealthModule } from "./health/health.module"
import { BandejaModule } from "./participante/bandeja/bandeja.module"
import { MisCursosModule } from "./participante/mis-cursos/mis-cursos.module"

// Migración v2 en curso. Los módulos admin (cursos, módulos, secciones,
// bloques, dashboard) se reescriben PR a PR contra el schema nuevo. Hasta
// entonces, el código previo vive en `src/admin/_legacy/` como referencia
// (excluido del compile, fuera de este árbol).
// Áreas → reescrito en PR-04 (vive aquí).

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
    AreasModule,
    UsuariosModule,
    CursosModule,
    InscripcionesModule,
    DiagnosticoModule,
    CentroRevisionModule,
    SeguimientoModule,
    ParticipantesModule,
    DashboardModule,
    BandejaModule,
    MisCursosModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
