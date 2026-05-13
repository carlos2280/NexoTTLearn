import { cn } from "@/shared/lib/cn"
import type { BloqueDetalleResponse } from "@nexott-learn/shared-types"
import { CheckCircle2, Info, type LucideIcon, TriangleAlert } from "lucide-react"
import { useRef, useState } from "react"
import { tipoBloqueMeta } from "../bloque-tipo-meta"
import { IndicadorGuardado } from "./shared/indicador-guardado"
import { TiptapEditor } from "./shared/tiptap-editor"
import { extensionesMinimas } from "./shared/tiptap-extensiones"
import { useAutoGuardarBloque } from "./shared/use-auto-guardar-bloque"

interface EditorTipProps {
  readonly bloque: BloqueDetalleResponse
}

type VarianteTip = "info" | "warning" | "exito"

const VARIANTES: Record<
  VarianteTip,
  {
    readonly etiqueta: string
    readonly icono: LucideIcon
    readonly preview: string
  }
> = {
  info: {
    etiqueta: "Info",
    icono: Info,
    preview: "border-l-4 border-l-info bg-info-soft text-info-on-soft",
  },
  warning: {
    etiqueta: "Aviso",
    icono: TriangleAlert,
    preview: "border-l-4 border-l-warning bg-warning-soft text-warning-on-soft",
  },
  exito: {
    etiqueta: "Éxito",
    icono: CheckCircle2,
    preview: "border-l-4 border-l-success bg-success-soft text-success-on-soft",
  },
}

interface Borrador {
  readonly variante: VarianteTip
  readonly html: string
}

function leerInicial(contenido: Record<string, unknown> | null): Borrador {
  if (!contenido) {
    return { variante: "info", html: "" }
  }
  const variante =
    contenido.variante === "warning" || contenido.variante === "exito"
      ? (contenido.variante as VarianteTip)
      : "info"
  const html = typeof contenido.html === "string" ? contenido.html : ""
  return { variante, html }
}

export function EditorTip({ bloque }: EditorTipProps) {
  const meta = tipoBloqueMeta(bloque.tipo)
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
    <div className="flex flex-col gap-4">
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="nx-eyebrow text-text-tertiary">Bloque · {meta.etiqueta}</span>
          <h2 className="text-h2 text-text-primary">Llamada al margen</h2>
          <p className="max-w-xl text-body-sm text-text-secondary">
            Texto breve destacado para enfatizar una idea, avisar de un riesgo o celebrar un logro.
            Soporta formato básico y enlaces.
          </p>
        </div>
        <IndicadorGuardado estado={auto.estado} />
      </header>

      <div className="flex items-center gap-2" role="radiogroup" aria-label="Variante">
        {(Object.keys(VARIANTES) as VarianteTip[]).map((v) => {
          const VIcono = VARIANTES[v].icono
          const activo = v === variante
          return (
            <label
              key={v}
              className={cn(
                "inline-flex cursor-pointer items-center gap-1.5 rounded-pill border px-3 py-1.5 text-caption transition-colors",
                activo
                  ? "border-accent bg-accent-soft text-accent-on-soft"
                  : "border-border bg-surface text-text-secondary hover:bg-subtle",
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
              {VARIANTES[v].etiqueta}
            </label>
          )
        })}
      </div>

      <div className={cn("rounded-md px-4 py-3", varianteActual.preview)}>
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
    </div>
  )
}
