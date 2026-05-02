import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
  UsePipes,
} from "@nestjs/common"
import {
  type CambiarPasswordInput,
  type LoginInput,
  type LoginResponse,
  type UsuarioPublico,
  cambiarPasswordSchema,
  loginSchema,
} from "@nexott-learn/shared-types"
import type { Request } from "express"
import { UsuarioActual } from "../common/decorators/usuario-actual.decorator"
import { SesionGuard } from "../common/guards/sesion.guard"
import { ZodValidationPipe } from "../common/zod-validation.pipe"
import { AuthService } from "./auth.service"
import type { UsuarioSesion } from "./tipos"

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(loginSchema))
  async login(@Body() input: LoginInput, @Req() req: Request): Promise<LoginResponse> {
    const usuario = await this.authService.validarCredenciales(input.email, input.password)

    await new Promise<void>((resolve, reject) => {
      req.login(usuario, (err) => (err ? reject(err) : resolve()))
    })

    return { usuario }
  }

  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: Request): Promise<void> {
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
  @UsePipes(new ZodValidationPipe(cambiarPasswordSchema))
  async cambiarPassword(
    @Body() input: CambiarPasswordInput,
    @UsuarioActual() usuario: UsuarioSesion | undefined,
  ): Promise<void> {
    if (!usuario) {
      throw new UnauthorizedException("Sesion no valida")
    }

    await this.authService.cambiarPassword(usuario.id, input.passwordActual, input.passwordNuevo)
  }

  @Get("me")
  @UseGuards(SesionGuard)
  me(@UsuarioActual() usuario: UsuarioSesion | undefined): UsuarioPublico {
    if (!usuario) {
      throw new UnauthorizedException("Sesion no valida")
    }
    return usuario
  }
}
