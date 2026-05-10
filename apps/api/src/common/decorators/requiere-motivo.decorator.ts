import { CustomDecorator, SetMetadata } from "@nestjs/common"

export const REQUIERE_MOTIVO_KEY = "requiereMotivo"

/**
 * Marca un endpoint como sensible: requiere el header `X-Motivo` (no vacio,
 * no solo whitespace). El `MotivoGuard` global lee esta metadata y rechaza la
 * peticion con `422 MOTIVO_REQUERIDO` si el header esta ausente.
 */
export const RequiereMotivo = (): CustomDecorator<string> => SetMetadata(REQUIERE_MOTIVO_KEY, true)
