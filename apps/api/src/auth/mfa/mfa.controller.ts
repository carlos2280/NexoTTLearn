import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { Throttle } from "@nestjs/throttler"
import { mfaDisableSchema, mfaEnableSchema, mfaVerifySchema } from "@nexott-learn/shared-types"
import { RolUsuario } from "@prisma/client"
import { Request, Response } from "express"
import { extractContextoHttp } from "../../common/audit/extract-contexto"
import { CurrentUser } from "../../common/decorators/current-user.decorator"
import { Public } from "../../common/decorators/public.decorator"
import { RequiereMotivo } from "../../common/decorators/requiere-motivo.decorator"
import { apiErrorCodes } from "../../common/errors/api-error.codes"
import { emitirCsrfToken } from "../../common/http/csrf-helper"
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe"
import { SesionUsuario } from "../../common/types/sesion.types"
import { AppEnv } from "../../config/env.validation"
import { PerfilSesion } from "../auth.types"
import { MfaService } from "./mfa.service"
import { MfaSetupResponse } from "./mfa.types"

interface MfaVerifyResponse {
  readonly perfil: PerfilSesion
}

@Controller("auth/mfa")
export class MfaController {
  constructor(
    private readonly mfaService: MfaService,
    private readonly config: ConfigService<AppEnv, true>,
  ) {}

  @Post("setup")
  setup(
    @CurrentUser() usuario: SesionUsuario | undefined,
    @Req() req: Request,
  ): Promise<MfaSetupResponse> {
    if (!usuario) {
      throw new UnauthorizedException({
        code: apiErrorCodes.noAutenticado,
        message: "Sesion invalida.",
      })
    }
    return this.mfaService.setup(usuario.usuarioId, extractContextoHttp(req))
  }

  @Post("enable")
  @HttpCode(HttpStatus.NO_CONTENT)
  async enable(
    @Body(new ZodValidationPipe(mfaEnableSchema)) input: { codigo: string },
    @CurrentUser() usuario: SesionUsuario | undefined,
    @Req() req: Request,
  ): Promise<void> {
    if (!usuario) {
      throw new UnauthorizedException({
        code: apiErrorCodes.noAutenticado,
        message: "Sesion invalida.",
      })
    }
    await this.mfaService.enable(usuario.usuarioId, input.codigo, extractContextoHttp(req))
  }

  @Post("verify")
  @Public()
  @Throttle({ short: { ttl: 60_000, limit: 10 } })
  @HttpCode(HttpStatus.OK)
  async verify(
    @Body(new ZodValidationPipe(mfaVerifySchema))
    input: { mfaChallengeId: string; codigo: string },
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<MfaVerifyResponse> {
    const { perfil } = await this.mfaService.verify(
      input.mfaChallengeId,
      input.codigo,
      extractContextoHttp(req),
    )

    await new Promise<void>((resolve, reject) => {
      req.session.regenerate((err: unknown) => {
        if (err) {
          reject(err instanceof Error ? err : new Error(String(err)))
          return
        }
        resolve()
      })
    })

    req.session.usuarioId = perfil.usuarioId
    req.session.rol = perfil.rol
    emitirCsrfToken(req, res, {
      cookieSecure: this.config.get("COOKIE_SECURE", { infer: true }),
      cookieSameSite: this.config.get("COOKIE_SAMESITE", { infer: true }),
    })

    await new Promise<void>((resolve, reject) => {
      req.session.save((err: unknown) => {
        if (err) {
          reject(err instanceof Error ? err : new Error(String(err)))
          return
        }
        resolve()
      })
    })

    return { perfil }
  }

  @Delete()
  @RequiereMotivo()
  @HttpCode(HttpStatus.NO_CONTENT)
  async disable(
    @Body(new ZodValidationPipe(mfaDisableSchema))
    input: { codigo?: string; usuarioId?: string },
    @CurrentUser() usuario: SesionUsuario | undefined,
    @Req() req: Request,
  ): Promise<void> {
    if (!usuario) {
      throw new UnauthorizedException({
        code: apiErrorCodes.noAutenticado,
        message: "Sesion invalida.",
      })
    }
    const contexto = extractContextoHttp(req)

    if (input.usuarioId) {
      // Modo admin: requiere rol ADMIN.
      if (usuario.rol !== RolUsuario.ADMIN) {
        throw new ForbiddenException({
          code: apiErrorCodes.prohibido,
          message: "Solo un administrador puede desactivar MFA de otro usuario.",
        })
      }
      if (input.usuarioId === usuario.usuarioId) {
        throw new ForbiddenException({
          code: apiErrorCodes.prohibido,
          message: "Un administrador no puede desactivar su propio MFA por este modo.",
        })
      }
      await this.mfaService.disableAdmin(usuario.usuarioId, input.usuarioId, contexto)
      return
    }

    if (!input.codigo) {
      // Salvaguarda: el schema ya garantiza exactamente uno de los dos.
      throw new BadRequestException({
        code: apiErrorCodes.invalidBody,
        message: "Se requiere 'codigo' para auto-desactivar MFA.",
      })
    }
    await this.mfaService.disablePropio(usuario.usuarioId, input.codigo, contexto)
  }
}
