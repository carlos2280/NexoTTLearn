import { Button } from "@/shared/components/ui/button"
import { Play, X } from "lucide-react"
import type { Progreso } from "./retos.types"

interface BarraValidacionProps {
  readonly totalRetos: number
  readonly progreso: Progreso | null
  readonly deteniendo: boolean
  /** Qué anunciar al terminar. Sin esto el lector oye "…90%" y luego silencio. */
  readonly mensajeFinal: string
  readonly onValidarTodos: () => void
  readonly onDetener: () => void
}

/**
 * Cabecera del panel: dispara la corrida completa y muestra su avance.
 *
 * Es UN solo botón que alterna validar/detener y nunca se deshabilita. Con dos
 * botones, el de "Validar" se deshabilitaba justo tras recibir el clic y el
 * foco del teclado caía al `<body>` — al inicio del documento, justo cuando
 * arranca una operación de minutos.
 */
export function BarraValidacion({
  totalRetos,
  progreso,
  deteniendo,
  mensajeFinal,
  onValidarTodos,
  onDetener,
}: BarraValidacionProps) {
  const corriendo = progreso !== null
  const porcentaje = progreso ? Math.round((progreso.hechos / progreso.total) * 100) : 0

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col">
          <span className="font-medium text-body text-text-primary">
            {totalRetos} {totalRetos === 1 ? "reto de código" : "retos de código"}
          </span>
          <span className="text-caption text-text-tertiary">
            Corre la solución de referencia de cada uno contra sus propias pruebas. No modifica
            notas ni progreso de nadie.
          </span>
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="shrink-0"
          onClick={corriendo ? onDetener : onValidarTodos}
        >
          {corriendo ? (
            <X className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden={true} />
          ) : (
            <Play className="h-3.5 w-3.5 fill-current" aria-hidden={true} />
          )}
          {etiquetaBoton(corriendo, deteniendo)}
        </Button>
      </div>

      {progreso ? (
        // La barra es decoración: quien no la ve recibe el avance por la región
        // live de abajo. Marcarla `progressbar` obligaría a hacerla enfocable
        // (a11y de Biome) y añadiría una parada de tabulador que no lleva a
        // ninguna acción.
        <div className="flex items-center gap-3" aria-hidden={true}>
          <div className="h-1.5 flex-1 overflow-hidden rounded-pill bg-subtle">
            <div
              className="h-full rounded-pill bg-accent transition-[width] duration-fast ease-default"
              style={{ width: `${porcentaje}%` }}
            />
          </div>
          <span className="tabular shrink-0 text-caption text-text-tertiary">
            {progreso.hechos}/{progreso.total}
          </span>
        </div>
      ) : null}

      {/* Se anuncia por decenas, no por reto: una corrida son ~92 retos y
          narrarlos uno a uno haría el lector de pantalla inservible. Al
          terminar cambia al resultado, para no dejar la frase a medias. */}
      <span aria-live="polite" className="sr-only">
        {progreso
          ? `Validando retos, ${Math.floor(porcentaje / 10) * 10}% completado.`
          : mensajeFinal}
      </span>
    </div>
  )
}

function etiquetaBoton(corriendo: boolean, deteniendo: boolean): string {
  if (!corriendo) {
    return "Validar todos"
  }
  // El reto en curso puede tardar; sin esta señal el botón parece no responder.
  return deteniendo ? "Deteniendo…" : "Detener"
}
