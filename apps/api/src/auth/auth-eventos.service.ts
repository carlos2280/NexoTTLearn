import { Injectable, Logger } from "@nestjs/common"
import type { AuthEventoTipo, Prisma } from "@prisma/client"
import { PrismaService } from "../common/prisma/prisma.service"

interface RegistrarEventoOptions {
  readonly tipo: AuthEventoTipo
  readonly usuarioId?: string | null
  readonly email?: string | null
  readonly ip?: string | null
  readonly userAgent?: string | null
  readonly metadata?: Prisma.InputJsonValue
}

/**
 * AuthEventosService — Audit log de eventos de autenticacion.
 *
 * Escribe en `auth_eventos` los eventos: LOGIN_OK, LOGIN_FALLIDO, LOGIN_BLOQUEADO,
 * MFA_SETUP_INICIADO, MFA_ACTIVADO, MFA_VERIFICADO, MFA_FALLIDO, PASSWORD_CAMBIADO, LOGOUT.
 *
 * El registro NO debe bloquear el flujo de auth: si falla la escritura, lo logueamos
 * y continuamos. La autenticacion siempre tiene prioridad sobre el log.
 *
 * NUNCA registrar secretos (passwords, mfaSecret, challengeIds) en `metadata`.
 */
@Injectable()
export class AuthEventosService {
  private readonly logger = new Logger(AuthEventosService.name)

  constructor(private readonly prisma: PrismaService) {}

  async registrar(opts: RegistrarEventoOptions): Promise<void> {
    try {
      await this.prisma.authEvento.create({
        data: {
          tipo: opts.tipo,
          usuarioId: opts.usuarioId ?? null,
          email: opts.email ?? null,
          ip: opts.ip ?? null,
          userAgent: opts.userAgent ?? null,
          metadata: opts.metadata,
        },
      })
    } catch (err) {
      this.logger.error(`No se pudo registrar evento ${opts.tipo}`, err)
    }
  }
}
