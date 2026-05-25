import { Module } from "@nestjs/common"
import { ConfigModule, ConfigService } from "@nestjs/config"
import type { AppEnv } from "../../config/env.validation"
import { MockSandboxAdapter } from "./mock.adapter"
import { PistonAdapter } from "./piston.adapter"
import { SANDBOX_SERVICE } from "./sandbox.types"

/**
 * Modulo del sandbox de ejecucion de codigo. Resuelve la implementacion segun
 * `SANDBOX_PROVIDER` (env): `piston` (real) o `mock` (Vitest / dev offline).
 *
 * El consumidor inyecta por token: `@Inject(SANDBOX_SERVICE)`. Asi el motor
 * de intentos no conoce al adaptador concreto y se puede cambiar a Judge0,
 * Piston externo, etc., sin tocar la logica de negocio.
 */
@Module({
  imports: [ConfigModule],
  providers: [
    MockSandboxAdapter,
    PistonAdapter,
    {
      provide: SANDBOX_SERVICE,
      inject: [ConfigService, MockSandboxAdapter, PistonAdapter],
      useFactory: (
        configService: ConfigService<AppEnv, true>,
        mock: MockSandboxAdapter,
        piston: PistonAdapter,
      ) => {
        const provider = configService.get("SANDBOX_PROVIDER", { infer: true })
        return provider === "piston" ? piston : mock
      },
    },
  ],
  exports: [SANDBOX_SERVICE],
})
export class SandboxModule {}
