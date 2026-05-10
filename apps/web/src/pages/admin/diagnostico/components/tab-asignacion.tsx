import { useConfirmarLoteAsignaciones } from "@/features/admin-diagnostico/hooks/use-asignaciones"
import { Button } from "@/shared/ui/primitives/button"
import type { MatrizAsignacionesResponse } from "@nexott-learn/shared-types"
import { Sparkles } from "lucide-react"
import { useState } from "react"
import { construirItemsLote, construirResumen } from "../lib/asignacion-lote"
import { useBorradorAsignaciones } from "../lib/use-borrador-asignaciones"
import { ModalConfirmarAsignacion } from "./modal-confirmar-asignacion"
import { TarjetaCandidatoAsignacion } from "./tarjeta-candidato-asignacion"

interface Props {
  readonly cursoId: string | undefined
  readonly data: MatrizAsignacionesResponse | undefined
  readonly cargando: boolean
}

export function TabAsignacion({ cursoId, data, cargando }: Props) {
  const candidatos = data?.candidatos ?? []
  const modulos = data?.modulos ?? []
  const borrador = useBorradorAsignaciones({ candidatos })
  const confirmarLote = useConfirmarLoteAsignaciones()
  const [modalAbierto, setModalAbierto] = useState(false)

  const resumen = construirResumen({ candidatos, borrador: borrador.borrador })

  const onConfirmar = async () => {
    if (!cursoId) {
      return
    }
    const items = construirItemsLote(borrador.borrador)
    if (items.length === 0) {
      setModalAbierto(false)
      return
    }
    await confirmarLote.mutateAsync({ cursoId, input: { items } })
    setModalAbierto(false)
    borrador.limpiar()
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-0.5">
          <h2 className="font-semibold text-base text-text-primary">
            Asignar módulos según brecha y expediente
          </h2>
          <p className="text-text-muted text-xs">
            {resumen.conAsignacion} con asignación · {resumen.sinAsignacion} sin asignación ·{" "}
            {resumen.sinEvaluacion} sin evaluación.
          </p>
        </div>
        <Button
          onClick={() => setModalAbierto(true)}
          disabled={cargando || candidatos.length === 0}
        >
          <Sparkles className="size-4" aria-hidden="true" />
          Confirmar asignación
        </Button>
      </header>

      {resumen.sinEvaluacion > 0 ? (
        <div className="rounded-[var(--radius-md)] border border-[rgb(245_158_11/0.3)] bg-[var(--warning-bg)] px-4 py-3 text-sm text-warning">
          {resumen.sinEvaluacion} candidato{resumen.sinEvaluacion === 1 ? "" : "s"} sin evaluación
          inicial. La asignación se basará solo en tu criterio y el expediente histórico.
        </div>
      ) : null}

      {cargando && candidatos.length === 0 ? (
        <p className="text-sm text-text-muted">Cargando asignaciones…</p>
      ) : null}

      {!cargando && candidatos.length === 0 ? (
        <p className="text-sm text-text-muted">
          No hay candidatos invitados todavía. Empieza por el tab Invitados.
        </p>
      ) : null}

      <ul className="grid gap-3 lg:grid-cols-2">
        {candidatos.map((c) => (
          <li key={c.inscripcionId}>
            <TarjetaCandidatoAsignacion
              candidato={c}
              modulos={modulos}
              tiposPorModulo={borrador.borrador.get(c.inscripcionId) ?? new Map()}
              onCambiarTipo={(moduloId, tipo) => borrador.setTipo(c.inscripcionId, moduloId, tipo)}
              onQuitar={(moduloId) => borrador.quitar(c.inscripcionId, moduloId)}
            />
          </li>
        ))}
      </ul>

      <ModalConfirmarAsignacion
        open={modalAbierto}
        resumen={resumen}
        enviando={confirmarLote.isPending}
        onCancelar={() => setModalAbierto(false)}
        onConfirmar={onConfirmar}
      />
    </div>
  )
}
