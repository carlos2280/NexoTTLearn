import { useActualizarEntrevistaIaCurso } from "@/features/cursos/hooks/use-mutaciones-config-curso"
import type { CursoDetalle } from "@nexott-learn/shared-types"
import { MessageSquare } from "lucide-react"
import { useEffect, useState } from "react"
import { CampoNumero } from "./campo-numero"
import { ConfigCard } from "./config-card"
import { ConfigEntrevistaCampos, type EntrevistaParametros } from "./config-entrevista-campos"

interface ConfigEntrevistaIaProps {
  readonly curso: CursoDetalle
  readonly bloqueado: boolean
}

interface FormEntrevista extends EntrevistaParametros {
  activo: boolean
  umbralAprobacion: number
}

const INICIAL: FormEntrevista = {
  activo: false,
  umbralAprobacion: 70,
  filosofia: "PREPARACION",
  profundidad: "SEMI_SENIOR",
  duracionMinutos: 30,
  tono: "CONVERSACIONAL",
}

export function ConfigEntrevistaIa({ curso, bloqueado }: ConfigEntrevistaIaProps) {
  const mutacion = useActualizarEntrevistaIaCurso()
  const inicialPorCurso: FormEntrevista = {
    ...INICIAL,
    activo: curso.entrevistaIaId !== null,
  }
  const [form, setForm] = useState<FormEntrevista>(inicialPorCurso)

  useEffect(() => {
    setForm({ ...INICIAL, activo: curso.entrevistaIaId !== null })
  }, [curso.entrevistaIaId])

  const modificado =
    form.activo !== inicialPorCurso.activo ||
    (form.activo &&
      (form.umbralAprobacion !== INICIAL.umbralAprobacion ||
        form.filosofia !== INICIAL.filosofia ||
        form.profundidad !== INICIAL.profundidad ||
        form.duracionMinutos !== INICIAL.duracionMinutos ||
        form.tono !== INICIAL.tono))

  async function guardar(motivo: string | undefined) {
    const input = form.activo
      ? {
          activo: true,
          umbralAprobacion: form.umbralAprobacion,
          filosofia: form.filosofia,
          profundidad: form.profundidad,
          duracionMinutos: form.duracionMinutos,
          tono: form.tono,
        }
      : { activo: false }
    await mutacion.mutateAsync({ cursoId: curso.id, input, motivo })
  }

  return (
    <ConfigCard
      titulo="Entrevista IA"
      descripcion="Configura la entrevista con IA: filosofía, profundidad, duración y tono."
      icono={MessageSquare}
      exigeMotivo={curso.estado !== "BORRADOR"}
      modificado={modificado}
      enviando={mutacion.isPending}
      deshabilitado={bloqueado}
      onGuardar={guardar}
    >
      <label className="inline-flex items-center gap-2 text-body-sm">
        <input
          type="checkbox"
          checked={form.activo}
          onChange={(e) => setForm((f) => ({ ...f, activo: e.target.checked }))}
          className="h-4 w-4 rounded border-border-strong"
        />
        Activar entrevista IA
      </label>
      {form.activo ? (
        <>
          <CampoNumero
            label="Umbral aprobación (%)"
            valor={form.umbralAprobacion}
            onCambio={(v) => setForm((f) => ({ ...f, umbralAprobacion: v }))}
          />
          <ConfigEntrevistaCampos
            valores={{
              filosofia: form.filosofia,
              profundidad: form.profundidad,
              duracionMinutos: form.duracionMinutos,
              tono: form.tono,
            }}
            onCambio={(v) => setForm((f) => ({ ...f, ...v }))}
          />
        </>
      ) : null}
    </ConfigCard>
  )
}
