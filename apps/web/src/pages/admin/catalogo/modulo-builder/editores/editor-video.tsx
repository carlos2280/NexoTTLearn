import { Field } from "@/shared/components/ui/field"
import { Input } from "@/shared/components/ui/input"
import { Textarea } from "@/shared/components/ui/textarea"
import { type BloqueDetalleResponse, contenidoVideoSchema } from "@nexott-learn/shared-types"
import { useRef, useState } from "react"
import { tipoBloqueMeta } from "../bloque-tipo-meta"
import { IndicadorGuardado } from "./shared/indicador-guardado"
import { useAutoGuardarBloque } from "./shared/use-auto-guardar-bloque"

interface EditorVideoProps {
  readonly bloque: BloqueDetalleResponse
}

type Proveedor = "youtube" | "vimeo" | "loom" | "otro"

interface Borrador {
  readonly url: string
  readonly proveedor: Proveedor
  readonly marcarAlPorcentaje: number
  readonly notas: string
}

function detectarProveedor(url: string): Proveedor {
  const u = url.toLowerCase()
  if (u.includes("youtube.com") || u.includes("youtu.be")) {
    return "youtube"
  }
  if (u.includes("vimeo.com")) {
    return "vimeo"
  }
  if (u.includes("loom.com")) {
    return "loom"
  }
  return "otro"
}

const RE_YOUTUBE_ID = /(?:v=|youtu\.be\/)([\w-]{11})/
const RE_VIMEO_ID = /vimeo\.com\/(\d+)/
const RE_LOOM_ID = /loom\.com\/share\/(\w+)/

function urlEmbed(url: string, proveedor: Proveedor): string | null {
  if (proveedor === "youtube") {
    const match = url.match(RE_YOUTUBE_ID)
    return match ? `https://www.youtube.com/embed/${match[1]}` : null
  }
  if (proveedor === "vimeo") {
    const match = url.match(RE_VIMEO_ID)
    return match ? `https://player.vimeo.com/video/${match[1]}` : null
  }
  if (proveedor === "loom") {
    const match = url.match(RE_LOOM_ID)
    return match ? `https://www.loom.com/embed/${match[1]}` : null
  }
  return null
}

/**
 * Hidrata el borrador desde `bloque.contenido`. Si el JSON no cumple el
 * contrato oficial (`contenidoVideoSchema`) cae al estado canonico:
 * proveedor `otro`, URL/notas vacias, marcador al 90% (mismo default
 * que usaba la implementacion previa).
 */
function leerInicial(contenido: Record<string, unknown> | null): Borrador {
  const result = contenidoVideoSchema.safeParse(contenido)
  if (result.success) {
    return result.data
  }
  return { url: "", proveedor: "otro", marcarAlPorcentaje: 90, notas: "" }
}

export function EditorVideo({ bloque }: EditorVideoProps) {
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

  const embed = urlEmbed(datos.url, datos.proveedor)

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="nx-eyebrow text-text-tertiary">Bloque · {meta.etiqueta}</span>
          <h2 className="text-h2 text-text-primary">Vídeo embebido</h2>
          <p className="max-w-xl text-body-sm text-text-secondary">
            Inserta un vídeo de YouTube, Vimeo o Loom mediante su URL pública. El participante lo
            verá embebido sin salir del módulo.
          </p>
        </div>
        <IndicadorGuardado estado={auto.estado} />
      </header>

      <Field label="URL del vídeo" hint="YouTube, Vimeo o Loom. Pega el enlace público.">
        {(attrs) => (
          <Input
            {...attrs}
            type="url"
            value={datos.url}
            placeholder="https://www.youtube.com/watch?v=…"
            onChange={(e) => {
              const url = e.target.value
              actualizar({ url, proveedor: detectarProveedor(url) })
            }}
          />
        )}
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Proveedor detectado">
          {() => (
            <div className="inline-flex h-10 items-center rounded-md border border-border bg-subtle px-3 text-body-sm text-text-secondary capitalize">
              {datos.proveedor}
            </div>
          )}
        </Field>
        <Field
          label="Marcar como visto al alcanzar"
          hint="Porcentaje del vídeo que el participante debe ver para completar el bloque."
        >
          {(attrs) => (
            <div className="flex items-center gap-2">
              <Input
                {...attrs}
                type="number"
                min={1}
                max={100}
                value={datos.marcarAlPorcentaje}
                onChange={(e) =>
                  actualizar({
                    marcarAlPorcentaje: Math.min(100, Math.max(1, Number(e.target.value) || 90)),
                  })
                }
              />
              <span className="text-body-sm text-text-tertiary">%</span>
            </div>
          )}
        </Field>
      </div>

      <Field label="Notas para el participante" hint="Opcional. Aparece debajo del vídeo.">
        {(attrs) => (
          <Textarea
            {...attrs}
            rows={3}
            value={datos.notas}
            onChange={(e) => actualizar({ notas: e.target.value })}
            placeholder="Ej. Atención al minuto 5 cuando muestra collect()…"
          />
        )}
      </Field>

      <div className="flex flex-col gap-2">
        <span className="nx-eyebrow text-text-tertiary">Vista previa</span>
        {embed ? (
          <div className="aspect-video w-full overflow-hidden rounded-lg border border-border bg-canvas">
            <iframe
              key={embed}
              src={embed}
              title={`Vídeo: ${datos.url}`}
              allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen={true}
              className="h-full w-full border-0"
            />
          </div>
        ) : (
          <div className="flex aspect-video w-full items-center justify-center rounded-lg border border-border border-dashed bg-subtle text-body-sm text-text-tertiary">
            {datos.url
              ? "No se pudo extraer el ID del vídeo de esta URL."
              : "Pega una URL para ver la previa aquí."}
          </div>
        )}
      </div>
    </div>
  )
}
