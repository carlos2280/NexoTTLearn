import { Banner } from "@/shared/components/ui/banner"
import { PageHeader } from "@/shared/components/ui/page-header"
import type { BloqueDetalleResponse, SeccionResponse, TipoBloque } from "@nexott-learn/shared-types"
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
 * Canvas central del builder.
 *
 * Sin selección → vista editorial del módulo (PageHeader canónico).
 * Sección o bloque → header contextual + editor real (si existe) o
 * banner-info de "próximamente". Sin border-dashed, sin placeholders ruidosos.
 */
export function BuilderCanvas({
  seleccion,
  seccion,
  bloque,
  tituloModulo,
  onCrearBloqueDirecto,
}: BuilderCanvasProps) {
  return (
    <section className="flex h-full min-w-0 flex-1 flex-col overflow-y-auto bg-canvas">
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
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Módulo"
        titulo={titulo}
        descripcion="Selecciona una sección o un bloque en el árbol para empezar a editar. Las propiedades del módulo viven en el panel derecho."
      />
    </div>
  )
}

function ContextoSeccion({ seccion }: { readonly seccion: SeccionResponse }) {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <span className="nx-eyebrow text-text-tertiary">Sección · {seccion.orden}</span>
        <h2 className="text-h2 text-text-primary">{seccion.titulo}</h2>
      </header>
      <Banner tone="info">
        El editor de sección llega próximamente. Mientras tanto, gestiona los bloques desde el
        árbol.
      </Banner>
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
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
          <Icono className="h-5 w-5" strokeWidth={1.5} aria-hidden={true} />
        </span>
        <div className="flex flex-col gap-1">
          <span className="nx-eyebrow text-text-tertiary">Bloque · {meta.etiqueta}</span>
          <h2 className="text-h2 text-text-primary">{meta.etiqueta}</h2>
          <p className="text-body-sm text-text-secondary">{meta.descripcionCorta}</p>
        </div>
      </header>
      <Banner tone="info">El editor de {meta.etiqueta.toLowerCase()} llega próximamente.</Banner>
    </div>
  )
}
