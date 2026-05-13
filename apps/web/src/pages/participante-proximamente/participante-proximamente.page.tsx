import { NAV_ITEMS } from "@/features/participante-layout/nav-items"
import { Hammer } from "lucide-react"
import { useLocation } from "react-router-dom"

export function ParticipanteProximamentePage() {
  const { pathname } = useLocation()
  const item = NAV_ITEMS.find((nav) => nav.ruta === pathname)
  const etiqueta = item?.etiqueta ?? "Esta sección"

  return (
    <div className="mx-auto flex max-w-[720px] flex-col items-center justify-center gap-4 py-16 text-center">
      <Hammer className="h-8 w-8 text-text-tertiary" aria-hidden={true} />
      <h1 className="text-h2 text-text-primary">{etiqueta}</h1>
      <p className="text-body text-text-secondary">
        Esta pantalla está en construcción. Estará disponible en un próximo sprint.
      </p>
    </div>
  )
}
