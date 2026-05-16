import { Module } from "@nestjs/common"
import { PrismaModule } from "../common/prisma/prisma.module"
import { AuthController } from "./auth.controller"
import { AuthService } from "./auth.service"
import { MfaModule } from "./mfa/mfa.module"

@Module({
  imports: [PrismaModule, MfaModule],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
