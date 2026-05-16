import { CustomDecorator, SetMetadata } from "@nestjs/common"

export const IS_PUBLIC_KEY = "isPublic"

/**
 * Marca un endpoint como publico (sin sesion requerida).
 * Por defecto el SesionGuard global rechaza cualquier ruta sin sesion;
 * solo los endpoints anotados con @Public() quedan exentos.
 */
export const Public = (): CustomDecorator<string> => SetMetadata(IS_PUBLIC_KEY, true)
