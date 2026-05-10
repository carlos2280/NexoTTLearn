import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Param,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { SkipThrottle, Throttle } from "@nestjs/throttler"
import {
  aceptarAvisoPrivacidadSchema,
  cambiarPasswordSchema,
  desbloquearSchema,
  loginSchema,
  regenerarPasswordInicialSchema,
} from "@nexott-learn/shared-types"
import { RolUsuario } from "@prisma/client"
import { Request, Response } from "express"
import { extractContextoHttp } from "../common/audit/extract-contexto"
import { CurrentUser } from "../common/decorators/current-user.decorator"
import { Public } from "../common/decorators/public.decorator"
import { RequiereMotivo } from "../common/decorators/requiere-motivo.decorator"
import { Roles } from "../common/decorators/roles.decorator"
import { apiErrorCodes } from "../common/errors/api-error.codes"
import { emitirCsrfToken, limpiarCookieCsrf } from "../common/http/csrf-helper"
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe"
import { SesionUsuario } from "../common/types/sesion.types"
import { AppEnv } from "../config/env.validation"
import { AuthService } from "./auth.service"
import { LoginResponse, PerfilSesion, ResultadoRegenerarPassword } from "./auth.types"

const NOMBRE_COOKIE_SESION = "nexott.sid"

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService<AppEnv, true>,
  ) {}

  @Post("login")
  @Public()
  @SkipThrottle({ short: true, long: true })
  @Throttle({ short: { ttl: 60_000, limit: 5 } })
  @HttpCode(HttpStatus.OK)
  async login(
    @Body(new ZodValidationPipe(loginSchema))
    input: { email: string; password: string },
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponse> {
    const { perfil } = await this.authService.validarCredenciales(
      input.email,
      input.password,
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
    emitirCsrfToken(req, res, { cookieSecure: this.config.get("COOKIE_SECURE", { infer: true }) })

    await new Promise<void>((resolve, reject) => {
      req.session.save((err: unknown) => {
        if (err) {
          reject(err instanceof Error ? err : new Error(String(err)))
          return
        }
        resolve()
      })
    })

    return { mfaRequired: false, perfil }
  }

  @Get("me")
  async me(@CurrentUser() usuario: SesionUsuario | undefined): Promise<PerfilSesion> {
    if (!usuario) {
      throw new UnauthorizedException({
        code: apiErrorCodes.noAutenticado,
        message: "Sesion invalida.",
      })
    }
    return await this.authService.obtenerPerfil(usuario.usuarioId)
  }

  @Delete("session")
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<void> {
    const usuarioId = req.session.usuarioId
    const contexto = extractContextoHttp(req)
    await new Promise<void>((resolve, reject) => {
      req.session.destroy((err: unknown) => {
        if (err) {
          reject(err instanceof Error ? err : new Error(String(err)))
          return
        }
        resolve()
      })
    })
    res.clearCookie(NOMBRE_COOKIE_SESION, { path: "/" })
    limpiarCookieCsrf(res)
    if (usuarioId) {
      await this.authService.registrarLogout(usuarioId, contexto)
    }
  }

  @Delete("sesiones-otras")
  @HttpCode(HttpStatus.NO_CONTENT)
  async cerrarOtrasSesiones(
    @CurrentUser() usuario: SesionUsuario | undefined,
    @Req() req: Request,
  ): Promise<void> {
    if (!usuario) {
      throw new UnauthorizedException({
        code: apiErrorCodes.noAutenticado,
        message: "Sesion invalida.",
      })
    }
    await this.authService.invalidarOtrasSesiones(usuario.usuarioId, req.sessionID)
  }

  @Post("cambiar-password")
  @HttpCode(HttpStatus.NO_CONTENT)
  async cambiarPassword(
    @Body(new ZodValidationPipe(cambiarPasswordSchema))
    input: { passwordActual: string; passwordNuevo: string },
    @CurrentUser() usuario: SesionUsuario | undefined,
    @Req() req: Request,
  ): Promise<void> {
    if (!usuario) {
      throw new UnauthorizedException({
        code: apiErrorCodes.noAutenticado,
        message: "Sesion invalida.",
      })
    }
    await this.authService.cambiarPassword(
      usuario.usuarioId,
      req.sessionID,
      input.passwordActual,
      input.passwordNuevo,
      extractContextoHttp(req),
    )
  }

  @Post("aceptar-aviso-privacidad")
  @HttpCode(HttpStatus.NO_CONTENT)
  async aceptarAviso(
    @Body(new ZodValidationPipe(aceptarAvisoPrivacidadSchema))
    input: { versionAviso: string },
    @CurrentUser() usuario: SesionUsuario | undefined,
    @Req() req: Request,
  ): Promise<void> {
    if (!usuario) {
      throw new UnauthorizedException({
        code: apiErrorCodes.noAutenticado,
        message: "Sesion invalida.",
      })
    }
    await this.authService.aceptarAvisoPrivacidad(
      usuario.usuarioId,
      input.versionAviso,
      extractContextoHttp(req),
    )
  }

  @Post("regenerar-password-inicial")
  @Roles(RolUsuario.ADMIN)
  @RequiereMotivo()
  @Throttle({ short: { ttl: 60 * 60 * 1000, limit: 10 } })
  async regenerarPasswordInicial(
    @Body(new ZodValidationPipe(regenerarPasswordInicialSchema))
    input: { usuarioId: string },
    @CurrentUser() admin: SesionUsuario | undefined,
    @Req() req: Request,
  ): Promise<ResultadoRegenerarPassword> {
    if (!admin) {
      throw new InternalServerErrorException({
        code: apiErrorCodes.errorInterno,
        message: "Sesion invalida tras pasar guards.",
      })
    }
    if (input.usuarioId === admin.usuarioId) {
      throw new ForbiddenException({
        code: apiErrorCodes.prohibido,
        message: "Un administrador no puede regenerar su propia contrasena por este endpoint.",
      })
    }
    return await this.authService.regenerarPasswordInicial(
      admin.usuarioId,
      input.usuarioId,
      extractContextoHttp(req),
    )
  }

  @Post("desbloquear")
  @Roles(RolUsuario.ADMIN)
  @RequiereMotivo()
  @HttpCode(HttpStatus.NO_CONTENT)
  async desbloquear(
    @Body(new ZodValidationPipe(desbloquearSchema)) input: { usuarioId: string },
    @CurrentUser() admin: SesionUsuario | undefined,
    @Req() req: Request,
  ): Promise<void> {
    if (!admin) {
      throw new InternalServerErrorException({
        code: apiErrorCodes.errorInterno,
        message: "Sesion invalida tras pasar guards.",
      })
    }
    await this.authService.desbloquear(admin.usuarioId, input.usuarioId, extractContextoHttp(req))
  }

  @Delete("sesiones/:sid")
  @Roles(RolUsuario.ADMIN)
  @RequiereMotivo()
  @HttpCode(HttpStatus.NO_CONTENT)
  async eliminarSesion(
    @Param("sid") sid: string,
    @CurrentUser() admin: SesionUsuario | undefined,
    @Req() req: Request,
  ): Promise<void> {
    if (!admin) {
      throw new InternalServerErrorException({
        code: apiErrorCodes.errorInterno,
        message: "Sesion invalida tras pasar guards.",
      })
    }
    await this.authService.eliminarSesion(admin.usuarioId, sid, extractContextoHttp(req))
  }
}
