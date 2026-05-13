import { Field } from "@/shared/components/ui/field"
import { Input } from "@/shared/components/ui/input"
import { Textarea } from "@/shared/components/ui/textarea"
import { cn } from "@/shared/lib/cn"
import type { BloqueDetalleResponse } from "@nexott-learn/shared-types"
import { ExternalLink, Paperclip } from "lucide-react"
import { useRef, useState } from "react"
import { tipoBloqueMeta } from "../bloque-tipo-meta"
import { IndicadorGuardado } from "./shared/indicador-guardado"
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
  const subtipo = contenido?.subtipo === "adjunto" ? "adjunto" : "enlace"
  const url = typeof contenido?.url === "string" ? contenido.url : ""
  const titulo = typeof contenido?.titulo === "string" ? contenido.titulo : ""
  const descripcion = typeof contenido?.descripcion === "string" ? contenido.descripcion : ""
  const abrirNuevaPestana =
    typeof contenido?.abrirNuevaPestana === "boolean" ? contenido.abrirNuevaPestana : true
  return { subtipo, url, titulo, descripcion, abrirNuevaPestana }
}

export function EditorRecurso({ bloque }: EditorRecursoProps) {
  const meta = tipoBloqueMeta(bloque.tipo)
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
    <div className="flex flex-col gap-5">
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="nx-eyebrow text-text-tertiary">Bloque · {meta.etiqueta}</span>
          <h2 className="text-h2 text-text-primary">Recurso de apoyo</h2>
          <p className="max-w-xl text-body-sm text-text-secondary">
            Material complementario que el participante puede consultar. Sin evaluación: se marca
            completado al abrir.
          </p>
        </div>
        <IndicadorGuardado estado={auto.estado} />
      </header>

      <div className="flex items-center gap-2" role="radiogroup" aria-label="Tipo de recurso">
        {(
          [
            { id: "enlace", etiqueta: "Enlace externo", icono: ExternalLink },
            { id: "adjunto", etiqueta: "Adjunto", icono: Paperclip },
          ] as const
        ).map((opt) => {
          const activo = datos.subtipo === opt.id
          const Icono = opt.icono
          return (
            <label
              key={opt.id}
              className={cn(
                "inline-flex cursor-pointer items-center gap-1.5 rounded-pill border px-3 py-1.5 text-caption transition-colors",
                activo
                  ? "border-accent bg-accent-soft text-accent-on-soft"
                  : "border-border bg-surface text-text-secondary hover:bg-subtle",
              )}
            >
              <input
                type="radio"
                name="recurso-subtipo"
                checked={activo}
                onChange={() => actualizar({ subtipo: opt.id })}
                className="sr-only"
              />
              <Icono className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden={true} />
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

      <Field label="Descripción" hint="Opcional. Aparece debajo del título.">
        {(attrs) => (
          <Textarea
            {...attrs}
            rows={3}
            value={datos.descripcion}
            onChange={(e) => actualizar({ descripcion: e.target.value })}
            placeholder="Ej. Capítulo oficial sobre genéricos del Handbook…"
          />
        )}
      </Field>

      {datos.subtipo === "enlace" ? (
        <label className="inline-flex items-center gap-2 text-body-sm text-text-secondary">
          <input
            type="checkbox"
            checked={datos.abrirNuevaPestana}
            onChange={(e) => actualizar({ abrirNuevaPestana: e.target.checked })}
            className="h-4 w-4 rounded border-border-strong text-accent focus:ring-accent"
          />
          Abrir en nueva pestaña
        </label>
      ) : null}
    </div>
  )
}
