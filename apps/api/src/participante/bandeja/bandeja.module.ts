import { Module } from "@nestjs/common"
import { PrismaModule } from "../../common/prisma/prisma.module"
import { BandejaController } from "./bandeja.controller"
import { BandejaService } from "./bandeja.service"

@Module({
  imports: [PrismaModule],
  controllers: [BandejaController],
  providers: [BandejaService],
})
export class BandejaModule {}
