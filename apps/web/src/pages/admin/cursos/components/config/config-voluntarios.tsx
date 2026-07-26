import { useActualizarCurso } from "@/features/cursos/hooks/use-mutaciones-curso"
import { Switch } from "@/shared/components/ui/switch"
import type { CursoDetalle } from "@nexott-learn/shared-types"
import { useEffect, useState } from "react"
import { AYUDAS_CONFIG_CURSO } from "./ayudas"
import { ConfigCard } from "./config-card"
import { construirInputVoluntarios, descripcionVoluntarios } from "./config-voluntarios.helpers"

interface ConfigVoluntariosProps {
  readonly curso: CursoDetalle
  readonly bloqueado: boolean
}

export function ConfigVoluntarios({ curso, bloqueado }: ConfigVoluntariosProps) {
  const mutacion = useActualizarCurso()
  const [permite, setPermite] = useState(curso.toggleVoluntarios)
  const [solicitudGuardar, setSolicitudGuardar] = useState(0)

  useEffect(() => {
    setPermite(curso.toggleVoluntarios)
  }, [curso])

  async function guardar(motivo: string | undefined) {
    await mutacion.mutateAsync({
      id: curso.id,
      input: construirInputVoluntarios(permite),
      motivo,
    })
  }

  return (
    <ConfigCard
      id="config-voluntarios"
      titulo="Inscripción de voluntarios"
      descripcion="Controla si un colaborador puede autoinscribirse al curso desde el catálogo, sin que un admin lo asigne."
      ayuda={AYUDAS_CONFIG_CURSO.voluntarios}
      exigeMotivo={curso.estado !== "BORRADOR"}
      modificado={permite !== curso.toggleVoluntarios}
      enviando={mutacion.isPending}
      deshabilitado={bloqueado}
      mensajeDeshabilitado={bloqueado ? "Sólo editable en BORRADOR o ACTIVO." : undefined}
      onGuardar={guardar}
      onCancelar={() => setPermite(curso.toggleVoluntarios)}
      solicitudGuardar={solicitudGuardar}
    >
      <Switch
        id="voluntarios-habilitados"
        checked={permite}
        onCambio={(v) => {
          setPermite(v)
          setSolicitudGuardar((s) => s + 1)
        }}
        label="Permitir voluntarios"
        descripcion={descripcionVoluntarios(permite)}
        disabled={bloqueado || mutacion.isPending}
      />
    </ConfigCard>
  )
}
