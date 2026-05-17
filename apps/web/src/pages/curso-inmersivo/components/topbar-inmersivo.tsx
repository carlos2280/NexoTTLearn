import { Button } from "@/shared/components/ui/button"
import { RUTAS } from "@/shared/constants/rutas"
import type { AreaTagEmbed, EtiquetaCualitativa } from "@nexott-learn/shared-types"
import { ChevronLeft } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { BarraAvanceMini } from "./barra-avance-mini"

interface TopbarInmersivoProps {
  readonly cursoId: string
  readonly cursoTitulo: string
  readonly clienteNombre: string | null
  readonly areaPrincipal: AreaTagEmbed | null
  /** `null` cuando no aplica (modo preview, sin asignacion). */
  readonly porcentajeAvance: number | null
  readonly estaCerrado: boolean
  readonly etiquetaCualitativaFinal: EtiquetaCualitativa | null
}

const COLOR_ESTADO_CIERRE: Record<EtiquetaCualitativa, string> = {
  excelencia: "var(--color-state-apto)",
  solido: "var(--color-state-solido)",
  enDesarrollo: "var(--color-state-en-desarrollo)",
  noCumple: "var(--color-state-no-apto)",
}

// Eyebrow del cierre en el inmersivo: solo la cualitativa humanizada en color
// del estado. El "No apto / Apto" no aparece — el color comunica, y el sello
// binario se vive UNA vez en la ceremonia, no en cada visita posterior.
const TEXTO_ESTADO_CIERRE: Record<EtiquetaCualitativa, string> = {
  excelencia: "Excelencia",
  solido: "Solido",
  enDesarrollo: "En desarrollo",
  noCumple: "Por reforzar",
}

/**
 * Topbar minimal del modo inmersivo. Si el curso está cerrado, el eyebrow
 * añade " · {estado}" en color del estado y la barra de avance se reemplaza
 * por el link "Ver veredicto →".
 */
export function TopbarInmersivo({
  cursoId,
  cursoTitulo,
  clienteNombre,
  areaPrincipal,
  porcentajeAvance,
  estaCerrado,
  etiquetaCualitativaFinal,
}: TopbarInmersivoProps) {
  const navigate = useNavigate()
  return (
    <header
      className="flex items-center gap-4 border-border border-b bg-surface px-6 py-3"
      style={{ boxShadow: "var(--shadow-sm)" }}
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(RUTAS.bandeja)}
        aria-label="Volver a la bandeja"
      >
        <ChevronLeft className="mr-1 h-4 w-4" aria-hidden={true} /> Volver
      </Button>
      <span aria-hidden={true} className="h-5 w-px bg-border" />
      <div className="flex min-w-0 flex-1 flex-col">
        <EyebrowContexto
          clienteNombre={clienteNombre}
          area={areaPrincipal}
          estaCerrado={estaCerrado}
          etiquetaCualitativaFinal={etiquetaCualitativaFinal}
        />
        <h1 className="truncate text-body-lg text-text-primary leading-tight">{cursoTitulo}</h1>
      </div>
      {estaCerrado ? (
        <Button variant="ghost" size="sm" asChild={true}>
          <Link to={RUTAS.participante.cursoCerrado(cursoId)}>Ver veredicto →</Link>
        </Button>
      ) : porcentajeAvance !== null ? (
        <BarraAvanceMini porcentaje={porcentajeAvance} />
      ) : null}
    </header>
  )
}

interface EyebrowContextoProps {
  readonly clienteNombre: string | null
  readonly area: AreaTagEmbed | null
  readonly estaCerrado: boolean
  readonly etiquetaCualitativaFinal: EtiquetaCualitativa | null
}

function EyebrowContexto({
  clienteNombre,
  area,
  estaCerrado,
  etiquetaCualitativaFinal,
}: EyebrowContextoProps) {
  if (!(clienteNombre || area || estaCerrado)) {
    return null
  }
  return (
    <span className="flex items-center gap-1.5 truncate font-mono text-[10px] uppercase tracking-wider">
      {clienteNombre ? <span className="text-text-tertiary">{clienteNombre}</span> : null}
      {clienteNombre && area ? <SepEyebrow /> : null}
      {area ? (
        <span
          className="font-semibold"
          style={{ color: `var(--color-area-${area.codigo}-on-soft)` }}
        >
          {area.nombre}
        </span>
      ) : null}
      {estaCerrado && etiquetaCualitativaFinal ? (
        <>
          {clienteNombre || area ? <SepEyebrow /> : null}
          <span className="text-text-tertiary">Cerrado</span>
          <SepEyebrow />
          <span
            className="font-semibold"
            style={{ color: COLOR_ESTADO_CIERRE[etiquetaCualitativaFinal] }}
          >
            {TEXTO_ESTADO_CIERRE[etiquetaCualitativaFinal]}
          </span>
        </>
      ) : null}
    </span>
  )
}

function SepEyebrow() {
  return (
    <span aria-hidden={true} className="text-text-tertiary">
      ·
    </span>
  )
}
