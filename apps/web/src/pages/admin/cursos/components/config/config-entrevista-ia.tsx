import { useActualizarEntrevistaIaCurso } from "@/features/cursos/hooks/use-mutaciones-config-curso"
import { Switch } from "@/shared/components/ui/switch"
import type { CursoDetalle } from "@nexott-learn/shared-types"
import { useEffect, useState } from "react"
import { AYUDAS_CONFIG_CURSO } from "./ayudas"
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
  const [solicitudGuardar, setSolicitudGuardar] = useState(0)

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
      id="config-entrevista"
      titulo="Entrevista IA"
      descripcion="Configura la entrevista con IA: filosofía, profundidad, duración y tono."
      ayuda={AYUDAS_CONFIG_CURSO.entrevista}
      exigeMotivo={curso.estado !== "BORRADOR"}
      modificado={modificado}
      enviando={mutacion.isPending}
      deshabilitado={bloqueado}
      onGuardar={guardar}
      onCancelar={() => setForm({ ...INICIAL, activo: curso.entrevistaIaId !== null })}
      solicitudGuardar={solicitudGuardar}
    >
      <Switch
        checked={form.activo}
        onCambio={(v) => {
          setForm((f) => ({ ...f, activo: v }))
          setSolicitudGuardar((s) => s + 1)
        }}
        label="Activar entrevista IA"
        descripcion="Conversación final donde la IA evalúa al colaborador sobre lo aprendido."
      />
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
