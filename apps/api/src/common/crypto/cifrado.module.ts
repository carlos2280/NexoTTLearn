import { Module } from "@nestjs/common"
import { CifradoService } from "./cifrado.service"

/**
 * CifradoModule — provee `CifradoService` (AES-256-GCM).
 *
 * Importable explicitamente por cada feature module que lo necesite. NO es
 * @Global a proposito: pocas features cifran datos en BD (hoy solo MFA), y
 * forzar el import explicito documenta esa dependencia.
 */
@Module({
  providers: [CifradoService],
  exports: [CifradoService],
})
export class CifradoModule {}
