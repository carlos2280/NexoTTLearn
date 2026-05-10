import { RUTAS } from "@/shared/constants/rutas"
import type { UsuarioPublico } from "@nexott-learn/shared-types"

// Decide la ruta destino tras un login exitoso o tras restaurar sesion.
// Centralizado aqui para que la regla viva en un solo lugar.
export function calcularRutaPostLogin(usuario: UsuarioPublico): string {
  if (usuario.debeCambiarPassword) {
    return RUTAS.cambiarPassword
  }
  if (usuario.rol === "ADMIN") {
    return RUTAS.admin.bandeja
  }
  if (usuario.rol === "PARTICIPANTE") {
    return RUTAS.participante.bandeja
  }
  return RUTAS.login
}
