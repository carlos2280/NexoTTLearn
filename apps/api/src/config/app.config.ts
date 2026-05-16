import { ConfigService } from "@nestjs/config"
import { AppEnv } from "./env.validation"

/**
 * Alias tipado de ConfigService que conoce la forma del entorno validada por Zod.
 * Usar siempre `Inject(ConfigService) private readonly config: AppConfigService`
 * en services que necesiten leer variables de entorno.
 */
export type AppConfigService = ConfigService<AppEnv, true>
