import { Skeleton } from "@/shared/ui/patterns/skeleton"
import type { UsuarioAdmin } from "@nexott-learn/shared-types"
import { UsuariosRow } from "./usuarios-row"

const SKELETON_KEYS = ["sk-a", "sk-b", "sk-c", "sk-d", "sk-e"] as const

interface UsuariosTableProps {
  readonly items: readonly UsuarioAdmin[]
  readonly isLoading: boolean
  readonly onEditar: (usuario: UsuarioAdmin) => void
  readonly onResetPassword: (usuario: UsuarioAdmin) => void
  readonly onActivarMfa: (usuario: UsuarioAdmin) => void
  readonly onResetMfa: (usuario: UsuarioAdmin) => void
  readonly onBloquear: (usuario: UsuarioAdmin) => void
  readonly onDesbloquear: (usuario: UsuarioAdmin) => void
}

export function UsuariosTable({ items, isLoading, ...handlers }: UsuariosTableProps) {
  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-glass-border bg-glass-1">
      <table className="w-full text-left">
        <thead className="bg-glass-2 text-text-muted text-xs">
          <tr>
            <th className="px-4 py-3 font-medium">Persona</th>
            <th className="px-4 py-3 font-medium">Rol</th>
            <th className="px-4 py-3 font-medium">Estado</th>
            <th className="px-4 py-3 font-medium">MFA</th>
            <th className="px-4 py-3" aria-label="Acciones" />
          </tr>
        </thead>
        <tbody>
          {isLoading
            ? SKELETON_KEYS.map((key) => <SkeletonRow key={key} />)
            : items.map((usuario) => (
                <UsuariosRow key={usuario.id} usuario={usuario} {...handlers} />
              ))}
        </tbody>
      </table>
    </div>
  )
}

function SkeletonRow() {
  return (
    <tr className="border-glass-border border-t">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-full" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-2.5 w-32" />
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-5 w-16" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-5 w-20" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-5 w-16" />
      </td>
      <td className="px-4 py-3 text-right">
        <Skeleton className="ml-auto size-8 rounded-md" />
      </td>
    </tr>
  )
}
