import { useCurarReporteFinal } from "@/features/transversal/hooks/use-curar-reporte-final"
import { Button } from "@/shared/components/ui/button"
import { Textarea } from "@/shared/components/ui/textarea"
import { cn } from "@/shared/lib/cn"
import type { IntentoTransversalAdminResponse } from "@nexott-learn/shared-types"
import { type ReactNode, useRef, useState } from "react"
import { EditorAreasReforzar, type FilaReforzar } from "./editor-areas-reforzar"
import { InformeCuradoSoloLectura } from "./informe-curado-solo-lectura"
import {
  baseParaCurar,
  construirReporteFinal,
  esCurable,
  hayFilasIncompletas,
} from "./informe-curado.helpers"

const MAX_RESUMEN = 2000

interface InformeParticipanteEditorProps {
  readonly intento: IntentoTransversalAdminResponse
}

/**
 * Editor admin del informe que verá el participante (E13 / B3): resumen + áreas
 * a reforzar. El `reporteIa` crudo (tarjeta de arriba, solo lectura) queda
 * intacto. Solo editable mientras el intento está EVALUADO; al finalizar el
 * intento se publica al alumno.
 */
export function InformeParticipanteEditor({ intento }: InformeParticipanteEditorProps) {
  const base = baseParaCurar(intento)
  const editable = esCurable(intento.estado)
  const mutation = useCurarReporteFinal()
  const contadorRef = useRef(0)

  const [resumen, setResumen] = useState(() => base?.resumen ?? "")
  const [filas, setFilas] = useState<FilaReforzar[]>(() =>
    (base?.aReforzar ?? []).map((r) => ({
      id: contadorRef.current++,
      que: r.que,
      sugerencia: r.sugerencia,
    })),
  )

  if (base === null) {
    return (
      <Tarjeta>
        <p className="text-body-sm text-text-tertiary">
          El informe estará disponible cuando la revisión con IA termine de evaluar el repositorio.
        </p>
      </Tarjeta>
    )
  }

  // Estados no editables (FINALIZADO/ANULADO/…): mostramos lo PERSISTIDO, nunca
  // el buffer de edición (podría tener texto tecleado sin guardar).
  if (!editable) {
    return (
      <Tarjeta>
        <InformeCuradoSoloLectura
          resumen={base.resumen}
          aReforzar={base.aReforzar}
          fechaValidacion={intento.fechaValidacion}
        />
      </Tarjeta>
    )
  }

  const editarFila = (id: number, campo: "que" | "sugerencia", valor: string): void => {
    setFilas((prev) => prev.map((f) => (f.id === id ? { ...f, [campo]: valor } : f)))
  }
  const guardar = (): void => {
    mutation.mutate({
      intentoId: intento.intentoId,
      body: {
        reporteFinal: construirReporteFinal(base, {
          resumen,
          aReforzar: filas.map((f) => ({ que: f.que, sugerencia: f.sugerencia })),
        }),
      },
    })
  }

  const incompletas = hayFilasIncompletas(filas)

  return (
    <Tarjeta>
      <div className="flex flex-col gap-2">
        <span className="nx-eyebrow text-text-tertiary">Resumen</span>
        <Textarea
          aria-label="Resumen del informe para el participante"
          rows={4}
          maxLength={MAX_RESUMEN}
          placeholder="Un resumen honesto y accionable de su proyecto."
          value={resumen}
          onChange={(e) => setResumen(e.target.value)}
        />
      </div>

      <EditorAreasReforzar
        filas={filas}
        disabled={false}
        onEditar={editarFila}
        onQuitar={(id) => setFilas((prev) => prev.filter((f) => f.id !== id))}
        onAgregar={() =>
          setFilas((prev) => [...prev, { id: contadorRef.current++, que: "", sugerencia: "" }])
        }
      />

      <div className="flex items-center gap-3">
        <Button size="sm" onClick={guardar} disabled={incompletas || mutation.isPending}>
          {mutation.isPending ? "Guardando…" : "Guardar informe"}
        </Button>
        <Feedback incompletas={incompletas} mutation={mutation} />
      </div>
    </Tarjeta>
  )
}

function Tarjeta({ children }: { readonly children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6">
      <div className="flex flex-col gap-1">
        <span className="nx-eyebrow text-text-tertiary">Informe para el participante</span>
        <h2 className="text-h3 text-text-primary">Lo que verá el alumno</h2>
        <p className="text-body-sm text-text-secondary">
          Edita el resumen y las áreas a reforzar. Se publica cuando finalices el intento; la
          revisión con IA de arriba queda como evidencia y no se toca.
        </p>
      </div>
      {children}
    </section>
  )
}

function Feedback({
  incompletas,
  mutation,
}: {
  readonly incompletas: boolean
  readonly mutation: ReturnType<typeof useCurarReporteFinal>
}) {
  const feedback = incompletas
    ? { texto: "Completa el qué y la sugerencia de cada área (o quítala).", danger: true }
    : mutation.isError
      ? { texto: "No se pudo guardar. Reintenta.", danger: true }
      : mutation.isSuccess
        ? { texto: "Cambios guardados.", danger: false }
        : null
  return (
    <span
      aria-live="polite"
      className={cn("text-caption", feedback?.danger ? "text-danger" : "text-text-tertiary")}
    >
      {feedback?.texto ?? ""}
    </span>
  )
}
