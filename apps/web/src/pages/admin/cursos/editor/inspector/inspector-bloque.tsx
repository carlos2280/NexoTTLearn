import {
  useActualizarBloque,
  useEliminarBloque,
} from "@/features/admin-cursos/hooks/use-editor-curso"
import {
  InspectorPanel,
  InspectorRow,
  InspectorSection,
} from "@/shared/ui/patterns/immersive/inspector"
import { Button } from "@/shared/ui/primitives/button"
import type {
  ActualizarBloqueAdminInput,
  BloqueDetalleAdmin,
  CodigoEvaluable,
  CodigoInteractivo,
  LenguajeCodigo,
  TipVariante,
} from "@nexott-learn/shared-types"
import { Trash2 } from "lucide-react"
import { useState } from "react"
import { useDebouncedSave } from "../hooks/use-debounced-save"

interface InspectorBloqueProps {
  readonly bloque: BloqueDetalleAdmin
  readonly cursoId: string
  readonly moduloId: string
  readonly seccionId: string
}

function tipoLabel(tipo: BloqueDetalleAdmin["tipo"]): string {
  switch (tipo) {
    case "PARRAFO":
      return "Párrafo"
    case "TIP":
      return "Tip"
    case "VIDEO":
      return "Video"
    case "RECURSO":
      return "Recurso"
    case "CODIGO":
      return "Código"
    default:
      return "Quiz"
  }
}

export function InspectorBloque({ bloque, cursoId, moduloId, seccionId }: InspectorBloqueProps) {
  const actualizar = useActualizarBloque(cursoId, moduloId, seccionId)
  const eliminar = useEliminarBloque(cursoId, moduloId, seccionId)

  return (
    <InspectorPanel
      eyebrow={tipoLabel(bloque.tipo)}
      title={`Bloque #${bloque.orden + 1}`}
      subtitle={<span>Auto-guardado activo</span>}
    >
      <InspectorSection title="Contenido">
        <BloqueEditor
          bloque={bloque}
          onSave={(input) => actualizar.mutate({ bloqueId: bloque.id, input })}
          saving={actualizar.isPending}
        />
      </InspectorSection>

      {bloque.tipo === "CODIGO" ? (
        <InspectorSection title="Comportamiento" defaultOpen={false}>
          <CodigoControles
            bloque={bloque}
            cursoId={cursoId}
            moduloId={moduloId}
            seccionId={seccionId}
          />
        </InspectorSection>
      ) : null}

      <InspectorSection title="Avanzado" defaultOpen={false}>
        <Button
          variant="ghost"
          size="sm"
          full={true}
          onClick={() => {
            if (confirm("¿Eliminar este bloque?")) {
              eliminar.mutate(bloque.id)
            }
          }}
        >
          <Trash2 className="size-3.5 text-danger" />
          <span className="text-danger">Eliminar bloque</span>
        </Button>
      </InspectorSection>
    </InspectorPanel>
  )
}

// ─── Editor por tipo ─────────────────────────────────────────────────

interface BloqueEditorProps {
  readonly bloque: BloqueDetalleAdmin
  readonly onSave: (input: ActualizarBloqueAdminInput) => void
  readonly saving: boolean
}

function BloqueEditor({ bloque, onSave, saving }: BloqueEditorProps) {
  switch (bloque.tipo) {
    case "PARRAFO":
      return <ParrafoEditor bloque={bloque} onSave={onSave} saving={saving} />
    case "TIP":
      return <TipEditor bloque={bloque} onSave={onSave} saving={saving} />
    case "VIDEO":
      return <VideoEditor bloque={bloque} onSave={onSave} saving={saving} />
    case "RECURSO":
      return <RecursoEditor bloque={bloque} onSave={onSave} saving={saving} />
    case "CODIGO":
      return <CodigoEditor bloque={bloque} onSave={onSave} saving={saving} />
    default:
      return (
        <p className="text-text-muted text-xs">
          Editor para {tipoLabel(bloque.tipo)} pendiente. Usa el canvas para ver el contenido.
        </p>
      )
  }
}

function ParrafoEditor({ bloque, onSave }: BloqueEditorProps) {
  const initial = extractTiptapText(bloque.payload.contenidoTiptap) || ""
  const [text, setText] = useState(initial)
  useDebouncedSave(text, (v) =>
    onSave({
      payload: {
        contenidoTiptap: {
          type: "doc",
          content: [{ type: "paragraph", content: [{ type: "text", text: v }] }],
        },
      },
    }),
  )
  return (
    <InspectorRow label="Texto" hint="Auto-guardado al pausar la escritura">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        className="resize-y rounded-[var(--radius-sm)] border border-glass-border bg-glass-1 px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-violet"
      />
    </InspectorRow>
  )
}

function TipEditor({ bloque, onSave }: BloqueEditorProps) {
  const [variante, setVariante] = useState<TipVariante>(
    (bloque.payload.variante as TipVariante) ?? "info",
  )
  const [texto, setTexto] = useState((bloque.payload.texto as string) ?? "")

  useDebouncedSave({ variante, texto }, (v) =>
    onSave({ payload: { variante: v.variante, texto: v.texto } }),
  )

  return (
    <>
      <InspectorRow label="Variante">
        <div className="grid grid-cols-2 gap-1.5">
          {(["info", "best-practice", "warning", "gotcha"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setVariante(v)}
              className={`rounded-[var(--radius-sm)] border px-2 py-1.5 text-[11px] uppercase tracking-wider transition-colors ${
                variante === v
                  ? "border-brand-violet bg-brand-violet/10 text-brand-violet-soft"
                  : "border-glass-border bg-glass-1 text-text-secondary hover:border-glass-border-strong"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </InspectorRow>
      <InspectorRow label="Texto">
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={4}
          className="resize-y rounded-[var(--radius-sm)] border border-glass-border bg-glass-1 px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-violet"
        />
      </InspectorRow>
    </>
  )
}

function VideoEditor({ bloque, onSave }: BloqueEditorProps) {
  const [url, setUrl] = useState((bloque.payload.url as string) ?? "")
  const [proveedor, setProveedor] = useState((bloque.payload.proveedor as string) ?? "youtube")
  useDebouncedSave({ url, proveedor }, (v) =>
    onSave({ payload: { url: v.url, proveedor: v.proveedor } }),
  )
  return (
    <>
      <InspectorRow label="URL del video">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
          className="rounded-[var(--radius-sm)] border border-glass-border bg-glass-1 px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-violet"
        />
      </InspectorRow>
      <InspectorRow label="Proveedor">
        <select
          value={proveedor}
          onChange={(e) => setProveedor(e.target.value)}
          className="rounded-[var(--radius-sm)] border border-glass-border bg-glass-1 px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-violet"
        >
          <option value="youtube">YouTube</option>
          <option value="vimeo">Vimeo</option>
          <option value="interno">Interno</option>
        </select>
      </InspectorRow>
    </>
  )
}

function RecursoEditor({ bloque, onSave }: BloqueEditorProps) {
  const [url, setUrl] = useState((bloque.payload.url as string) ?? "")
  const [descripcion, setDescripcion] = useState((bloque.payload.descripcion as string) ?? "")
  const [esDescarga, setEsDescarga] = useState(Boolean(bloque.payload.esDescarga))
  useDebouncedSave({ url, descripcion, esDescarga }, (v) =>
    onSave({
      payload: {
        url: v.url,
        descripcion: v.descripcion || undefined,
        esDescarga: v.esDescarga,
      },
    }),
  )
  return (
    <>
      <InspectorRow label="URL del recurso">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="rounded-[var(--radius-sm)] border border-glass-border bg-glass-1 px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-violet"
        />
      </InspectorRow>
      <InspectorRow label="Descripción">
        <input
          type="text"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          className="rounded-[var(--radius-sm)] border border-glass-border bg-glass-1 px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-violet"
        />
      </InspectorRow>
      <InspectorRow label="Tipo">
        <label className="flex items-center gap-2 text-sm text-text-secondary">
          <input
            type="checkbox"
            checked={esDescarga}
            onChange={(e) => setEsDescarga(e.target.checked)}
          />
          Es descarga (no enlace externo)
        </label>
      </InspectorRow>
    </>
  )
}

function CodigoEditor({ bloque, onSave }: BloqueEditorProps) {
  const archivos = (bloque.payload.archivos as Array<{ nombre: string; contenido: string }>) ?? []
  const primero = archivos[0] ?? { nombre: "main.txt", contenido: "" }
  const [codigo, setCodigo] = useState(primero.contenido)

  useDebouncedSave(codigo, (v) =>
    onSave({
      payload: {
        ...bloque.payload,
        archivos: [{ ...primero, contenido: v }, ...archivos.slice(1)],
      },
    }),
  )

  return (
    <InspectorRow label={`Archivo: ${primero.nombre}`}>
      <textarea
        value={codigo}
        onChange={(e) => setCodigo(e.target.value)}
        rows={10}
        className="resize-y rounded-[var(--radius-sm)] border border-glass-border bg-surface-2 px-3 py-2 font-mono text-[12.5px] text-text-primary outline-none focus:border-brand-violet"
      />
    </InspectorRow>
  )
}

function CodigoControles({
  bloque,
  cursoId,
  moduloId,
  seccionId,
}: {
  readonly bloque: BloqueDetalleAdmin
  readonly cursoId: string
  readonly moduloId: string
  readonly seccionId: string
}) {
  const actualizar = useActualizarBloque(cursoId, moduloId, seccionId)
  const update = (patch: ActualizarBloqueAdminInput) =>
    actualizar.mutate({ bloqueId: bloque.id, input: patch })

  return (
    <>
      <InspectorRow label="Lenguaje">
        <select
          value={bloque.codigoLenguaje ?? "JAVASCRIPT"}
          onChange={(e) => update({ codigoLenguaje: e.target.value as LenguajeCodigo })}
          className="rounded-[var(--radius-sm)] border border-glass-border bg-glass-1 px-3 py-2 text-sm text-text-primary"
        >
          <option value="JAVASCRIPT">JavaScript</option>
          <option value="TYPESCRIPT">TypeScript</option>
          <option value="REACT">React</option>
          <option value="PYTHON">Python</option>
        </select>
      </InspectorRow>
      <InspectorRow label="Interactivo">
        <select
          value={bloque.codigoInteractivo ?? "SOLO_VER"}
          onChange={(e) => update({ codigoInteractivo: e.target.value as CodigoInteractivo })}
          className="rounded-[var(--radius-sm)] border border-glass-border bg-glass-1 px-3 py-2 text-sm text-text-primary"
        >
          <option value="SOLO_VER">Solo ver</option>
          <option value="EDITABLE">Editable</option>
        </select>
      </InspectorRow>
      <InspectorRow label="Evaluable">
        <select
          value={bloque.codigoEvaluable ?? "NINGUNO"}
          onChange={(e) => update({ codigoEvaluable: e.target.value as CodigoEvaluable })}
          className="rounded-[var(--radius-sm)] border border-glass-border bg-glass-1 px-3 py-2 text-sm text-text-primary"
        >
          <option value="NINGUNO">Sin evaluación</option>
          <option value="PREGUNTAS">Preguntas</option>
          <option value="TESTS">Tests</option>
        </select>
      </InspectorRow>
    </>
  )
}

function extractTiptapText(input: unknown): string {
  if (!input || typeof input !== "object") {
    return ""
  }
  const node = input as { content?: unknown; text?: unknown }
  if (typeof node.text === "string") {
    return node.text
  }
  if (Array.isArray(node.content)) {
    return node.content.map(extractTiptapText).filter(Boolean).join(" ")
  }
  return ""
}
