import { useListarSkills } from "@/features/catalogo/hooks/use-listar-skills"
import { usePatchBloque } from "@/features/catalogo/hooks/use-mutaciones-bloques"
import { Button } from "@/shared/components/ui/button"
import { ConfirmMotivoDialog } from "@/shared/components/ui/confirm-motivo-dialog"
import { Select, SelectItem } from "@/shared/components/ui/select"
import type { BloqueDetalleResponse } from "@nexott-learn/shared-types"
import { ShieldAlert } from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"

interface EditarEvaluacionBloqueProps {
  readonly bloque: BloqueDetalleResponse
}

/**
 * Control de evaluación del bloque dentro del panel propiedades.
 *
 * Toggle "Bloque evaluable" + select de skill que mide. Cambiar cualquiera
 * dispara la clasificación CAMBIA_EVALUACION (P-17): pide motivo, incrementa
 * `version` e invalida intentos previos en back.
 */
export function EditarEvaluacionBloque({ bloque }: EditarEvaluacionBloqueProps) {
  const skillsQuery = useListarSkills({ page: 1, pageSize: 100 })
  const patch = usePatchBloque()
  const [esEvaluable, setEsEvaluable] = useState(bloque.esEvaluable)
  const [skillId, setSkillId] = useState<string>(bloque.skillQueMideId ?? "")
  const [confirmar, setConfirmar] = useState(false)

  const skills = useMemo(
    () => (skillsQuery.data?.data ?? []).filter((s) => s.estado === "ACTIVA"),
    [skillsQuery.data],
  )

  const tieneCambios =
    esEvaluable !== bloque.esEvaluable ||
    (esEvaluable ? skillId !== (bloque.skillQueMideId ?? "") : false)

  const invariante = esEvaluable ? skillId.length > 0 : true

  async function guardarConMotivo(motivo: string) {
    if (!(tieneCambios && invariante)) {
      return
    }
    try {
      await patch.mutateAsync({
        bloqueId: bloque.id,
        input: {
          tipoEdicion: "CAMBIA_EVALUACION",
          contenido: (bloque.contenido ?? {}) as Record<string, unknown>,
          esEvaluable,
          skillQueMideId: esEvaluable ? skillId : null,
        },
        motivo,
      })
      toast.success("Evaluación actualizada · versión incrementada")
      setConfirmar(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo actualizar la evaluación")
    }
  }

  return (
    <div className="flex flex-col gap-3 border-border border-t py-3">
      <span className="text-caption text-text-tertiary">Evaluación</span>

      <label className="inline-flex items-center gap-2 text-body-sm text-text-secondary">
        <input
          type="checkbox"
          checked={esEvaluable}
          onChange={(e) => {
            const v = e.target.checked
            setEsEvaluable(v)
            if (!v) {
              setSkillId("")
            }
          }}
          className="h-4 w-4 rounded border-border-strong text-accent focus:ring-accent"
        />
        Bloque evaluable
      </label>

      {esEvaluable ? (
        <div className="flex flex-col gap-1">
          <span className="text-caption text-text-tertiary">Skill que mide</span>
          <Select
            value={skillId === "" ? undefined : skillId}
            onValueChange={setSkillId}
            placeholder="— Selecciona una skill —"
          >
            {skills.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.etiquetaVisible}
              </SelectItem>
            ))}
          </Select>
        </div>
      ) : null}

      {tieneCambios ? (
        <div className="flex flex-col gap-2 rounded-md border border-warning border-l-4 border-l-warning bg-warning-soft px-3 py-2 text-caption text-warning-on-soft">
          <span className="inline-flex items-center gap-1.5 font-medium">
            <ShieldAlert className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden={true} />
            Cambio de evaluación
          </span>
          <span>
            Incrementa la versión del bloque e invalida los intentos previos. Requiere motivo
            registrado en el log.
          </span>
          <Button
            variant="primary"
            size="sm"
            disabled={!invariante || patch.isPending}
            onClick={() => setConfirmar(true)}
          >
            Aplicar con motivo
          </Button>
        </div>
      ) : null}

      <ConfirmMotivoDialog
        abierto={confirmar}
        onCambiarAbierto={(a) => (a ? null : setConfirmar(false))}
        titulo="Confirmar cambio de evaluación"
        descripcion={
          esEvaluable
            ? "El bloque pasará a ser evaluable. Los participantes con intentos previos verán una versión nueva."
            : "El bloque dejará de ser evaluable. Los intentos previos quedan en el histórico pero no contarán."
        }
        textoConfirmar="Aplicar cambio"
        variante="danger"
        enviando={patch.isPending}
        onConfirmar={guardarConMotivo}
      />
    </div>
  )
}
