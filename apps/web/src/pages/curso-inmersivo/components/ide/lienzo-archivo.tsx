import type { ReactNode } from "react"

/** Alto decorativo de cada línea del gutter en px (ritmo del riel de números). */
const ALTO_LINEA_GUTTER = 28

/**
 * Pool fijo de números que dibuja el gutter. No se mide la altura del contenido:
 * el gutter es una capa absoluta anclada con `inset-y`, así que su alto ya
 * coincide por CSS con el del contenido y el `overflow-hidden` recorta los
 * números sobrantes. Con esto la numeración NUNCA se corta (el bug de medir la
 * altura desaparece) mientras la lección no pase de ~600 líneas visuales.
 */
const MAX_LINEAS_GUTTER = 600

interface LienzoArchivoProps {
  readonly children: ReactNode
}

/**
 * Marco "un archivo" del canvas inmersivo (metáfora IDE elegida por Carlos):
 * un gutter continuo de números de línea a la izquierda —decorativo, estilo
 * editor— y el contenido de la lección a la derecha. La secuencia de bloques
 * (prosa, tips, código, quiz) se lee como un único archivo abierto.
 *
 * El gutter es una **capa absoluta** anclada a la altura del contenido
 * (`inset-y-10`, que casa con el `py-10` del contenedor) y recortada: su alto lo
 * resuelve el layout, no una medición JS, por eso los números cubren siempre
 * exactamente el contenido. El color y el borde salen de tokens; en `.nx-ide`
 * dark el gris es el `--color-syntax-comment` Monokai.
 */
export function LienzoArchivo({ children }: LienzoArchivoProps) {
  const numeros = Array.from({ length: MAX_LINEAS_GUTTER }, (_, i) => `${i + 1}`).join("\n")

  return (
    <div className="relative min-h-full py-10 pr-8 pl-4">
      <div
        aria-hidden={true}
        className="pointer-events-none absolute inset-y-10 left-4 w-11 select-none overflow-hidden border-border border-r"
      >
        <pre
          className="m-0 pr-3 text-right font-code text-[color:var(--color-syntax-comment)] text-body-sm"
          style={{ lineHeight: `${ALTO_LINEA_GUTTER}px` }}
        >
          {numeros}
        </pre>
      </div>
      <div className="min-w-0 pl-16">{children}</div>
    </div>
  )
}
