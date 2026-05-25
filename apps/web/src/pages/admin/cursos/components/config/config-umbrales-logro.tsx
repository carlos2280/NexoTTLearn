import { useActualizarUmbralesLogroCurso } from "@/features/cursos/hooks/use-mutaciones-config-curso"
import { Switch } from "@/shared/components/ui/switch"
import type { CursoConfiguracionResponse, CursoDetalle } from "@nexott-learn/shared-types"
import { useEffect, useState } from "react"
import { AYUDAS_CONFIG_CURSO } from "./ayudas"
import { CampoNumero } from "./campo-numero"
import { ConfigCard } from "./config-card"

interface ConfigUmbralesLogroProps {
  readonly curso: CursoDetalle & Partial<Pick<CursoConfiguracionResponse, "umbralesLogro">>
  readonly bloqueado: boolean
}

interface FormUmbrales {
  excelencia: number
  solido: number
  enDesarrollo: number
}

const DEFAULTS: FormUmbrales = { excelencia: 90, solido: 70, enDesarrollo: 50 }

function desdeCurso(curso: CursoConfiguracionResponse | CursoDetalle): {
  form: FormUmbrales
  usaDefault: boolean
} {
  const valores = (curso as CursoConfiguracionResponse).umbralesLogro
  if (!valores) {
    return { form: DEFAULTS, usaDefault: true }
  }
  return {
    form: {
      excelencia: valores.excelencia,
      solido: valores.solido,
      enDesarrollo: valores.enDesarrollo,
    },
    usaDefault: false,
  }
}

export function ConfigUmbralesLogro({ curso, bloqueado }: ConfigUmbralesLogroProps) {
  const mutacion = useActualizarUmbralesLogroCurso()
  const inicial = desdeCurso(curso)
  const [form, setForm] = useState<FormUmbrales>(inicial.form)
  const [usaDefault, setUsaDefault] = useState<boolean>(inicial.usaDefault)
  const [solicitudGuardar, setSolicitudGuardar] = useState(0)

  useEffect(() => {
    const calc = desdeCurso(curso)
    setForm(calc.form)
    setUsaDefault(calc.usaDefault)
  }, [curso])

  const monotonia = form.excelencia >= form.solido && form.solido >= form.enDesarrollo
  const modificado =
    usaDefault !== inicial.usaDefault ||
    form.excelencia !== inicial.form.excelencia ||
    form.solido !== inicial.form.solido ||
    form.enDesarrollo !== inicial.form.enDesarrollo

  async function guardar(motivo: string | undefined) {
    await mutacion.mutateAsync({
      cursoId: curso.id,
      input: { umbralesLogro: usaDefault ? null : form },
      motivo,
    })
  }

  return (
    <ConfigCard
      id="config-umbrales"
      titulo="Umbrales de logro"
      descripcion="Cortes excelencia ≥ sólido ≥ en-desarrollo. Vacío usa los defaults del sistema."
      ayuda={AYUDAS_CONFIG_CURSO.umbrales}
      exigeMotivo={curso.estado !== "BORRADOR"}
      modificado={modificado && (usaDefault || monotonia)}
      enviando={mutacion.isPending}
      deshabilitado={bloqueado}
      onGuardar={guardar}
      onCancelar={() => {
        const init = desdeCurso(curso)
        setForm(init.form)
        setUsaDefault(init.usaDefault)
      }}
      solicitudGuardar={solicitudGuardar}
    >
      <Switch
        checked={!usaDefault}
        onCambio={(v) => {
          setUsaDefault(!v)
          setSolicitudGuardar((s) => s + 1)
        }}
        label="Sobrescribir defaults"
        descripcion="Si está desactivado, se usan los cortes del sistema (90 / 70 / 50)."
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <CampoNumero
          label="Excelencia (%)"
          valor={form.excelencia}
          onCambio={(v) => setForm((f) => ({ ...f, excelencia: v }))}
          disabled={usaDefault}
        />
        <CampoNumero
          label="Sólido (%)"
          valor={form.solido}
          onCambio={(v) => setForm((f) => ({ ...f, solido: v }))}
          disabled={usaDefault}
        />
        <CampoNumero
          label="En desarrollo (%)"
          valor={form.enDesarrollo}
          onCambio={(v) => setForm((f) => ({ ...f, enDesarrollo: v }))}
          disabled={usaDefault}
        />
      </div>
      {usaDefault || monotonia ? null : (
        <p className="text-caption text-danger-on-soft">
          Debe cumplirse: excelencia ≥ sólido ≥ en desarrollo.
        </p>
      )}
    </ConfigCard>
  )
}
