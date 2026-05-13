import type { BloqueDetalleResponse, SeccionResponse, TipoBloque } from "@nexott-learn/shared-types"
import { Boxes, MousePointer2 } from "lucide-react"
import { tipoBloqueMeta } from "../bloque-tipo-meta"
import { EditorCodigoIlustrativo } from "../editores/editor-codigo-ilustrativo"
import { EditorCodigoPreguntas } from "../editores/editor-codigo-preguntas"
import { EditorCodigoTests } from "../editores/editor-codigo-tests"
import { EditorParrafo } from "../editores/editor-parrafo"
import { EditorQuiz } from "../editores/editor-quiz"
import { EditorRecurso } from "../editores/editor-recurso"
import { EditorTip } from "../editores/editor-tip"
import { EditorVideo } from "../editores/editor-video"
import type { Seleccion } from "../types"

interface BuilderCanvasProps {
  readonly seleccion: Seleccion
  readonly seccion: SeccionResponse | undefined
  readonly bloque: BloqueDetalleResponse | undefined
  readonly tituloModulo: string
  readonly onCrearBloqueDirecto?: (seccionId: string, tipo: TipoBloque) => Promise<void>
}

/**
 * Canvas central del builder. En B0 muestra solo el contexto del item
 * seleccionado y un placeholder. Los editores reales por tipo llegan en B1+.
 */
export function BuilderCanvas({
  seleccion,
  seccion,
  bloque,
  tituloModulo,
  onCrearBloqueDirecto,
}: BuilderCanvasProps) {
  return (
    <section
      className="flex h-full min-w-0 flex-1 flex-col overflow-y-auto"
      style={{ backgroundImage: "var(--gradient-admin-canvas)" }}
    >
      <div className="mx-auto w-full max-w-[720px] px-8 py-12">
        {seleccion.tipo === "modulo" ? <EstadoVacioModulo titulo={tituloModulo} /> : null}
        {seleccion.tipo === "seccion" && seccion ? <ContextoSeccion seccion={seccion} /> : null}
        {seleccion.tipo === "bloque" && bloque ? (
          <ContextoBloque bloque={bloque} onCrearBloqueDirecto={onCrearBloqueDirecto} />
        ) : null}
      </div>
    </section>
  )
}

function EstadoVacioModulo({ titulo }: { readonly titulo: string }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-subtle text-text-tertiary">
        <MousePointer2 className="h-6 w-6" strokeWidth={1.5} aria-hidden={true} />
      </div>
      <div className="flex flex-col gap-1">
        <h2 className="text-h2 text-text-primary">{titulo}</h2>
        <p className="max-w-md text-body-sm text-text-secondary">
          Selecciona una sección o un bloque en el árbol de la izquierda para empezar a editar. Las
          propiedades del módulo viven en el panel derecho.
        </p>
      </div>
    </div>
  )
}

function ContextoSeccion({ seccion }: { readonly seccion: SeccionResponse }) {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <span className="nx-eyebrow text-text-tertiary">Sección {seccion.orden}</span>
        <h2 className="text-h2 text-text-primary">{seccion.titulo}</h2>
      </header>
      <div className="flex flex-col gap-2 rounded-lg border border-border border-dashed bg-surface p-6 text-text-tertiary">
        <p className="text-body-sm">
          El editor de sección llega en un lote próximo. Aquí podrás describir la sección, asociar
          skills y reordenar sus bloques.
        </p>
      </div>
    </div>
  )
}

function ContextoBloque({
  bloque,
  onCrearBloqueDirecto,
}: {
  readonly bloque: BloqueDetalleResponse
  readonly onCrearBloqueDirecto?: (seccionId: string, tipo: TipoBloque) => Promise<void>
}) {
  // Dispatcher por tipo. Editores no implementados aun caen en placeholder.
  if (bloque.tipo === "PARRAFO") {
    return <EditorParrafo bloque={bloque} onSlashCommand={onCrearBloqueDirecto} />
  }
  if (bloque.tipo === "TIP") {
    return <EditorTip bloque={bloque} />
  }
  if (bloque.tipo === "VIDEO") {
    return <EditorVideo bloque={bloque} />
  }
  if (bloque.tipo === "RECURSO") {
    return <EditorRecurso bloque={bloque} />
  }
  if (bloque.tipo === "QUIZ") {
    return <EditorQuiz bloque={bloque} />
  }
  if (bloque.tipo === "CODIGO_ILUSTRATIVO") {
    return <EditorCodigoIlustrativo bloque={bloque} />
  }
  if (bloque.tipo === "CODIGO_PREGUNTAS") {
    return <EditorCodigoPreguntas bloque={bloque} />
  }
  if (bloque.tipo === "CODIGO_TESTS") {
    return <EditorCodigoTests bloque={bloque} />
  }
  const meta = tipoBloqueMeta(bloque.tipo)
  const Icono = meta.icono
  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-subtle text-text-secondary">
          <Icono className="h-5 w-5" strokeWidth={1.5} aria-hidden={true} />
        </span>
        <div className="flex flex-col gap-1">
          <span className="nx-eyebrow text-text-tertiary">Bloque · {meta.etiqueta}</span>
          <h2 className="text-h2 text-text-primary">{meta.etiqueta}</h2>
          <p className="text-body-sm text-text-secondary">{meta.descripcionCorta}</p>
        </div>
      </header>
      <div className="flex flex-col gap-3 rounded-lg border border-border border-dashed bg-surface p-6">
        <div className="flex items-center gap-2 text-text-tertiary">
          <Boxes className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
          <span className="text-body-sm">
            El editor de {meta.etiqueta.toLowerCase()} llega en un lote próximo.
          </span>
        </div>
      </div>
    </div>
  )
}
