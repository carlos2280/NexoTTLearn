import type { ReactNode } from "react"

/** Alto decorativo de cada línea del gutter en px (ritmo del riel de números). */
const ALTO_LINEA_GUTTER = 28

/**
 * Pool fijo de números que dibuja el gutter. No se mide la altura del contenido:
 * el gutter es una capa absoluta anclada con `inset-y`, así que su alto lo
 * resuelve el layout (= alto del contenedor, que crece con el contenido) y el
 * `overflow-hidden` recorta los números sobrantes. 1200 líneas * 28px ≈ 33k px
 * de holgura: cubre lecciones muy largas sin que la numeración se corte.
 */
const MAX_LINEAS_GUTTER = 1200

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
 * (`inset-y-10`, que casa con el `py-10` del contenedor) y recortada. El
 * contenedor NO usa `min-h-full`: mide el alto real del contenido, así el gutter
 * lo cubre entero y los números nunca se cortan (con `min-h-full`, un quirk de
 * flexbox lo dejaba clavado al viewport y el gutter se recortaba a la primera
 * pantalla). Si la lección es más corta que el viewport, se ven solo los números
 * junto al contenido —comportamiento de editor real, sin rellenar vacío—. Sin
 * borde y atenuado (`opacity-60`) para que los números recedan más que los `//`
 * comentarios; el color sale de tokens (`--color-syntax-comment`, gris Monokai
 * en `.nx-ide` dark).
 */
export function LienzoArchivo({ children }: LienzoArchivoProps) {
  const numeros = Array.from({ length: MAX_LINEAS_GUTTER }, (_, i) => `${i + 1}`).join("\n")

  return (
    <div className="relative py-10 pr-8 pl-4">
      <div
        aria-hidden={true}
        className="pointer-events-none absolute inset-y-10 left-4 w-11 select-none overflow-hidden opacity-60"
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
