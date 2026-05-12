import { Inject, Injectable } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { AppEnv } from "../../config/env.validation"
import {
  EvaluarRepoCualitativoInput,
  EvaluarRepoCualitativoOutput,
  MantenerTurnoComprensionInput,
  MantenerTurnoComprensionOutput,
  MantenerTurnoEntrevistaInput,
  MantenerTurnoEntrevistaOutput,
  ProfundidadEntrevistaIa,
} from "./ai.types"
import { AI_PROVIDER_TOKEN, IAiProvider } from "./providers/ai-provider.interface"

/**
 * `AiService` — fachada publica del dominio IA (D-S8-B1).
 *
 * Inyecta el provider concreto via DI (`AI_PROVIDER_TOKEN`). El switch
 * mock/claude lo resuelve la factory del `AiModule` segun `AI_PROVIDER`.
 *
 * Tambien expone `resolveModel(profundidad)` (D-S8-B3): selecciona el modelo
 * de Claude por defecto segun la profundidad del curso, con override global
 * via `AI_MODEL_OVERRIDE` (staging / A/B / forzar Opus en demos). En P8a el
 * modelo no se usa porque solo el MockProvider esta activo, pero el helper
 * vive aqui para que P8b lo consuma sin tocar la fachada.
 */
@Injectable()
export class AiService {
  constructor(
    @Inject(AI_PROVIDER_TOKEN) private readonly provider: IAiProvider,
    private readonly config: ConfigService<AppEnv, true>,
  ) {}

  get providerName(): IAiProvider["providerName"] {
    return this.provider.providerName
  }

  resolveModel(profundidad: ProfundidadEntrevistaIa): string {
    const override = this.config.get("AI_MODEL_OVERRIDE", { infer: true })
    if (typeof override === "string" && override.length > 0) {
      return override
    }
    switch (profundidad) {
      case "JUNIOR":
        return this.config.get("AI_MODEL_JUNIOR", { infer: true })
      case "SEMI_SENIOR":
        return this.config.get("AI_MODEL_SEMI_SENIOR", { infer: true })
      case "SENIOR":
        return this.config.get("AI_MODEL_SENIOR", { infer: true })
      default:
        // El tipo `ProfundidadEntrevistaIa` es una union cerrada — este default
        // es defensa en profundidad por si la env permite una nueva variante.
        return this.config.get("AI_MODEL_SEMI_SENIOR", { infer: true })
    }
  }

  evaluarRepoCualitativo(
    input: EvaluarRepoCualitativoInput,
  ): Promise<EvaluarRepoCualitativoOutput> {
    return this.provider.evaluarRepoCualitativo(input)
  }

  mantenerTurnoComprension(
    input: MantenerTurnoComprensionInput,
  ): Promise<MantenerTurnoComprensionOutput> {
    return this.provider.mantenerTurnoComprension(input)
  }

  mantenerTurnoEntrevista(
    input: MantenerTurnoEntrevistaInput,
  ): Promise<MantenerTurnoEntrevistaOutput> {
    return this.provider.mantenerTurnoEntrevista(input)
  }
}
