import { NexoMark } from "@/shared/components/nexo-mark"
import { Wordmark } from "@/shared/components/wordmark"
import { NAV_ITEMS } from "../nav-items"
import type { GrupoNav } from "../types"
import { AdminNavItem } from "./admin-nav-item"
import { AdminSidebarFooter } from "./admin-sidebar-footer"

interface AdminSidebarProps {
  readonly colapsado: boolean
}

const GRUPOS: readonly GrupoNav[] = ["principal", "soporte"]

export function AdminSidebar({ colapsado }: AdminSidebarProps) {
  return (
    <div className="flex h-full flex-col py-6">
      <div className={colapsado ? "flex justify-center px-2" : "flex items-center gap-2 px-5"}>
        {colapsado ? (
          <NexoMark tono="solido" tamano={32} />
        ) : (
          <>
            <NexoMark tono="solido" tamano={24} />
            <Wordmark variant="full" />
          </>
        )}
      </div>
      <nav aria-label="Navegación principal" className="mt-8 flex flex-1 flex-col gap-6 px-3">
        {GRUPOS.map((grupo) => (
          <div key={grupo} className="flex flex-col gap-0.5">
            {NAV_ITEMS.filter((item) => item.grupo === grupo).map((item) => (
              <AdminNavItem key={item.id} item={item} colapsado={colapsado} />
            ))}
          </div>
        ))}
      </nav>
      <AdminSidebarFooter colapsado={colapsado} />
    </div>
  )
}
