import { Field } from "@/shared/components/ui/field"
import { Input } from "@/shared/components/ui/input"
import { Switch } from "@/shared/components/ui/switch"
import { cn } from "@/shared/lib/cn"
import { type BloqueDetalleResponse, contenidoRecursoSchema } from "@nexott-learn/shared-types"
import { ExternalLink, Paperclip } from "lucide-react"
import { useRef, useState } from "react"
import { EditorBloqueShell } from "./shared/editor-bloque-shell"
import { TiptapEditor } from "./shared/tiptap-editor"
import { extensionesMinimas } from "./shared/tiptap-extensiones"
import { useAutoGuardarBloque } from "./shared/use-auto-guardar-bloque"

interface EditorRecursoProps {
  readonly bloque: BloqueDetalleResponse
}

type Subtipo = "enlace" | "adjunto"

interface Borrador {
  readonly subtipo: Subtipo
  readonly url: string
  readonly titulo: string
  readonly descripcion: string
  readonly abrirNuevaPestana: boolean
}

function leerInicial(contenido: Record<string, unknown> | null): Borrador {
  const result = contenidoRecursoSchema.safeParse(contenido)
  if (result.success) {
    return result.data
  }
  return {
    subtipo: "enlace",
    url: "",
    titulo: "",
    descripcion: "",
    abrirNuevaPestana: true,
  }
}

const SUBTIPOS = [
  { id: "enlace" as const, etiqueta: "Enlace externo", icono: ExternalLink },
  { id: "adjunto" as const, etiqueta: "Adjunto", icono: Paperclip },
]

export function EditorRecurso({ bloque }: EditorRecursoProps) {
  const inicial = leerInicial(bloque.contenido)
  const [datos, setDatos] = useState<Borrador>(inicial)
  const datosRef = useRef<Borrador>(inicial)

  const auto = useAutoGuardarBloque({
    bloqueId: bloque.id,
    construirContenido: () => ({ ...datosRef.current }),
  })

  function actualizar(parcial: Partial<Borrador>) {
    setDatos((prev) => {
      const siguiente = { ...prev, ...parcial }
      datosRef.current = siguiente
      return siguiente
    })
    auto.marcarSucio()
  }

  return (
    <EditorBloqueShell
      bloque={bloque}
      titulo="Recurso de apoyo"
      descripcion="Material complementario que el participante puede consultar. Sin evaluación: se marca completado al abrir."
      estadoGuardado={auto.estado}
    >
      <div className="flex items-center gap-2" role="radiogroup" aria-label="Tipo de recurso">
        {SUBTIPOS.map((opt) => {
          const activo = datos.subtipo === opt.id
          const Icono = opt.icono
          return (
            <label
              key={opt.id}
              className={cn(
                "inline-flex cursor-pointer items-center gap-1.5 rounded-pill border px-3 py-1.5 text-caption",
                "transition-[background-color,border-color,color,box-shadow] duration-fast ease-default",
                activo
                  ? "border-border-strong bg-subtle font-medium text-text-primary shadow-xs"
                  : "border-border bg-surface text-text-secondary hover:bg-subtle/60",
              )}
            >
              <input
                type="radio"
                name="recurso-subtipo"
                checked={activo}
                onChange={() => actualizar({ subtipo: opt.id })}
                className="sr-only"
              />
              <Icono
                className={cn("h-3.5 w-3.5", activo ? "text-accent" : "text-text-tertiary")}
                strokeWidth={1.5}
                aria-hidden={true}
              />
              {opt.etiqueta}
            </label>
          )
        })}
      </div>

      <Field label="Título" hint="Lo que ve el participante en la lista.">
        {(attrs) => (
          <Input
            {...attrs}
            value={datos.titulo}
            onChange={(e) => actualizar({ titulo: e.target.value })}
            placeholder="Ej. Guía oficial de TypeScript"
            maxLength={200}
          />
        )}
      </Field>

      <Field
        label={datos.subtipo === "enlace" ? "URL del enlace" : "URL del archivo"}
        hint={
          datos.subtipo === "enlace"
            ? "Debe ser una URL pública accesible."
            : "En MVP, pega la URL del archivo subido a tu storage."
        }
      >
        {(attrs) => (
          <Input
            {...attrs}
            type="url"
            value={datos.url}
            onChange={(e) => actualizar({ url: e.target.value })}
            placeholder="https://…"
          />
        )}
      </Field>

      <Field
        label="Descripción"
        hint="Opcional. Acepta negrita, cursiva, listas, código inline y enlaces."
      >
        {(_attrs) => (
          <TiptapEditor
            key={bloque.id}
            htmlInicial={datos.descripcion}
            extensiones={extensionesMinimas("Ej. Capítulo oficial sobre genéricos del Handbook…")}
            variante="minima"
            altoMin="100px"
            onCambio={(html) => actualizar({ descripcion: html })}
          />
        )}
      </Field>

      {datos.subtipo === "enlace" ? (
        <Switch
          checked={datos.abrirNuevaPestana}
          onCambio={(v) => actualizar({ abrirNuevaPestana: v })}
          label="Abrir en nueva pestaña"
          descripcion="Se abre en una pestaña aparte para no interrumpir el curso."
        />
      ) : null}
    </EditorBloqueShell>
  )
}
