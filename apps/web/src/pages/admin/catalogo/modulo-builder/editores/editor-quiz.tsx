import { EmptyState } from "@/shared/components/ui/empty-state"
import { type AccionMenu, MenuAcciones } from "@/shared/components/ui/menu-acciones"
import type { BloqueDetalleResponse } from "@nexott-learn/shared-types"
import { ChevronDown, HelpCircle, Plus } from "lucide-react"
import { useMemo, useRef, useState } from "react"
import { type ConfigQuiz, QuizConfig } from "./quiz/quiz-config"
import { type BorradorQuiz, leerInicial } from "./quiz/quiz-lectura"
import { QuizPregunta } from "./quiz/quiz-pregunta"
import {
  TIPOS_PREGUNTA_META,
  type PreguntaQuiz,
  type TipoPreguntaQuiz,
  preguntaVacia,
} from "./quiz/quiz-tipos"
import { EditorBloqueShell } from "./shared/editor-bloque-shell"
import { useAutoGuardarBloque } from "./shared/use-auto-guardar-bloque"

interface EditorQuizProps {
  readonly bloque: BloqueDetalleResponse
}

export function EditorQuiz({ bloque }: EditorQuizProps) {
  const inicial = useMemo(() => leerInicial(bloque.contenido), [bloque.contenido])
  const [datos, setDatos] = useState<BorradorQuiz>(inicial)
  const datosRef = useRef<BorradorQuiz>(inicial)
  const [expandidaId, setExpandidaId] = useState<string | null>(inicial.preguntas[0]?.id ?? null)

  const auto = useAutoGuardarBloque({
    bloqueId: bloque.id,
    construirContenido: () => ({
      ...datosRef.current.config,
      preguntas: datosRef.current.preguntas,
    }),
  })

  function actualizar(siguiente: BorradorQuiz) {
    setDatos(siguiente)
    datosRef.current = siguiente
    auto.marcarSucio()
  }

  function actualizarConfig(siguiente: ConfigQuiz) {
    actualizar({ ...datos, config: siguiente })
  }

  function actualizarPregunta(siguiente: PreguntaQuiz) {
    actualizar({
      ...datos,
      preguntas: datos.preguntas.map((p) => (p.id === siguiente.id ? siguiente : p)),
    })
  }

  function eliminarPregunta(id: string) {
    actualizar({ ...datos, preguntas: datos.preguntas.filter((p) => p.id !== id) })
    if (expandidaId === id) {
      setExpandidaId(null)
    }
  }

  function anadirPregunta(tipo: TipoPreguntaQuiz) {
    const nueva = preguntaVacia(tipo)
    actualizar({ ...datos, preguntas: [...datos.preguntas, nueva] })
    setExpandidaId(nueva.id)
  }

  const accionesAnadir: ReadonlyArray<AccionMenu> = TIPOS_PREGUNTA_META.map((m) => ({
    id: m.tipo,
    etiqueta: m.etiqueta,
    icono: m.icono,
    onClick: () => anadirPregunta(m.tipo),
  }))

  return (
    <EditorBloqueShell
      bloque={bloque}
      titulo="Quiz de selección"
      descripcion="Preguntas auto-corregidas. La nota es el porcentaje de aciertos (pondera por «peso» de cada pregunta)."
      estadoGuardado={auto.estado}
    >
      <QuizConfig config={datos.config} onCambiar={actualizarConfig} />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <span className="nx-eyebrow text-text-tertiary">
            Preguntas · {datos.preguntas.length}
          </span>
          <MenuAcciones
            etiquetaAria="Elegir tipo de pregunta a añadir"
            grupos={[accionesAnadir]}
            trigger={
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-pill border border-border-strong bg-surface px-3 py-1.5 text-body-sm font-medium text-text-primary shadow-xs transition-[background-color,border-color,box-shadow] duration-fast ease-default hover:bg-subtle/60 focus-visible:border-aurora-violet focus-visible:shadow-ring-aurora-soft focus-visible:outline-none"
              >
                <Plus className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
                Añadir pregunta
                <ChevronDown
                  className="h-3.5 w-3.5 text-text-tertiary"
                  strokeWidth={1.5}
                  aria-hidden={true}
                />
              </button>
            }
          />
        </div>

        {datos.preguntas.length === 0 ? (
          <EmptyState
            icono={HelpCircle}
            titulo="Aún no hay preguntas"
            descripcion="Añade la primera pregunta y elige su tipo. Puedes mezclar varios tipos en el mismo quiz."
          />
        ) : (
          <ol className="flex flex-col gap-2">
            {datos.preguntas.map((p, idx) => (
              <QuizPregunta
                key={p.id}
                pregunta={p}
                numero={idx + 1}
                expandida={expandidaId === p.id}
                onAlternar={() => setExpandidaId(expandidaId === p.id ? null : p.id)}
                onCambiar={actualizarPregunta}
                onEliminar={() => eliminarPregunta(p.id)}
              />
            ))}
          </ol>
        )}
      </div>
    </EditorBloqueShell>
  )
}
