import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/primitives/dropdown-menu"
import type { UsuarioAdmin } from "@nexott-learn/shared-types"
import {
  KeyRound,
  Lock,
  MoreHorizontal,
  Pencil,
  ShieldCheck,
  ShieldOff,
  Unlock,
} from "lucide-react"

interface UsuarioAccionesMenuProps {
  readonly usuario: UsuarioAdmin
  readonly onEditar: () => void
  readonly onResetPassword: () => void
  readonly onActivarMfa: () => void
  readonly onResetMfa: () => void
  readonly onBloquear: () => void
  readonly onDesbloquear: () => void
}

export function UsuarioAccionesMenu({
  usuario,
  onEditar,
  onResetPassword,
  onActivarMfa,
  onResetMfa,
  onBloquear,
  onDesbloquear,
}: UsuarioAccionesMenuProps) {
  const bloqueado = usuario.estado === "BLOQUEADO"
  const mfaOn = usuario.mfaActivado

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex size-8 items-center justify-center rounded-[var(--radius-sm)] text-text-muted transition-colors hover:bg-glass-2 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-violet"
        aria-label={`Acciones para ${usuario.nombre} ${usuario.apellido}`}
      >
        <MoreHorizontal className="size-4" strokeWidth={1.75} aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[220px]">
        <DropdownMenuItem icon={Pencil} onSelect={onEditar}>
          Editar datos
        </DropdownMenuItem>
        <DropdownMenuItem icon={KeyRound} onSelect={onResetPassword}>
          Reset password
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {mfaOn ? (
          <DropdownMenuItem icon={ShieldOff} onSelect={onResetMfa}>
            Reset MFA
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem icon={ShieldCheck} onSelect={onActivarMfa}>
            Activar MFA
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        {bloqueado ? (
          <DropdownMenuItem icon={Unlock} onSelect={onDesbloquear}>
            Desbloquear cuenta
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem icon={Lock} tone="danger" onSelect={onBloquear}>
            Bloquear cuenta
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
