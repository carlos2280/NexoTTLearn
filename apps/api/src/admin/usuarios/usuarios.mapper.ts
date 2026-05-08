import type { UsuarioAdmin } from "@nexott-learn/shared-types"
import type { Prisma } from "@prisma/client"

// Selección compartida para listado, lectura y mutaciones. Nunca incluye
// passwordHash ni mfaSecret: ese material no sale del back bajo ningún
// endpoint de Mantenedores.
export const USUARIO_SELECT = {
  id: true,
  email: true,
  nombre: true,
  apellido: true,
  rol: true,
  bloqueado: true,
  bloqueadoAt: true,
  mfaActivado: true,
  mfaConfirmadoEn: true,
  debeCambiarPassword: true,
  passwordCambiadoEn: true,
  ultimoLoginEn: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UsuarioSelect

export type UsuarioRow = Prisma.UsuarioGetPayload<{ select: typeof USUARIO_SELECT }>

export function mapUsuarioToDto(row: UsuarioRow): UsuarioAdmin {
  // El schema Prisma admite VIEWER/SUPER_ADMIN pero Mantenedores MVP solo
  // expone ADMIN/PARTICIPANTE (MAESTRO §11). Si aparece otro rol filtramos
  // antes (whereRolMantenedor) o caería como string sin tipar.
  return {
    id: row.id,
    email: row.email,
    nombre: row.nombre,
    apellido: row.apellido,
    rol: row.rol as UsuarioAdmin["rol"],
    estado: row.bloqueado ? "BLOQUEADO" : "ACTIVO",
    mfaActivado: row.mfaActivado,
    mfaConfirmadoEn: row.mfaConfirmadoEn ? row.mfaConfirmadoEn.toISOString() : null,
    debeCambiarPassword: row.debeCambiarPassword,
    bloqueadoAt: row.bloqueadoAt ? row.bloqueadoAt.toISOString() : null,
    ultimoLoginEn: row.ultimoLoginEn ? row.ultimoLoginEn.toISOString() : null,
    passwordCambiadoEn: row.passwordCambiadoEn ? row.passwordCambiadoEn.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}
