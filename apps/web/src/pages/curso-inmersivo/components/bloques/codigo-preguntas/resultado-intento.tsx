import { cn } from "@/shared/lib/cn"
import type { IntentoBloqueResponse } from "@nexott-learn/shared-types"
import { AlertTriangle, CheckCircle2, type LucideIcon, RotateCcw } from "lucide-react"
import { type EstadoVeredicto, type Veredicto, evaluarVeredicto } from "./evaluar-veredicto"

interface ResultadoIntentoProps {
  /** `null` mientras no se haya enviado ningún intento. El componente se monta
   *  igual (región live persistente), solo cambia su contenido. */
  readonly intento: IntentoBloqueResponse | null
  readonly notaAprobado: number
  /**
   * Mejor intento *previo* al actual (antes de enviar). Permite distinguir la
   * primera vez que se alcanza el 100% de un re-envío ya pleno.
   */
  readonly mejorPrevio: IntentoBloqueResponse | null
  /** Hay una pista visible en la consola (algún oculto falló con descripción).
   *  El mensaje parcial solo menciona la pista cuando esto es `true`. Opcional:
   *  los bloques sin concepto de pista (p. ej. SQL_EJERCICIO) lo omiten. */
  readonly hayPistaOculta?: boolean
}

export function ResultadoIntento({
  intento,
  notaAprobado,
  mejorPrevio,
  hayPistaOculta = false,
}: ResultadoIntentoProps) {
  const veredicto = intento
    ? evaluarVeredicto({
        nota: intento.nota,
        notaAprobado,
        notaPrevia: mejorPrevio?.nota ?? null,
        hayPistaOculta,
      })
    : null
  return (
    <>
      {/* Región live persistente: se monta SIEMPRE (aunque no haya intento) y su
          texto pasa de "" al veredicto → anuncio fiable. Una región `status`
          insertada en el DOM ya poblada suele NO anunciarse (JAWS/NVDA). WCAG 2.2 §4.1.3. */}
      <output className="sr-only">{veredicto?.mensaje ?? ""}</output>
      {veredicto ? <BannerVeredicto veredicto={veredicto} /> : null}
    </>
  )
}

interface EstiloEstado {
  readonly contenedor: string
  readonly texto: string
  readonly colorIcono: string
  readonly icono: LucideIcon
}

/**
 * Verde solo para el 100% (`pleno`). Parcial y reprobado comparten el ámbar
 * ("aún no está redondo"): el parcial aprobó el avance pero un oculto sigue
 * fallando, así que su color NO debe leerse como "todo perfecto".
 */
const ESTILO_ESTADO: Record<EstadoVeredicto, EstiloEstado> = {
  pleno: {
    contenedor: "border-success/30 bg-success-soft",
    texto: "text-success-on-soft",
    colorIcono: "text-success",
    icono: CheckCircle2,
  },
  parcial: {
    contenedor: "border-warmth/30 bg-warning-soft",
    texto: "text-warning-on-soft",
    colorIcono: "text-warning-on-soft",
    icono: AlertTriangle,
  },
  reprobado: {
    contenedor: "border-warmth/30 bg-warning-soft",
    texto: "text-warning-on-soft",
    colorIcono: "text-warning-on-soft",
    icono: RotateCcw,
  },
}

function BannerVeredicto({ veredicto }: { readonly veredicto: Veredicto }) {
  const estilo = ESTILO_ESTADO[veredicto.estado]
  const Icono = estilo.icono
  return (
    <aside
      className={cn(
        "flex items-start gap-3 rounded-2xl border p-4",
        estilo.contenedor,
        veredicto.celebrar && "nx-aurora-pulse",
      )}
    >
      <Icono className={cn("mt-0.5 h-5 w-5 shrink-0", estilo.colorIcono)} aria-hidden={true} />
      <p className={cn("text-body-sm", estilo.texto)}>{veredicto.mensaje}</p>
    </aside>
  )
}
