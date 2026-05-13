import { NexoMark } from "@/shared/components/nexo-mark"
import { Wordmark } from "@/shared/components/wordmark"
import { NAV_ITEMS } from "../nav-items"
import { ParticipanteNavItemRow } from "./participante-nav-item"

interface ParticipanteSidebarProps {
  readonly colapsado: boolean
}

export function ParticipanteSidebar({ colapsado }: ParticipanteSidebarProps) {
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
      <nav aria-label="Navegación principal" className="mt-8 flex flex-1 flex-col gap-1 px-3">
        {NAV_ITEMS.map((item) => (
          <ParticipanteNavItemRow key={item.id} item={item} colapsado={colapsado} />
        ))}
      </nav>
    </div>
  )
}
