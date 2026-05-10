import type { UsuarioAdmin } from "@nexott-learn/shared-types"
import { UsuarioAccionesMenu } from "./usuario-acciones-menu"
import { EstadoBadge, MfaBadge, RolBadge } from "./usuario-badges"

interface UsuariosRowProps {
  readonly usuario: UsuarioAdmin
  readonly onEditar: (usuario: UsuarioAdmin) => void
  readonly onResetPassword: (usuario: UsuarioAdmin) => void
  readonly onActivarMfa: (usuario: UsuarioAdmin) => void
  readonly onResetMfa: (usuario: UsuarioAdmin) => void
  readonly onBloquear: (usuario: UsuarioAdmin) => void
  readonly onDesbloquear: (usuario: UsuarioAdmin) => void
}

export function UsuariosRow({
  usuario,
  onEditar,
  onResetPassword,
  onActivarMfa,
  onResetMfa,
  onBloquear,
  onDesbloquear,
}: UsuariosRowProps) {
  const iniciales = `${usuario.nombre[0] ?? ""}${usuario.apellido[0] ?? ""}`.toUpperCase()
  const mfaConfirmado = usuario.mfaConfirmadoEn !== null

  return (
    <tr className="border-glass-border border-t transition-colors hover:bg-glass-1/60">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex size-9 items-center justify-center rounded-full bg-glass-2 font-medium text-text-primary text-xs"
          >
            {iniciales}
          </span>
          <div className="min-w-0">
            <div className="truncate font-medium text-sm text-text-primary">
              {usuario.nombre} {usuario.apellido}
            </div>
            <div className="truncate text-text-muted text-xs">{usuario.email}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <RolBadge rol={usuario.rol} />
      </td>
      <td className="px-4 py-3">
        <EstadoBadge estado={usuario.estado} />
      </td>
      <td className="px-4 py-3">
        <MfaBadge activado={usuario.mfaActivado} confirmado={mfaConfirmado} />
      </td>
      <td className="px-4 py-3 text-right">
        <UsuarioAccionesMenu
          usuario={usuario}
          onEditar={() => onEditar(usuario)}
          onResetPassword={() => onResetPassword(usuario)}
          onActivarMfa={() => onActivarMfa(usuario)}
          onResetMfa={() => onResetMfa(usuario)}
          onBloquear={() => onBloquear(usuario)}
          onDesbloquear={() => onDesbloquear(usuario)}
        />
      </td>
    </tr>
  )
}
