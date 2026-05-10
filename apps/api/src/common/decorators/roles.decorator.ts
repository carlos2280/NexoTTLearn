import { CustomDecorator, SetMetadata } from "@nestjs/common"
import { RolUsuario } from "../types/sesion.types"

export const ROLES_KEY = "roles"

/**
 * Marca un endpoint como restringido a uno o mas roles. Funciona en conjunto
 * con `RolesGuard` global registrado despues de `SesionGuard`. Si la lista esta
 * vacia o el decorator no se aplica, el endpoint solo exige sesion.
 */
export const Roles = (...roles: readonly RolUsuario[]): CustomDecorator<string> =>
  SetMetadata(ROLES_KEY, roles)
