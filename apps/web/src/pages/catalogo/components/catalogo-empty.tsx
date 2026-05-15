import { EmptyState } from "@/shared/components/ui/empty-state"
import { Compass } from "lucide-react"

export function CatalogoEmpty() {
  return (
    <EmptyState
      icono={Compass}
      tono="panel"
      titulo="No hay cursos abiertos a voluntariado"
      descripcion="Cuando un curso este disponible para que te inscribas por tu cuenta, aparecera aqui. Suma a tu ficha sin esperar a que te asignen."
    />
  )
}
