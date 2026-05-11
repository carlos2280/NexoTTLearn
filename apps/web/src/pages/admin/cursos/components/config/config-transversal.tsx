import { useActualizarTransversalCurso } from "@/features/cursos/hooks/use-mutaciones-config-curso"
import type { CursoDetalle } from "@nexott-learn/shared-types"
import { Hammer } from "lucide-react"
import { useEffect, useState } from "react"
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
      titulo="Proyecto transversal"
      descripcion="Activa el proyecto transversal y reparte 100% entre capas (tests / cualitativa / comprensión)."
      icono={Hammer}
      exigeMotivo={curso.estado !== "BORRADOR"}
      modificado={modificado && sumaValida}
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
        Activar proyecto transversal
      </label>
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
          <p
            className={
              sumaValida ? "text-caption text-text-tertiary" : "text-caption text-danger-on-soft"
            }
          >
            Suma capas: {sumaCapas.toFixed(2)}% {sumaValida ? "✓" : "(debe ser 100)"}
          </p>
        </>
      ) : null}
    </ConfigCard>
  )
}
