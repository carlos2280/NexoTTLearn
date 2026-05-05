import { RUTAS } from "@/shared/constants/rutas"
import { toast } from "@carlos2280/nexott-ui/react"
import type { ObtenerSeccionesAdminResponse } from "@nexott-learn/shared-types"
import { useEffect } from "react"
import { useNavigate } from "react-router-dom"

interface UseSectionEditorRoutingOptions {
  readonly cursoId: string | undefined
  readonly moduloId: string | undefined
  readonly seccionId: string | undefined
  readonly seccionesData: ObtenerSeccionesAdminResponse | undefined
}

// Encapsula los dos useEffect del editor:
//  1. seccionId === "primera" -> redirige a la primera seccion real (replace).
//  2. seccionId no encontrado -> redirige al hub clasico con toast.
//
// Vivir aqui en lugar de en la pagina baja la complejidad cognitiva del
// orquestador.
export function useSectionEditorRouting({
  cursoId,
  moduloId,
  seccionId,
  seccionesData,
}: UseSectionEditorRoutingOptions): void {
  const navigate = useNavigate()

  useEffect(() => {
    if (seccionId !== "primera") {
      return
    }
    if (!(cursoId && moduloId && seccionesData)) {
      return
    }
    const primera = seccionesData.items[0]
    if (primera) {
      navigate(RUTAS.admin.cursoModuloSeccionEditor(cursoId, moduloId, primera.id), {
        replace: true,
      })
    }
  }, [cursoId, moduloId, seccionId, seccionesData, navigate])

  useEffect(() => {
    if (!(cursoId && moduloId && seccionId && seccionesData)) {
      return
    }
    if (seccionId === "primera") {
      return
    }
    const existe = seccionesData.items.some((s) => s.id === seccionId)
    if (!existe) {
      toast.error("La seccion ya no existe")
      navigate(RUTAS.admin.cursoModuloSecciones(cursoId, moduloId), { replace: true })
    }
  }, [cursoId, moduloId, seccionId, seccionesData, navigate])
}
