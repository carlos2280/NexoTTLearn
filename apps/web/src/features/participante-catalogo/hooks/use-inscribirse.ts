import { PARTICIPANTE_MIS_CURSOS_KEY } from "@/features/participante-mis-cursos/hooks/use-mis-cursos"
import { ApiError } from "@/shared/api/api-error"
import type { CatalogoInscribirmeResponse } from "@nexott-learn/shared-types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { inscribirseEnCurso } from "../api/inscribirse.api"
import { PARTICIPANTE_CATALOGO_KEY } from "./use-vitrina"

interface UseInscribirseOptions {
  /** Si false no redirige tras exito (test/uso programatico). Default true. */
  readonly redirigir?: boolean
}

// POST /participante/catalogo/:slug/inscribirme
// - 201 -> toast "Inscrito en X" + invalida mis-cursos/catalogo + redirige a /cursos/:slug.
// - 409 YA_INSCRITO -> redirige a /cursos/:slug sin toast de exito (ya estaba inscrito).
// - otros errores -> toast.error con mensaje del back.
export function useInscribirse(options: UseInscribirseOptions = {}) {
  const redirigir = options.redirigir ?? true
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation<CatalogoInscribirmeResponse, Error, string>({
    mutationFn: (slug) => inscribirseEnCurso(slug),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: PARTICIPANTE_MIS_CURSOS_KEY })
      queryClient.invalidateQueries({ queryKey: PARTICIPANTE_CATALOGO_KEY })
      toast.success(data.mensaje)
      if (redirigir) {
        navigate(data.vistaCursoHref)
      }
    },
    onError: (error, slug) => {
      if (error instanceof ApiError && error.status === 409) {
        // Ya esta inscrito: tratamos como exito silencioso, redirigimos a la vista del curso.
        queryClient.invalidateQueries({ queryKey: PARTICIPANTE_MIS_CURSOS_KEY })
        queryClient.invalidateQueries({ queryKey: PARTICIPANTE_CATALOGO_KEY })
        if (redirigir) {
          navigate(`/cursos/${slug}`)
        }
        return
      }
      toast.error(error.message ?? "No se pudo inscribir en el curso")
    },
  })
}
