import { Module } from "@nestjs/common"
import { PrismaModule } from "../../common/prisma/prisma.module"
import { RecalculoService } from "./recalculo.service"

// Iter 9.9 · MAESTRO §17.3 · cadena de recalculo tras evaluar/ajustar.
// Lo exportamos para inyectarlo en CentroRevisionModule.
@Module({
  imports: [PrismaModule],
  providers: [RecalculoService],
  exports: [RecalculoService],
})
export class RecalculoModule {}
