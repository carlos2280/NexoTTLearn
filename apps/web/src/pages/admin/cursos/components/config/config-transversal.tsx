import { Banner } from "@/shared/components/ui/banner"
import { Switch } from "@/shared/components/ui/switch"
import type { CursoDetalle } from "@nexott-learn/shared-types"
import { useState } from "react"
import { AYUDAS_CONFIG_CURSO } from "./ayudas"
import { BarraSumaSegmentos } from "./barra-suma-segmentos"
import { CampoNumero } from "./campo-numero"
import { ConfigCard } from "./config-card"
import { EditorBriefTransversal } from "./editor-brief-transversal"
import { SelectorSkillsTransversal } from "./selector-skills-transversal"
import { useFormTransversal } from "./use-form-transversal"

interface ConfigTransversalProps {
  readonly curso: CursoDetalle
  readonly bloqueado: boolean
}

export function ConfigTransversal({ curso, bloqueado }: ConfigTransversalProps) {
  const {
    form,
    setForm,
    cargandoBrief,
    errorBrief,
    valido,
    modificado,
    enviando,
    guardar,
    reintentar,
    resetear,
  } = useFormTransversal(curso)
  const [solicitudGuardar, setSolicitudGuardar] = useState(0)

  return (
    <ConfigCard
      id="config-transversal"
      titulo="Proyecto transversal"
      descripcion="Activa el proyecto transversal, redacta sus instrucciones y reparte 100% entre capas (tests / cualitativa / comprensión)."
      ayuda={AYUDAS_CONFIG_CURSO.transversal}
      exigeMotivo={curso.estado !== "BORRADOR"}
      modificado={modificado}
      enviando={enviando}
      deshabilitado={bloqueado}
      onGuardar={guardar}
      onCancelar={resetear}
      solicitudGuardar={solicitudGuardar}
    >
      <Switch
        checked={form.activo}
        onCambio={(v) => {
          setForm((f) => ({ ...f, activo: v }))
          if (!v) {
            setSolicitudGuardar((s) => s + 1)
          }
        }}
        label="Activar proyecto transversal"
        descripcion="Se evalúa en 3 capas: tests automáticos, análisis cualitativo y comprensión."
      />
      {form.activo && errorBrief ? (
        <Banner tone="danger" title="No pudimos cargar la configuración del transversal">
          Este curso ya tiene un proyecto transversal, pero no se pudo leer. No edites hasta verlo
          para no sobrescribir el brief o las skills actuales.{" "}
          <button type="button" onClick={reintentar} className="font-medium underline">
            Reintentar
          </button>
        </Banner>
      ) : null}
      {form.activo && !errorBrief ? (
        cargandoBrief ? (
          <p className="text-body-sm text-text-tertiary">Cargando configuración del transversal…</p>
        ) : (
          <>
            <EditorBriefTransversal
              html={form.descripcion}
              onCambio={(html) => setForm((f) => ({ ...f, descripcion: html }))}
            />
            <SelectorSkillsTransversal
              skillsIds={form.skillsQueMideIds}
              onCambio={(ids) => setForm((f) => ({ ...f, skillsQueMideIds: ids }))}
            />
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
            {valido ? null : (
              <p className="text-caption text-warning">
                Para guardar: redacta las instrucciones y asegúrate de que los pesos sumen 100%.
              </p>
            )}
          </>
        )
      ) : null}
    </ConfigCard>
  )
}
