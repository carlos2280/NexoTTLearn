import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import { RUTAS } from "@/shared/constants/rutas"
import { ChevronDown, ChevronRight, ExternalLink } from "lucide-react"
import { useId, useState } from "react"
import { BotonCopiar } from "./boton-copiar"
import { type DetalleEstado, detalleDeEstado, etiquetaDeEstado } from "./estado-reto"
import { construirAvisoReto } from "./reporte-reto"
import type { EstadoReto, RetoDelCurso } from "./retos.types"

interface FilaRetoProps {
  readonly reto: RetoDelCurso
  readonly estado: EstadoReto
  readonly cursoTitulo: string
  readonly modulo: { readonly id: string; readonly titulo: string }
}

/**
 * Una fila = un reto. El chip lleva texto además de color (WCAG 1.4.1). Solo
 * los estados con algo que contar se despliegan; un "Sin problemas" no esconde
 * nada que leer, así que ni siquiera es un botón.
 */
export function FilaReto({ reto, estado, cursoTitulo, modulo }: FilaRetoProps) {
  const [abierta, setAbierta] = useState(false)
  const idDetalle = useId()
  const etiqueta = etiquetaDeEstado(estado)
  const detalle = detalleDeEstado(estado)

  if (!detalle) {
    return (
      <li className="flex items-center gap-3 border-border border-t px-3 py-2">
        <TituloReto reto={reto} className="flex-1" />
        <ChipEstado etiqueta={etiqueta.texto} tono={etiqueta.tono} />
      </li>
    )
  }

  return (
    <li className="border-border border-t">
      <button
        type="button"
        onClick={() => setAbierta((v) => !v)}
        aria-expanded={abierta}
        aria-controls={idDetalle}
        className="flex min-h-9 w-full items-center gap-2 px-3 py-2 text-left transition-colors duration-fast ease-default hover:bg-subtle/40"
      >
        <span className="shrink-0 text-text-tertiary">
          {abierta ? (
            <ChevronDown className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
          ) : (
            <ChevronRight className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
          )}
        </span>
        <TituloReto reto={reto} className="flex-1" />
        <ChipEstado etiqueta={etiqueta.texto} tono={etiqueta.tono} />
      </button>
      {abierta ? (
        <DetalleFila
          id={idDetalle}
          detalle={detalle}
          moduloId={modulo.id}
          aviso={construirAvisoReto(
            {
              cursoTitulo,
              moduloTitulo: modulo.titulo,
              seccionTitulo: reto.seccionTitulo,
              bloqueOrden: reto.orden,
            },
            estado,
          )}
        />
      ) : null}
    </li>
  )
}

/**
 * El nº de bloque va delante porque una sección puede tener varios retos: sin
 * él, dos filas de la misma sección salen idénticas y no se sabe cuál está en
 * rojo (ni cuál mencionar en el aviso).
 */
function TituloReto({
  reto,
  className,
}: { readonly reto: RetoDelCurso; readonly className?: string }) {
  return (
    <span className={`truncate text-body-sm text-text-secondary ${className ?? ""}`}>
      <span className="tabular text-text-tertiary">#{reto.orden}</span> {reto.seccionTitulo}
    </span>
  )
}

interface DetalleFilaProps {
  readonly id: string
  readonly detalle: DetalleEstado
  readonly moduloId: string
  readonly aviso: string
}

function DetalleFila({ id, detalle, moduloId, aviso }: DetalleFilaProps) {
  return (
    <div id={id} className="flex flex-col gap-3 px-3 pb-3 pl-9">
      <Parrafo eyebrow="Qué pasó" texto={detalle.quePaso} />
      <Parrafo eyebrow="Qué significa" texto={detalle.queSignifica} />
      <Parrafo eyebrow="Qué hacer" texto={detalle.queHacer} />
      <div className="flex flex-wrap items-center gap-2">
        <BotonCopiar texto={aviso} etiqueta="Copiar aviso" etiquetaCopiado="Copiado" />
        <Button variant="ghost" size="sm" asChild={true}>
          {/* En pestaña nueva: irse a editar no puede costar la corrida en curso. */}
          <a
            href={RUTAS.admin.catalogoModuloDetalle(moduloId)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden={true} />
            Abrir el módulo en el editor
            <span className="sr-only"> (se abre en una pestaña nueva)</span>
          </a>
        </Button>
      </div>
    </div>
  )
}

function Parrafo({ eyebrow, texto }: { readonly eyebrow: string; readonly texto: string }) {
  return (
    <p className="flex flex-col gap-0.5">
      <span className="nx-eyebrow text-text-tertiary">{eyebrow}</span>
      <span className="text-caption text-text-secondary">{texto}</span>
    </p>
  )
}

interface ChipEstadoProps {
  readonly etiqueta: string
  readonly tono: "neutro" | "success" | "warning" | "danger"
}

function ChipEstado({ etiqueta, tono }: ChipEstadoProps) {
  return (
    <Badge variant="soft" tono={tono} className="h-7 shrink-0 items-center">
      {etiqueta}
    </Badge>
  )
}
