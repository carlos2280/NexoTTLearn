import { useUsuarioActual } from "@/features/auth/hooks/use-usuario-actual"
import { AvatarIniciales } from "@/shared/components/ui/avatar-iniciales"

interface AdminSidebarFooterProps {
  readonly colapsado: boolean
}

export function AdminSidebarFooter({ colapsado }: AdminSidebarFooterProps) {
  const { data: usuario } = useUsuarioActual()

  if (!usuario) {
    return null
  }

  if (colapsado) {
    return (
      <div className="flex justify-center px-2 py-3">
        <AvatarIniciales nombre={usuario.nombre} tamano="md" />
      </div>
    )
  }

  return (
    <div className="mx-3 flex items-center gap-3 px-3 py-2.5">
      <AvatarIniciales nombre={usuario.nombre} tamano="md" />
      <div className="flex min-w-0 flex-1 flex-col leading-tight">
        <span className="truncate font-medium text-body-sm text-text-primary">
          {usuario.nombre}
        </span>
        <span className="truncate text-caption text-text-tertiary capitalize">
          {usuario.rol.toLowerCase()}
        </span>
      </div>
    </div>
  )
}
