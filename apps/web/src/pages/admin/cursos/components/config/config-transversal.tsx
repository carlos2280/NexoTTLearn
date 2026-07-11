import { Banner } from "@/shared/components/ui/banner"
import { Switch } from "@/shared/components/ui/switch"
import type { CursoDetalle } from "@nexott-learn/shared-types"
import { useState } from "react"
import { AYUDAS_CONFIG_CURSO } from "./ayudas"
import { CampoNumero } from "./campo-numero"
import { ConfigCard } from "./config-card"
import { EditorBriefTransversal } from "./editor-brief-transversal"
import { EvaluacionIaInfo } from "./evaluacion-ia-info"
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
      descripcion="Activa el proyecto transversal y redacta sus instrucciones. La entrega la revisa la IA sobre el repositorio del participante."
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
        id="transversal-activo"
        checked={form.activo}
        onCambio={(v) => {
          setForm((f) => ({ ...f, activo: v }))
          if (!v) {
            setSolicitudGuardar((s) => s + 1)
          }
        }}
        label="Activar proyecto transversal"
        descripcion="La IA revisa el repositorio entregado y le pone una nota."
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
            <EvaluacionIaInfo />
            {valido ? null : (
              <p className="text-caption text-warning">
                Para guardar: redacta las instrucciones del proyecto.
              </p>
            )}
          </>
        )
      ) : null}
    </ConfigCard>
  )
}
