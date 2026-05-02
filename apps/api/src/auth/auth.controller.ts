import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common"
import { SkipThrottle, Throttle } from "@nestjs/throttler"
import {
  type CambiarPasswordInput,
  type ConfirmMfaSetupInput,
  type ConfirmMfaSetupResponse,
  type LoginInput,
  type LoginResult,
  type UsuarioPublico,
  type VerifyMfaInput,
  type VerifyMfaResponse,
  cambiarPasswordSchema,
  confirmMfaSetupSchema,
  loginSchema,
  verifyMfaSchema,
} from "@nexott-learn/shared-types"
import type { Request } from "express"
import { UsuarioActual } from "../common/decorators/usuario-actual.decorator"
import { SesionGuard } from "../common/guards/sesion.guard"
import { ZodValidationPipe } from "../common/zod-validation.pipe"
import { AuthEventosService } from "./auth-eventos.service"
import { AuthService } from "./auth.service"
import { extraerCliente } from "./lib/extraer-cliente"
import { MfaService } from "./mfa/mfa.service"
import type { UsuarioSesion } from "./tipos"

// 30 req/min por IP en /auth/* — defensivo pre-autenticacion.
// /auth/login y MFA endpoints declaran su propio limite mas estricto.
@Throttle({ default: { limit: 30, ttl: 60_000 } })
@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly mfaService: MfaService,
    private readonly eventos: AuthEventosService,
  ) {}

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @Header("Cache-Control", "no-store")
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async login(
    @Body(new ZodValidationPipe(loginSchema)) input: LoginInput,
    @Req() req: Request,
  ): Promise<LoginResult> {
    const cliente = extraerCliente(req)
    const resultado = await this.authService.validarCredenciales(
      input.email,
      input.password,
      cliente,
    )

    if (resultado.tipo === "mfa-verify-pendiente") {
      const challengeId = this.mfaService.iniciarChallenge(resultado.usuarioId)
      return {
        status: "mfa-verify",
        challengeId,
        emailEnmascarado: resultado.emailEnmascarado,
      }
    }

    if (resultado.tipo === "mfa-setup-pendiente") {
      const setup = await this.mfaService.iniciarSetup(resultado.usuarioId, cliente)
      return {
        status: "mfa-setup",
        challengeId: setup.challengeId,
        emailEnmascarado: resultado.emailEnmascarado,
        secret: setup.secret,
        otpauthUri: setup.otpauthUri,
      }
    }

    await new Promise<void>((resolve, reject) => {
      req.login(resultado.usuario, (err) => (err ? reject(err) : resolve()))
    })

    return { status: "ok", usuario: resultado.usuario }
  }

  @Post("verify-mfa")
  @HttpCode(HttpStatus.OK)
  @Header("Cache-Control", "no-store")
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async verifyMfa(
    @Body(new ZodValidationPipe(verifyMfaSchema)) input: VerifyMfaInput,
    @Req() req: Request,
  ): Promise<VerifyMfaResponse> {
    const cliente = extraerCliente(req)
    const usuarioId = await this.mfaService.verificarChallenge(
      input.challengeId,
      input.code,
      cliente,
    )
    const usuario = await this.authService.confirmarLoginPostMfa(usuarioId, cliente)

    await new Promise<void>((resolve, reject) => {
      req.login(usuario, (err) => (err ? reject(err) : resolve()))
    })

    return { usuario }
  }

  @Post("confirm-mfa-setup")
  @HttpCode(HttpStatus.OK)
  @Header("Cache-Control", "no-store")
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async confirmMfaSetup(
    @Body(new ZodValidationPipe(confirmMfaSetupSchema)) input: ConfirmMfaSetupInput,
    @Req() req: Request,
  ): Promise<ConfirmMfaSetupResponse> {
    const cliente = extraerCliente(req)
    const usuarioId = await this.mfaService.confirmarSetup(input.challengeId, input.code, cliente)
    const usuario = await this.authService.confirmarLoginPostMfa(usuarioId, cliente)

    await new Promise<void>((resolve, reject) => {
      req.login(usuario, (err) => (err ? reject(err) : resolve()))
    })

    return { usuario }
  }

  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() req: Request,
    @UsuarioActual() usuario: UsuarioSesion | undefined,
  ): Promise<void> {
    const cliente = extraerCliente(req)
    if (usuario) {
      await this.eventos.registrar({
        tipo: "LOGOUT",
        usuarioId: usuario.id,
        email: usuario.email,
        ip: cliente.ip,
        userAgent: cliente.userAgent,
      })
    }
    await new Promise<void>((resolve, reject) => {
      req.logout((err) => (err ? reject(err) : resolve()))
    })
    await new Promise<void>((resolve, reject) => {
      req.session?.destroy((err) => (err ? reject(err) : resolve()))
    })
  }

  @Post("cambiar-password")
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(SesionGuard)
  async cambiarPassword(
    @Body(new ZodValidationPipe(cambiarPasswordSchema)) input: CambiarPasswordInput,
    @UsuarioActual() usuario: UsuarioSesion | undefined,
    @Req() req: Request,
  ): Promise<void> {
    if (!usuario) {
      throw new UnauthorizedException("Sesion no valida")
    }

    await this.authService.cambiarPassword(
      usuario.id,
      input.passwordActual,
      input.passwordNuevo,
      extraerCliente(req),
    )
  }

  @Get("me")
  @UseGuards(SesionGuard)
  @SkipThrottle()
  me(@UsuarioActual() usuario: UsuarioSesion | undefined): UsuarioPublico {
    if (!usuario) {
      throw new UnauthorizedException("Sesion no valida")
    }
    return usuario
  }
}
