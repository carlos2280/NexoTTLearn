import { SetMetadata } from "@nestjs/common"
import type { Rol } from "@nexott-learn/shared-types"

export const ROLES_REQUERIDOS_KEY = "roles_requeridos"

export const Roles = (...roles: Rol[]) => SetMetadata(ROLES_REQUERIDOS_KEY, roles)
