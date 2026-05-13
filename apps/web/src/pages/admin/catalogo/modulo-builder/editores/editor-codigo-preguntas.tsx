import { Field } from "@/shared/components/ui/field"
import { Input } from "@/shared/components/ui/input"
import { Textarea } from "@/shared/components/ui/textarea"
import { cn } from "@/shared/lib/cn"
import type { BloqueDetalleResponse } from "@nexott-learn/shared-types"
import { useRef, useState } from "react"
import { tipoBloqueMeta } from "../bloque-tipo-meta"
import { CodigoTextarea } from "./shared/codigo-textarea"
import { IndicadorGuardado } from "./shared/indicador-guardado"
import { SelectLenguaje } from "./shared/select-lenguaje"
import { useAutoGuardarBloque } from "./shared/use-auto-guardar-bloque"

interface EditorCodigoPreguntasProps {
  readonly bloque: BloqueDetalleResponse
}

interface Borrador {
  readonly lenguaje: string
  readonly enunciado: string
  readonly esqueletoInicial: string
  readonly tiempoLimiteSeg: number
  readonly modoSimple: boolean
  readonly rubrica: string
}

function leerInicial(contenido: Record<string, unknown> | null): Borrador {
  return {
    lenguaje: typeof contenido?.lenguaje === "string" ? contenido.lenguaje : "typescript",
    enunciado: typeof contenido?.enunciado === "string" ? contenido.enunciado : "",
    esqueletoInicial:
      typeof contenido?.esqueletoInicial === "string" ? contenido.esqueletoInicial : "",
    tiempoLimiteSeg:
      typeof contenido?.tiempoLimiteSeg === "number" ? contenido.tiempoLimiteSeg : 300,
    modoSimple: typeof contenido?.modoSimple === "boolean" ? contenido.modoSimple : true,
    rubrica: typeof contenido?.rubrica === "string" ? contenido.rubrica : "",
  }
}

export function EditorCodigoPreguntas({ bloque }: EditorCodigoPreguntasProps) {
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
          <h2 className="text-h2 text-text-primary">Reto de código — enunciado</h2>
          <p className="max-w-xl text-body-sm text-text-secondary">
            Define el problema y el código inicial que verá el participante. Si activas modo simple,
            lo corriges tú manualmente. Si lo desactivas, añade un bloque <em>Tests del reto</em> a
            continuación para corrección automática.
          </p>
        </div>
        <IndicadorGuardado estado={auto.estado} />
      </header>

      <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Modo">
        {(
          [
            {
              id: true,
              etiqueta: "Modo simple",
              ayuda: "Corrección manual con rúbrica.",
            },
            {
              id: false,
              etiqueta: "Modo avanzado",
              ayuda: "Tests automáticos en un bloque hermano.",
            },
          ] as const
        ).map((m) => {
          const activo = datos.modoSimple === m.id
          return (
            <label
              key={String(m.id)}
              title={m.ayuda}
              className={cn(
                "cursor-pointer rounded-pill border px-3 py-1.5 text-caption transition-colors",
                activo
                  ? "border-accent bg-accent-soft text-accent-on-soft"
                  : "border-border bg-surface text-text-secondary hover:bg-subtle",
              )}
            >
              <input
                type="radio"
                name="codigo-modo"
                checked={activo}
                onChange={() => actualizar({ modoSimple: m.id })}
                className="sr-only"
              />
              {m.etiqueta}
            </label>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Lenguaje">
          {(attrs) => (
            <SelectLenguaje
              id={attrs.id}
              value={datos.lenguaje}
              onChange={(v) => actualizar({ lenguaje: v })}
            />
          )}
        </Field>
        <Field label="Tiempo límite de ejecución" hint="Solo aplica en modo avanzado.">
          {(attrs) => (
            <div className="flex items-center gap-2">
              <Input
                {...attrs}
                type="number"
                min={1}
                max={120}
                value={datos.tiempoLimiteSeg}
                onChange={(e) =>
                  actualizar({
                    tiempoLimiteSeg: Math.max(1, Number(e.target.value) || 300),
                  })
                }
              />
              <span className="text-body-sm text-text-tertiary">segundos</span>
            </div>
          )}
        </Field>
      </div>

      <Field label="Enunciado">
        {(attrs) => (
          <Textarea
            {...attrs}
            rows={4}
            value={datos.enunciado}
            onChange={(e) => actualizar({ enunciado: e.target.value })}
            placeholder="Implementa un método que reciba… y retorne…"
          />
        )}
      </Field>

      <Field
        label="Esqueleto inicial"
        hint="Lo que el participante ve al abrir. Usa Tab para indentar."
      >
        {(attrs) => (
          <CodigoTextarea
            id={attrs.id}
            value={datos.esqueletoInicial}
            onValueChange={(v) => actualizar({ esqueletoInicial: v })}
            rows={8}
            placeholder="// Firma del método aquí…"
          />
        )}
      </Field>

      {datos.modoSimple ? (
        <Field
          label="Rúbrica de evaluación"
          hint="Sólo la ves tú al corregir manualmente. Por bullets."
        >
          {(attrs) => (
            <Textarea
              {...attrs}
              rows={4}
              value={datos.rubrica}
              onChange={(e) => actualizar({ rubrica: e.target.value })}
              placeholder="- Solución correcta (50%)\n- Eficiencia justificada (30%)\n- Estilo (20%)"
            />
          )}
        </Field>
      ) : (
        <div className="rounded-md border border-info border-l-4 border-l-info bg-info-soft px-4 py-3 text-body-sm text-info-on-soft">
          En modo avanzado, añade un bloque <strong>Tests del reto</strong> en esta misma sección
          para definir los tests automáticos que evaluarán al participante.
        </div>
      )}
    </div>
  )
}
