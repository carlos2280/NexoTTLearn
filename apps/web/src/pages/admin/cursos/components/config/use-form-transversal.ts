import { useActualizarTransversalCurso } from "@/features/cursos/hooks/use-mutaciones-config-curso"
import { useTransversalCurso } from "@/features/transversal/hooks/use-transversal-curso"
import type { CursoDetalle } from "@nexott-learn/shared-types"
import { useEffect, useMemo, useState } from "react"
import {
  FORM_TRANSVERSAL_DEFECTO,
  type FormTransversal,
  baselineDesdeRespuesta,
  construirInputTransversal,
  esFormModificado,
  esFormValido,
} from "./transversal-form"

interface UseFormTransversalResult {
  readonly form: FormTransversal
  readonly setForm: (actualizar: (previo: FormTransversal) => FormTransversal) => void
  readonly cargandoBrief: boolean
  readonly errorBrief: boolean
  readonly modificado: boolean
  readonly valido: boolean
  readonly enviando: boolean
  readonly guardar: (motivo: string | undefined) => Promise<void>
  readonly reintentar: () => void
  readonly resetear: () => void
}

/**
 * Estado del formulario del proyecto transversal. Precarga el brief, pesos y
 * skills reales desde el GET admin cuando el curso ya tiene transversal; para
 * un curso sin transversal parte del baseline por defecto.
 */
export function useFormTransversal(curso: CursoDetalle): UseFormTransversalResult {
  const mutacion = useActualizarTransversalCurso()
  const consulta = useTransversalCurso(curso.transversalId ? curso.id : null)

  const baseline = useMemo<FormTransversal>(() => {
    if (!curso.transversalId) {
      return FORM_TRANSVERSAL_DEFECTO
    }
    // El curso ya tiene transversal: mostramos el switch activo aunque el GET
    // del brief aún no haya respondido (evita el parpadeo OFF → ON).
    return consulta.data
      ? baselineDesdeRespuesta(consulta.data)
      : { ...FORM_TRANSVERSAL_DEFECTO, activo: true }
  }, [curso.transversalId, consulta.data])

  const [form, setForm] = useState<FormTransversal>(baseline)

  useEffect(() => {
    setForm(baseline)
  }, [baseline])

  async function guardar(motivo: string | undefined): Promise<void> {
    await mutacion.mutateAsync({
      cursoId: curso.id,
      input: construirInputTransversal(form),
      motivo,
    })
  }

  const tieneTransversal = Boolean(curso.transversalId)
  return {
    form,
    setForm,
    cargandoBrief: tieneTransversal && consulta.isLoading,
    errorBrief: tieneTransversal && consulta.isError,
    modificado: esFormModificado(form, baseline) && esFormValido(form),
    valido: esFormValido(form),
    enviando: mutacion.isPending,
    guardar,
    reintentar: () => {
      consulta.refetch()
    },
    resetear: () => setForm(baseline),
  }
}
