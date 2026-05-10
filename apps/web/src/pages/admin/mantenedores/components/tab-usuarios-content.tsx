import { EmptyState } from "@/shared/ui/patterns/empty-state"
import type { UsuarioAdmin } from "@nexott-learn/shared-types"
import { Users } from "lucide-react"
import { UsuariosTable } from "./usuarios-table"

interface TabUsuariosContentProps {
  readonly items: readonly UsuarioAdmin[]
  readonly isLoading: boolean
  readonly isError: boolean
  readonly hasActiveFilters: boolean
  readonly onEditar: (usuario: UsuarioAdmin) => void
  readonly onResetPassword: (usuario: UsuarioAdmin) => void
  readonly onActivarMfa: (usuario: UsuarioAdmin) => void
  readonly onResetMfa: (usuario: UsuarioAdmin) => void
  readonly onBloquear: (usuario: UsuarioAdmin) => void
  readonly onDesbloquear: (usuario: UsuarioAdmin) => void
}

export function TabUsuariosContent({
  items,
  isLoading,
  isError,
  hasActiveFilters,
  ...handlers
}: TabUsuariosContentProps) {
  if (isError) {
    return (
      <EmptyState
        icon={Users}
        title="No se pudo cargar la lista"
        description="Reintenta en unos segundos."
      />
    )
  }
  if (!isLoading && items.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title={hasActiveFilters ? "Sin resultados" : "Aún no hay usuarios"}
        description={
          hasActiveFilters
            ? "Ajusta filtros o búsqueda para encontrar lo que buscas."
            : "Crea el primer usuario para empezar."
        }
      />
    )
  }
  return <UsuariosTable items={items} isLoading={isLoading} {...handlers} />
}
