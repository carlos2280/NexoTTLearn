import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from "@nestjs/common"
import { Request } from "express"
import { apiErrorCodes } from "../errors/api-error.codes"
import { PrismaService } from "../prisma/prisma.service"

/**
 * Allow-list de rutas accesibles cuando `Usuario.requiereSetupMfa = true`.
 * Cualquier otra ruta autenticada se rechaza con `403 SETUP_MFA_REQUERIDO`.
 *
 * Pares (METODO, PATH normalizado SIN prefijo global). El path se normaliza
 * sin trailing slash y comparado exacto: las sub-rutas no entran por error.
 */
const ALLOW_LIST: ReadonlyArray<{ readonly method: string; readonly path: string }> = [
  { method: "POST", path: "/auth/mfa/setup" },
  { method: "POST", path: "/auth/mfa/enable" },
  { method: "POST", path: "/auth/cambiar-password" },
  { method: "GET", path: "/auth/me" },
  { method: "POST", path: "/auth/aceptar-aviso-privacidad" },
  { method: "DELETE", path: "/auth/session" },
]

/**
 * MustSetupMfaGuard — D-MFA-4 estado bisagra.
 *
 * Cuando un admin crea un colaborador con `habilitarMfa=true`, se persiste
 * `requiere_setup_mfa=true`. El primer login completa el password pero el
 * usuario queda atrapado en una "antesala": solo puede ejecutar el flujo de
 * setup TOTP. Tras `mfa/enable` exitoso, el flag pasa a `false` y el guard
 * deja de intervenir.
 *
 * Orden global: corre DESPUES del SesionGuard (necesita usuarioId) y DESPUES
 * del CsrfGuard (la mutacion ya esta validada), pero ANTES de RolesGuard:
 * incluso un ADMIN con setup pendiente debe completarlo antes de operar.
 */
@Injectable()
export class MustSetupMfaGuard implements CanActivate {
  private readonly logger = new Logger(MustSetupMfaGuard.name)

  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>()
    const usuarioId = request.session?.usuarioId
    if (!usuarioId) {
      // Sin sesion: el SesionGuard previo ya decidio (publico o 401).
      return true
    }

    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { requiereSetupMfa: true },
    })
    if (usuario?.requiereSetupMfa !== true) {
      return true
    }

    const path = normalizarPath(request.path)
    const permitida = ALLOW_LIST.some(
      (entry) => entry.method === request.method && entry.path === path,
    )
    if (permitida) {
      return true
    }

    this.logger.warn(
      `Acceso bloqueado por setup MFA pendiente: usuario=${usuarioId} ${request.method} ${path}`,
    )
    throw new ForbiddenException({
      code: apiErrorCodes.setupMfaRequerido,
      message: "Debe completar el setup de MFA antes de continuar.",
    })
  }
}

function normalizarPath(raw: string): string {
  // El prefijo global `/api/v1` se aplica via `app.setGlobalPrefix`. Cuando
  // Express expone `req.path` desde un controller normal, NO incluye el
  // prefijo, pero por seguridad se normaliza ambos casos.
  const sinPrefijo = raw.startsWith("/api/v1") ? raw.slice("/api/v1".length) : raw
  if (sinPrefijo.length > 1 && sinPrefijo.endsWith("/")) {
    return sinPrefijo.slice(0, -1)
  }
  return sinPrefijo
}
