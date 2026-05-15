import { useAutoInscribirseEnCurso } from "@/features/asignaciones/hooks/use-mutaciones-asignacion"
import { ApiError } from "@/shared/api/api-error"
import { Button } from "@/shared/components/ui/button"
import { Dialog, DialogFooter } from "@/shared/components/ui/dialog"
import { RUTAS } from "@/shared/constants/rutas"
import { cn } from "@/shared/lib/cn"
import type { OrigenVoluntario } from "@nexott-learn/shared-types"
import { Sparkles } from "lucide-react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

interface FooterPreviewInscripcionProps {
  readonly cursoId: string
  readonly cursoTitulo: string
  readonly areaCodigo: string | null
}

const OPCIONES: ReadonlyArray<{
  readonly valor: OrigenVoluntario
  readonly titulo: string
  readonly detalle: string
}> = [
  {
    valor: "INICIATIVA",
    titulo: "Por iniciativa propia",
    detalle: "Quiero aprender el contenido del curso desde cero.",
  },
  {
    valor: "REUTILIZACION",
    titulo: "Ya tengo experiencia",
    detalle: "He hecho un curso equivalente antes y quiero replicarlo para sumar a mi ficha.",
  },
]

/**
 * Footer sticky del modo `preview`. Una barra fina con CTA "Inscribirme como
 * voluntario" + microcopy aclarando que la inscripcion no compromete (puedes
 * retirarte despues, no cuenta para el reporte al cliente). El CTA abre un
 * `Dialog` con dos opciones radio que mapean al `origenVoluntario` del POST
 * de auto-inscripcion (D8.2).
 *
 * Tras el exito: invalida bandeja/mis-cursos/catalogo via la mutacion, toast
 * + navegacion al mismo curso (que ya pasara a modo `voluntario` porque ya
 * tiene asignacion).
 */
export function FooterPreviewInscripcion({
  cursoId,
  cursoTitulo,
  areaCodigo,
}: FooterPreviewInscripcionProps) {
  const navigate = useNavigate()
  const [abierto, setAbierto] = useState(false)
  const [origen, setOrigen] = useState<OrigenVoluntario>("INICIATIVA")
  const mut = useAutoInscribirseEnCurso()

  const confirmar = async () => {
    try {
      await mut.mutateAsync({ cursoId, input: { origenVoluntario: origen } })
      toast.success(`Te inscribiste en «${cursoTitulo}»`)
      setAbierto(false)
      // Misma URL: el hook recargara y el modo pasara a "voluntario".
      navigate(RUTAS.participante.cursoDetalle(cursoId))
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        toast.error("Ya estás inscrito en este curso.")
      } else if (err instanceof ApiError && err.status === 403) {
        toast.error("Este curso ya no admite voluntarios.")
      } else {
        toast.error("No se pudo completar la inscripción. Intenta de nuevo.")
      }
    }
  }

  return (
    <>
      <div
        className="border-border border-t bg-surface/95 backdrop-blur"
        style={{ boxShadow: "var(--shadow-card-resting)" }}
      >
        <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-6 px-6 py-3">
          <p className="text-body-sm text-text-secondary">
            <span className="font-semibold text-text-primary">Vista previa.</span> Estás explorando
            el curso. Inscríbete como voluntario para responder y guardar tu progreso.
          </p>
          <Button
            variant="primary"
            size="md"
            onClick={() => setAbierto(true)}
            className={cn(areaCodigo ? "shrink-0" : "shrink-0")}
          >
            <Sparkles className="mr-1 h-4 w-4" aria-hidden={true} />
            Inscribirme como voluntario
          </Button>
        </div>
      </div>

      <Dialog
        abierto={abierto}
        onCambiarAbierto={setAbierto}
        titulo="¿Cómo llegaste a este curso?"
        descripcion="Tu respuesta nos ayuda a entender el viaje del colaborador. No afecta tu inscripción."
      >
        <fieldset className="flex flex-col gap-2">
          <legend className="sr-only">Origen de la inscripción</legend>
          {OPCIONES.map((opcion) => {
            const seleccionada = origen === opcion.valor
            return (
              <label
                key={opcion.valor}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors duration-base ease-default",
                  seleccionada
                    ? "border-accent bg-accent-soft"
                    : "border-border bg-surface hover:border-border-emphasis",
                )}
              >
                <input
                  type="radio"
                  name="origen-voluntario"
                  value={opcion.valor}
                  checked={seleccionada}
                  onChange={() => setOrigen(opcion.valor)}
                  className="mt-1 h-4 w-4 shrink-0 accent-accent"
                />
                <span className="flex flex-col gap-0.5">
                  <span
                    className={cn(
                      "font-semibold text-body-sm",
                      seleccionada ? "text-accent-on-soft" : "text-text-primary",
                    )}
                  >
                    {opcion.titulo}
                  </span>
                  <span className="text-body-sm text-text-secondary">{opcion.detalle}</span>
                </span>
              </label>
            )
          })}
        </fieldset>

        <DialogFooter>
          <Button variant="secondary" size="sm" type="button" onClick={() => setAbierto(false)}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="button"
            onClick={() => {
              confirmar()
            }}
            isLoading={mut.isPending}
          >
            Inscribirme
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  )
}
