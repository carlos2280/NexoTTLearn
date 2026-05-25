import { NexoMark } from "@/shared/components/nexo-mark"
import { Wordmark } from "@/shared/components/wordmark"
import { NAV_ITEMS } from "../nav-items"
import type { GrupoNav } from "../types"
import { AdminNavItem } from "./admin-nav-item"
import { AdminSystemStatus } from "./admin-system-status"

interface AdminSidebarProps {
  readonly colapsado: boolean
}

const GRUPOS: readonly GrupoNav[] = ["principal", "soporte"]

const ETIQUETAS_GRUPO: Record<GrupoNav, string> = {
  principal: "Principal",
  soporte: "Soporte",
}

export function AdminSidebar({ colapsado }: AdminSidebarProps) {
  return (
    <div className="flex h-full flex-col py-6">
      <div className={colapsado ? "flex justify-center px-2" : "flex items-center gap-2 px-5"}>
        {colapsado ? (
          <NexoMark tono="solido" tamano={24} />
        ) : (
          <>
            <NexoMark tono="solido" tamano={24} />
            <Wordmark variant="full" />
          </>
        )}
      </div>
      <nav aria-label="Navegación principal" className="mt-10 flex flex-1 flex-col gap-6 px-3">
        {GRUPOS.map((grupo) => (
          <div key={grupo} className="flex w-full flex-col gap-1">
            {colapsado ? null : (
              <p className="nx-eyebrow px-3 pb-1 text-text-tertiary">{ETIQUETAS_GRUPO[grupo]}</p>
            )}
            <div className="flex w-full flex-col gap-0.5">
              {NAV_ITEMS.filter((item) => item.grupo === grupo).map((item) => (
                <AdminNavItem key={item.id} item={item} colapsado={colapsado} />
              ))}
            </div>
          </div>
        ))}
      </nav>
      <AdminSystemStatus colapsado={colapsado} />
    </div>
  )
}
