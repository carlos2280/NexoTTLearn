import { Global, Module } from "@nestjs/common"
import { ExportService } from "./export.service"

/**
 * `ExportModule` — global helper de exportacion CSV/XLSX/PDF (P11c — D-S11-C7).
 *
 * Marcado `@Global()` para que cualquier modulo lo inyecte sin tener que
 * declararlo en sus `imports`. Es un helper puro sin estado (similar a otros
 * helpers transversales del proyecto) — el ambito global esta justificado.
 */
@Global()
@Module({
  providers: [ExportService],
  exports: [ExportService],
})
export class ExportModule {}
