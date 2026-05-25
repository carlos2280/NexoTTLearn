interface SaludoBienvenidaProps {
  /** Saludo temporal: "Buenos días" / "Buenas tardes" / "Buenas noches". */
  readonly saludo: string
  /** Nombre del usuario. Si es vacío o null, solo se muestra el saludo. */
  readonly nombre: string | null
  /** Línea bajo el título; debe ser corta y contextual al momento. */
  readonly microcopy: string
  /** Para `aria-labelledby` del bloque padre — opcional. */
  readonly tituloId?: string
}

/**
 * Saludo de bienvenida al participante. Patrón reusado en bandeja, futuras
 * landings del shell del participante y donde aparezca un "primer contacto".
 *
 * Tres elementos:
 *  - Título display con punto aurora-violet (firma del producto).
 *  - Línea aurora 2px (decorativa, ancho fijo 80px).
 *  - Microcopy en text-tertiary (caption contextual).
 *
 * Para casos con más estructura (fecha/hora arriba, frase serif italic abajo),
 * usar este componente como base y envolverlo con el contexto extra.
 */
export function SaludoBienvenida({ saludo, nombre, microcopy, tituloId }: SaludoBienvenidaProps) {
  const titulo = nombre ? `${saludo}, ${nombre}` : saludo
  return (
    <div className="flex flex-col gap-2.5">
      <h1 id={tituloId} className="text-display-md text-text-primary">
        {titulo}
        <span className="text-aurora-violet">.</span>
      </h1>
      <span
        aria-hidden={true}
        className="h-[2px] w-20 rounded-pill"
        style={{ background: "var(--gradient-aurora)" }}
      />
      <p className="text-body-sm text-text-tertiary">{microcopy}</p>
    </div>
  )
}
