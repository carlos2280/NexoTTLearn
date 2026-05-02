import { Module } from "@nestjs/common"
import { PassportModule } from "@nestjs/passport"
import { AuthEventosService } from "./auth-eventos.service"
import { AuthController } from "./auth.controller"
import { AuthService } from "./auth.service"
import { MfaChallengeService } from "./mfa/mfa-challenge.service"
import { MfaCryptoService } from "./mfa/mfa-crypto.service"
import { MfaService } from "./mfa/mfa.service"
import { SerializadorUsuario } from "./serializador.usuario"

@Module({
  imports: [PassportModule.register({ session: true })],
  controllers: [AuthController],
  providers: [
    AuthService,
    SerializadorUsuario,
    MfaCryptoService,
    MfaChallengeService,
    MfaService,
    AuthEventosService,
  ],
  exports: [AuthService, MfaService, MfaCryptoService, AuthEventosService],
})
export class AuthModule {}
