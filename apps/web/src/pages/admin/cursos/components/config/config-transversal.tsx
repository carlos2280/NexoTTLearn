import { useActualizarTransversalCurso } from "@/features/cursos/hooks/use-mutaciones-config-curso"
import { Switch } from "@/shared/components/ui/switch"
import type { CursoDetalle } from "@nexott-learn/shared-types"
import { useEffect, useState } from "react"
import { AYUDAS_CONFIG_CURSO } from "./ayudas"
import { BarraSumaSegmentos } from "./barra-suma-segmentos"
import { CampoNumero } from "./campo-numero"
import { ConfigCard } from "./config-card"

interface ConfigTransversalProps {
  readonly curso: CursoDetalle
  readonly bloqueado: boolean
}

interface FormTransversal {
  activo: boolean
  umbralAprobacion: number
  pesoCapaTests: number
  pesoCapaCualitativa: number
  pesoCapaComprension: number
  capaTestsActiva: boolean
  capaCualitativaActiva: boolean
  capaComprensionActiva: boolean
}

const INICIAL: FormTransversal = {
  activo: false,
  umbralAprobacion: 70,
  pesoCapaTests: 40,
  pesoCapaCualitativa: 40,
  pesoCapaComprension: 20,
  capaTestsActiva: true,
  capaCualitativaActiva: true,
  capaComprensionActiva: true,
}

export function ConfigTransversal({ curso, bloqueado }: ConfigTransversalProps) {
  const mutacion = useActualizarTransversalCurso()
  const inicialPorCurso: FormTransversal = { ...INICIAL, activo: curso.transversalId !== null }
  const [form, setForm] = useState<FormTransversal>(inicialPorCurso)
  const [solicitudGuardar, setSolicitudGuardar] = useState(0)

  useEffect(() => {
    setForm({ ...INICIAL, activo: curso.transversalId !== null })
  }, [curso.transversalId])

  const sumaCapas = form.pesoCapaTests + form.pesoCapaCualitativa + form.pesoCapaComprension
  const sumaValida = !form.activo || Math.round(sumaCapas * 100) === 10000
  const modificado =
    form.activo !== inicialPorCurso.activo ||
    (form.activo &&
      (form.umbralAprobacion !== INICIAL.umbralAprobacion ||
        form.pesoCapaTests !== INICIAL.pesoCapaTests ||
        form.pesoCapaCualitativa !== INICIAL.pesoCapaCualitativa ||
        form.pesoCapaComprension !== INICIAL.pesoCapaComprension ||
        form.capaTestsActiva !== INICIAL.capaTestsActiva ||
        form.capaCualitativaActiva !== INICIAL.capaCualitativaActiva ||
        form.capaComprensionActiva !== INICIAL.capaComprensionActiva))

  async function guardar(motivo: string | undefined) {
    const input = form.activo
      ? {
          activo: true,
          umbralAprobacion: form.umbralAprobacion,
          pesoCapaTests: form.pesoCapaTests,
          pesoCapaCualitativa: form.pesoCapaCualitativa,
          pesoCapaComprension: form.pesoCapaComprension,
          capaTestsActiva: form.capaTestsActiva,
          capaCualitativaActiva: form.capaCualitativaActiva,
          capaComprensionActiva: form.capaComprensionActiva,
        }
      : { activo: false }
    await mutacion.mutateAsync({ cursoId: curso.id, input, motivo })
  }

  return (
    <ConfigCard
      id="config-transversal"
      titulo="Proyecto transversal"
      descripcion="Activa el proyecto transversal y reparte 100% entre capas (tests / cualitativa / comprensión)."
      ayuda={AYUDAS_CONFIG_CURSO.transversal}
      exigeMotivo={curso.estado !== "BORRADOR"}
      modificado={modificado && sumaValida}
      enviando={mutacion.isPending}
      deshabilitado={bloqueado}
      onGuardar={guardar}
      onCancelar={() => setForm({ ...INICIAL, activo: curso.transversalId !== null })}
      solicitudGuardar={solicitudGuardar}
    >
      <Switch
        checked={form.activo}
        onCambio={(v) => {
          setForm((f) => ({ ...f, activo: v }))
          setSolicitudGuardar((s) => s + 1)
        }}
        label="Activar proyecto transversal"
        descripcion="Se evalúa en 3 capas: tests automáticos, análisis cualitativo y comprensión."
      />
      {form.activo ? (
        <>
          <CampoNumero
            label="Umbral aprobación (%)"
            valor={form.umbralAprobacion}
            onCambio={(v) => setForm((f) => ({ ...f, umbralAprobacion: v }))}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <CampoNumero
              label="Peso capa tests (%)"
              valor={form.pesoCapaTests}
              onCambio={(v) => setForm((f) => ({ ...f, pesoCapaTests: v }))}
            />
            <CampoNumero
              label="Peso cualitativa (%)"
              valor={form.pesoCapaCualitativa}
              onCambio={(v) => setForm((f) => ({ ...f, pesoCapaCualitativa: v }))}
            />
            <CampoNumero
              label="Peso comprensión (%)"
              valor={form.pesoCapaComprension}
              onCambio={(v) => setForm((f) => ({ ...f, pesoCapaComprension: v }))}
            />
          </div>
          <BarraSumaSegmentos
            tramos={[
              { id: "tests", valor: form.pesoCapaTests, etiqueta: "Tests" },
              { id: "cualitativa", valor: form.pesoCapaCualitativa, etiqueta: "Cualitativa" },
              { id: "comprension", valor: form.pesoCapaComprension, etiqueta: "Comprensión" },
            ]}
          />
        </>
      ) : null}
    </ConfigCard>
  )
}
