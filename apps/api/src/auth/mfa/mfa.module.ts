import { Module } from "@nestjs/common"
import { CifradoModule } from "../../common/crypto/cifrado.module"
import { PrismaModule } from "../../common/prisma/prisma.module"
import { MfaController } from "./mfa.controller"
import { MfaService } from "./mfa.service"

/**
 * MfaModule — flujo TOTP completo (setup, enable, verify, disable).
 *
 * Vive separado de `AuthModule` (decision Ola 2 — refactor preventivo): MFA
 * tiene su propio controller, su propia tabla `mfa_challenges`, sus propios
 * eventos de auditoria y crece en P12 con step-up. Mezclar con AuthService
 * forzaria el archivo a >500 lineas y enredaria el blast radius.
 */
@Module({
  imports: [PrismaModule, CifradoModule],
  controllers: [MfaController],
  providers: [MfaService],
  exports: [MfaService],
})
export class MfaModule {}
