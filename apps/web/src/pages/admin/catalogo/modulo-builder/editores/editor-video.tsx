import { Badge } from "@/shared/components/ui/badge"
import { Field } from "@/shared/components/ui/field"
import { Input } from "@/shared/components/ui/input"
import { Textarea } from "@/shared/components/ui/textarea"
import { type BloqueDetalleResponse, contenidoVideoSchema } from "@nexott-learn/shared-types"
import { useRef, useState } from "react"
import { EditorBloqueShell } from "./shared/editor-bloque-shell"
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

const ETIQUETA_PROVEEDOR: Record<Proveedor, string> = {
  youtube: "YouTube",
  vimeo: "Vimeo",
  loom: "Loom",
  otro: "Sin detectar",
}

function leerInicial(contenido: Record<string, unknown> | null): Borrador {
  const result = contenidoVideoSchema.safeParse(contenido)
  if (result.success) {
    return result.data
  }
  return { url: "", proveedor: "otro", marcarAlPorcentaje: 90, notas: "" }
}

export function EditorVideo({ bloque }: EditorVideoProps) {
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
  const proveedorEtiqueta = ETIQUETA_PROVEEDOR[datos.proveedor]

  return (
    <EditorBloqueShell
      bloque={bloque}
      titulo="Vídeo embebido"
      descripcion="Inserta un vídeo de YouTube, Vimeo o Loom mediante su URL pública. El participante lo verá embebido sin salir del módulo."
      estadoGuardado={auto.estado}
    >
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
        <div className="flex flex-col gap-1.5">
          <span className="nx-eyebrow text-text-tertiary">Proveedor detectado</span>
          <div>
            <Badge tono={datos.proveedor === "otro" ? "neutro" : "acento"} conPunto={true}>
              {proveedorEtiqueta}
            </Badge>
          </div>
        </div>
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
              <span className="tabular font-mono text-body-sm text-text-tertiary">%</span>
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
          <div className="aspect-video w-full overflow-hidden rounded-lg border border-border bg-canvas shadow-xs">
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
          <div className="flex aspect-video w-full items-center justify-center rounded-lg border border-border bg-subtle/60 text-body-sm text-text-tertiary">
            {datos.url
              ? "No se pudo extraer el ID del vídeo de esta URL."
              : "Pega una URL para ver la previa aquí."}
          </div>
        )}
      </div>
    </EditorBloqueShell>
  )
}
