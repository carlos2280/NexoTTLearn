import { useUsuarioActual } from "@/features/auth/hooks/use-usuario-actual"
import { EmptyState } from "@/shared/ui/patterns/empty-state"
import { LayoutDashboard } from "lucide-react"

export function BandejaAdminPage() {
  const { data: usuario } = useUsuarioActual()

  if (!usuario) {
    return null
  }

  return (
    <div className="px-6 py-8 md:px-10 md:py-12">
      <EmptyState
        icon={LayoutDashboard}
        title="Bandeja en construcción"
        description="Estamos rediseñando la bandeja del administrador. Vuelve pronto."
      />
    </div>
  )
}
