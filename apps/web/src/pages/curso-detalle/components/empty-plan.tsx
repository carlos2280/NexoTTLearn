import { Button } from "@/shared/components/ui/button"
import { RUTAS } from "@/shared/constants/rutas"
import { useNavigate } from "react-router-dom"

export function EmptyPlan() {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border border-dashed bg-surface p-6 text-center">
      <h2 className="text-h3 text-text-primary">No tienes secciones asignadas todavía</h2>
      <p className="text-body-sm text-text-secondary">
        Tu plan para este curso está vacío. Posibles razones: el administrador no ha terminado de
        configurarlo, o tu ficha ya cumple todas las skills del curso. Si crees que es un error,
        contacta al administrador.
      </p>
      <div className="mt-2 flex justify-center">
        <Button variant="secondary" onClick={() => navigate(RUTAS.bandeja)}>
          Volver a la Bandeja
        </Button>
      </div>
    </div>
  )
}
