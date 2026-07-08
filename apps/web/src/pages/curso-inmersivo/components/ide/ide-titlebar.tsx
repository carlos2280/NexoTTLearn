import { NexoMark } from "@/shared/components/nexo-mark"
import { Button } from "@/shared/components/ui/button"
import { RUTAS } from "@/shared/constants/rutas"
import { useTheme } from "@/shared/hooks/use-theme"
import { cn } from "@/shared/lib/cn"
import type { AreaTagEmbed, EtiquetaCualitativa } from "@nexott-learn/shared-types"
import { ChevronLeft, MoonStar, Sun } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"

interface IdeTitlebarProps {
  readonly cursoId: string
  readonly cursoTitulo: string
  readonly clienteNombre: string | null
  readonly areaPrincipal: AreaTagEmbed | null
  readonly estaCerrado: boolean
  readonly etiquetaCualitativaFinal: EtiquetaCualitativa | null
  /** Modo focus de la entrevista IA: atenua el chrome para dar foco al chat. */
  readonly atenuado?: boolean
}

const COLOR_ESTADO_CIERRE: Record<EtiquetaCualitativa, string> = {
  excelencia: "var(--color-state-apto)",
  solido: "var(--color-state-solido)",
  enDesarrollo: "var(--color-state-en-desarrollo)",
  noCumple: "var(--color-state-no-apto)",
}

const TEXTO_ESTADO_CIERRE: Record<EtiquetaCualitativa, string> = {
  excelencia: "Excelencia",
  solido: "Solido",
  enDesarrollo: "En desarrollo",
  noCumple: "Por reforzar",
}

/**
 * Barra de título del IDE inmerso NexoTT Learn. Reencuadra el topbar del curso
 * como el "title bar" de un IDE: identidad de marca + workspace (el curso) a la
 * izquierda, avance + tema a la derecha. Todo con tokens semánticos → dark/light
 * sale gratis. Sin aurora: el chrome es capa acción (índigo), no marca.
 */
export function IdeTitlebar({
  cursoId,
  cursoTitulo,
  clienteNombre,
  areaPrincipal,
  estaCerrado,
  etiquetaCualitativaFinal,
  atenuado,
}: IdeTitlebarProps) {
  const navigate = useNavigate()
  const { temaEfectivo, toggle } = useTheme()
  return (
    <header
      className={cn(
        "flex items-center gap-3 border-border border-b bg-subtle px-4 py-2.5",
        "transition-[opacity,filter] duration-cinematic ease-default",
        atenuado ? "pointer-events-none opacity-15 blur-[2px]" : "",
      )}
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
      <span aria-hidden={true} className="shrink-0">
        <NexoMark tono="acento" tamano={22} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <EyebrowContexto
          clienteNombre={clienteNombre}
          area={areaPrincipal}
          estaCerrado={estaCerrado}
          etiquetaCualitativaFinal={etiquetaCualitativaFinal}
        />
        <h1 className="truncate font-code text-body-sm text-text-primary leading-tight tracking-tight">
          {cursoTitulo}
        </h1>
      </div>
      {estaCerrado ? (
        <Button variant="ghost" size="sm" asChild={true}>
          <Link to={RUTAS.participante.cursoCerrado(cursoId)}>Ver veredicto →</Link>
        </Button>
      ) : null}
      <button
        type="button"
        onClick={toggle}
        aria-label={temaEfectivo === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
        className={cn(
          "inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-text-secondary",
          "transition-colors duration-base ease-default hover:border-accent hover:text-accent",
        )}
      >
        {temaEfectivo === "dark" ? (
          <Sun className="h-4 w-4" aria-hidden={true} />
        ) : (
          <MoonStar className="h-4 w-4" aria-hidden={true} />
        )}
      </button>
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
    <span className="flex items-center gap-1.5 truncate font-code text-[10px] uppercase tracking-wider">
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
