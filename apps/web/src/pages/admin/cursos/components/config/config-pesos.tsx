import { useActualizarPesosCurso } from "@/features/cursos/hooks/use-mutaciones-config-curso"
import type { CursoDetalle } from "@nexott-learn/shared-types"
import { useEffect, useState } from "react"
import { AYUDAS_CONFIG_CURSO } from "./ayudas"
import { BarraSumaSegmentos } from "./barra-suma-segmentos"
import { CampoNumero } from "./campo-numero"
import { ConfigCard } from "./config-card"

interface ConfigPesosProps {
  readonly curso: CursoDetalle
  readonly bloqueado: boolean
}

interface FormPesos {
  bloques: number
  transversal: number
  entrevista: number
  umbralNoCumple: number
}

function desdeCurso(curso: CursoDetalle): FormPesos {
  return {
    bloques: curso.pesoBloques,
    transversal: curso.pesoTransversal,
    entrevista: curso.pesoEntrevista,
    umbralNoCumple: curso.umbralNoCumple,
  }
}

export function ConfigPesos({ curso, bloqueado }: ConfigPesosProps) {
  const mutacion = useActualizarPesosCurso()
  const [form, setForm] = useState<FormPesos>(desdeCurso(curso))

  useEffect(() => {
    setForm(desdeCurso(curso))
  }, [curso])

  const inicial = desdeCurso(curso)
  const modificado =
    form.bloques !== inicial.bloques ||
    form.transversal !== inicial.transversal ||
    form.entrevista !== inicial.entrevista ||
    form.umbralNoCumple !== inicial.umbralNoCumple

  const suma = form.bloques + form.transversal + form.entrevista
  const sumaValida = Math.round(suma * 100) === 10000

  async function guardar(motivo: string | undefined) {
    await mutacion.mutateAsync({
      cursoId: curso.id,
      input: {
        pesoBloques: form.bloques,
        pesoTransversal: form.transversal,
        pesoEntrevista: form.entrevista,
        umbralNoCumple: form.umbralNoCumple,
      },
      motivo,
    })
  }

  return (
    <ConfigCard
      id="config-pesos"
      titulo="Pesos del curso"
      descripcion="Distribuye 100% entre bloques, transversal y entrevista. Umbral No-cumple en [0, 100]."
      ayuda={AYUDAS_CONFIG_CURSO.pesos}
      exigeMotivo={curso.estado !== "BORRADOR"}
      modificado={modificado && sumaValida}
      enviando={mutacion.isPending}
      deshabilitado={bloqueado}
      mensajeDeshabilitado={bloqueado ? "Sólo editable en BORRADOR o ACTIVO." : undefined}
      onGuardar={guardar}
      onCancelar={() => setForm(desdeCurso(curso))}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <CampoNumero
          label="Peso bloques (%)"
          valor={form.bloques}
          onCambio={(v) => setForm((f) => ({ ...f, bloques: v }))}
        />
        <CampoNumero
          label="Peso transversal (%)"
          valor={form.transversal}
          onCambio={(v) => setForm((f) => ({ ...f, transversal: v }))}
        />
        <CampoNumero
          label="Peso entrevista (%)"
          valor={form.entrevista}
          onCambio={(v) => setForm((f) => ({ ...f, entrevista: v }))}
        />
      </div>
      <BarraSumaSegmentos
        tramos={[
          { id: "bloques", valor: form.bloques, etiqueta: "Bloques" },
          { id: "transversal", valor: form.transversal, etiqueta: "Transversal" },
          { id: "entrevista", valor: form.entrevista, etiqueta: "Entrevista" },
        ]}
      />
      <CampoNumero
        label="Umbral No-cumple (%)"
        valor={form.umbralNoCumple}
        onCambio={(v) => setForm((f) => ({ ...f, umbralNoCumple: v }))}
      />
    </ConfigCard>
  )
}
