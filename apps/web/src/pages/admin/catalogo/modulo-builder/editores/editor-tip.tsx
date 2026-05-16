import { cn } from "@/shared/lib/cn"
import { type BloqueDetalleResponse, contenidoTipSchema } from "@nexott-learn/shared-types"
import { CheckCircle2, Info, type LucideIcon, TriangleAlert } from "lucide-react"
import { useRef, useState } from "react"
import { EditorBloqueShell } from "./shared/editor-bloque-shell"
import { TiptapEditor } from "./shared/tiptap-editor"
import { extensionesMinimas } from "./shared/tiptap-extensiones"
import { useAutoGuardarBloque } from "./shared/use-auto-guardar-bloque"

interface EditorTipProps {
  readonly bloque: BloqueDetalleResponse
}

type VarianteTip = "info" | "warning" | "exito"

interface VarianteMeta {
  readonly etiqueta: string
  readonly icono: LucideIcon
  /** Clases del callout en preview. */
  readonly preview: string
  /** Clases del chip cuando ESTÁ activo (refleja el tono semántico). */
  readonly chipActivo: string
}

const VARIANTES: Record<VarianteTip, VarianteMeta> = {
  info: {
    etiqueta: "Info",
    icono: Info,
    preview: "border-l-4 border-l-info bg-info-soft text-info-on-soft",
    chipActivo: "border-info bg-info-soft text-info-on-soft",
  },
  warning: {
    etiqueta: "Aviso",
    icono: TriangleAlert,
    preview: "border-l-4 border-l-warning bg-warning-soft text-warning-on-soft",
    chipActivo: "border-warning bg-warning-soft text-warning-on-soft",
  },
  exito: {
    etiqueta: "Éxito",
    icono: CheckCircle2,
    preview: "border-l-4 border-l-success bg-success-soft text-success-on-soft",
    chipActivo: "border-success bg-success-soft text-success-on-soft",
  },
}

interface Borrador {
  readonly variante: VarianteTip
  readonly html: string
}

function leerInicial(contenido: Record<string, unknown> | null): Borrador {
  const result = contenidoTipSchema.safeParse(contenido)
  if (result.success) {
    return result.data
  }
  return { variante: "info", html: "" }
}

export function EditorTip({ bloque }: EditorTipProps) {
  const inicial = leerInicial(bloque.contenido)
  const [variante, setVariante] = useState<VarianteTip>(inicial.variante)
  const borradorRef = useRef<Borrador>(inicial)

  const auto = useAutoGuardarBloque({
    bloqueId: bloque.id,
    construirContenido: () => {
      const { html } = borradorRef.current
      return { variante: borradorRef.current.variante, html }
    },
  })

  function cambiarVariante(nueva: VarianteTip) {
    setVariante(nueva)
    borradorRef.current = { ...borradorRef.current, variante: nueva }
    auto.marcarSucio()
  }

  const varianteActual = VARIANTES[variante]
  const IconoVariante = varianteActual.icono

  return (
    <EditorBloqueShell
      bloque={bloque}
      titulo="Llamada al margen"
      descripcion="Texto breve destacado para enfatizar una idea, avisar de un riesgo o celebrar un logro. Soporta formato básico y enlaces."
      estadoGuardado={auto.estado}
    >
      <div className="flex items-center gap-2" role="radiogroup" aria-label="Variante">
        {(Object.keys(VARIANTES) as VarianteTip[]).map((v) => {
          const meta = VARIANTES[v]
          const VIcono = meta.icono
          const activo = v === variante
          return (
            <label
              key={v}
              className={cn(
                "inline-flex cursor-pointer items-center gap-1.5 rounded-pill border px-3 py-1.5 text-caption",
                "transition-[background-color,border-color,color] duration-fast ease-default",
                activo
                  ? meta.chipActivo
                  : "border-border bg-surface text-text-secondary hover:bg-subtle/60",
              )}
            >
              <input
                type="radio"
                name="tip-variante"
                checked={activo}
                onChange={() => cambiarVariante(v)}
                className="sr-only"
              />
              <VIcono className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden={true} />
              {meta.etiqueta}
            </label>
          )
        })}
      </div>

      <div className={cn("rounded-lg px-4 py-3", varianteActual.preview)}>
        <div className="mb-1 flex items-center gap-1.5 font-medium text-caption">
          <IconoVariante className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden={true} />
          {varianteActual.etiqueta}
        </div>
        <TiptapEditor
          key={bloque.id}
          htmlInicial={inicial.html}
          extensiones={extensionesMinimas("Escribe el contenido del tip…")}
          variante="minima"
          altoMin="80px"
          onCambio={(html) => {
            borradorRef.current = { ...borradorRef.current, html }
            auto.marcarSucio()
          }}
        />
      </div>
    </EditorBloqueShell>
  )
}
