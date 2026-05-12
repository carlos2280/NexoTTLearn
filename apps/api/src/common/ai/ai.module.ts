import { Global, Module } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { AppEnv } from "../../config/env.validation"
import { AiService } from "./ai.service"
import { AI_PROVIDER_TOKEN, IAiProvider } from "./providers/ai-provider.interface"
import { ClaudeProvider } from "./providers/claude.provider"
import { MockAiProvider } from "./providers/mock.provider"

/**
 * `AiModule` — modulo global de IA (Slice 8 P8a — D-S8-B1).
 *
 * Provee `AiService` como fachada y resuelve la implementacion concreta del
 * provider via `AI_PROVIDER` (env validada en `env.validation.ts`):
 *  - `mock` (default) -> `MockAiProvider` (determinista; vitest jamas toca la nube).
 *  - `claude`         -> `ClaudeProvider` (anthropic SDK). En P8a queda dormido
 *                        (NotImplementedException) hasta que P8b active prompts.
 *
 * Es `@Global()` para que cualquier dominio (transversal en P8a/b, entrevista
 * IA en P8c, etc.) consuma `AiService` sin import explicito en su modulo.
 */
@Global()
@Module({
  providers: [
    MockAiProvider,
    {
      provide: AI_PROVIDER_TOKEN,
      useFactory: (config: ConfigService<AppEnv, true>, mock: MockAiProvider): IAiProvider => {
        const provider = config.get("AI_PROVIDER", { infer: true })
        // ClaudeProvider se instancia lazy SOLO si AI_PROVIDER=claude, para
        // evitar fallar al arranque por falta de AI_API_KEY en entornos que
        // operan en modo mock (vitest, dev local sin key).
        return provider === "claude" ? new ClaudeProvider(config) : mock
      },
      inject: [ConfigService, MockAiProvider],
    },
    AiService,
  ],
  exports: [AiService],
})
export class AiModule {}
