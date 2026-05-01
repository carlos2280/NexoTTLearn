import { Injectable } from "@nestjs/common"
import { PassportSerializer } from "@nestjs/passport"
import { AuthService } from "./auth.service"
import type { UsuarioSesion } from "./tipos"

@Injectable()
export class SerializadorUsuario extends PassportSerializer {
  constructor(private readonly authService: AuthService) {
    super()
  }

  serializeUser(usuario: UsuarioSesion, done: (err: Error | null, id: string) => void): void {
    done(null, usuario.id)
  }

  async deserializeUser(
    id: string,
    done: (err: Error | null, usuario: UsuarioSesion | null) => void,
  ): Promise<void> {
    try {
      const usuario = await this.authService.obtenerPorId(id)
      done(null, usuario)
    } catch (err) {
      done(err as Error, null)
    }
  }
}
