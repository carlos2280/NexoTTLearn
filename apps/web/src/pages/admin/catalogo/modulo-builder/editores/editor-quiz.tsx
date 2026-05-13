import { Button } from "@/shared/components/ui/button"
import { EmptyState } from "@/shared/components/ui/empty-state"
import type { BloqueDetalleResponse } from "@nexott-learn/shared-types"
import { HelpCircle, Plus } from "lucide-react"
import { useMemo, useRef, useState } from "react"
import { tipoBloqueMeta } from "../bloque-tipo-meta"
import { type ConfigQuiz, QuizConfig, type SolucionVisible } from "./quiz/quiz-config"
import { type PreguntaQuiz, QuizPregunta, preguntaVacia } from "./quiz/quiz-pregunta"
import { IndicadorGuardado } from "./shared/indicador-guardado"
import { useAutoGuardarBloque } from "./shared/use-auto-guardar-bloque"

interface EditorQuizProps {
  readonly bloque: BloqueDetalleResponse
}

interface BorradorQuiz {
  readonly config: ConfigQuiz
  readonly preguntas: readonly PreguntaQuiz[]
}

function leerInicial(contenido: Record<string, unknown> | null): BorradorQuiz {
  const intentosMax =
    contenido?.intentosMax === null
      ? null
      : typeof contenido?.intentosMax === "number"
        ? contenido.intentosMax
        : null
  const solucion: SolucionVisible =
    contenido?.solucionVisible === "tras_intento" ||
    contenido?.solucionVisible === "al_aprobar" ||
    contenido?.solucionVisible === "al_cerrar"
      ? (contenido.solucionVisible as SolucionVisible)
      : "al_aprobar"
  const ordenAleatorio =
    typeof contenido?.ordenAleatorio === "boolean" ? contenido.ordenAleatorio : false
  const notaMinima = typeof contenido?.notaMinima === "number" ? contenido.notaMinima : 60
  const preguntas = Array.isArray(contenido?.preguntas)
    ? (contenido.preguntas as PreguntaQuiz[])
    : []
  return {
    config: {
      intentosMax,
      solucionVisible: solucion,
      ordenAleatorio,
      notaMinima,
    },
    preguntas,
  }
}

export function EditorQuiz({ bloque }: EditorQuizProps) {
  const meta = tipoBloqueMeta(bloque.tipo)
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
    actualizar({
      ...datos,
      preguntas: datos.preguntas.filter((p) => p.id !== id),
    })
    if (expandidaId === id) {
      setExpandidaId(null)
    }
  }

  function anadirPregunta() {
    const nueva = preguntaVacia()
    actualizar({ ...datos, preguntas: [...datos.preguntas, nueva] })
    setExpandidaId(nueva.id)
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="nx-eyebrow text-text-tertiary">Bloque · {meta.etiqueta}</span>
          <h2 className="text-h2 text-text-primary">Quiz de selección</h2>
          <p className="max-w-xl text-body-sm text-text-secondary">
            Preguntas con una opción correcta. Auto-corregido. La nota es el porcentaje de preguntas
            correctas sobre el total.
          </p>
        </div>
        <IndicadorGuardado estado={auto.estado} />
      </header>

      <QuizConfig config={datos.config} onCambiar={actualizarConfig} />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <span className="nx-eyebrow text-text-tertiary">
            Preguntas · {datos.preguntas.length}
          </span>
          <Button variant="secondary" size="sm" onClick={anadirPregunta}>
            <Plus className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
            Añadir pregunta
          </Button>
        </div>

        {datos.preguntas.length === 0 ? (
          <EmptyState
            icono={HelpCircle}
            titulo="Aún no hay preguntas"
            descripcion="Añade la primera pregunta. Cada una con al menos 2 opciones y una correcta."
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
    </div>
  )
}
