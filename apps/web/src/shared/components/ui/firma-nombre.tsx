type Tono = "aurora" | "warmth"

interface FirmaNombreProps {
  /** Nombre del usuario tal cual debe leerse. */
  readonly nombre: string
  /**
   * Atmosfera del momento del viaje:
   *  - `aurora`: bienvenida / consolidacion (login, mi-ficha hero).
   *  - `warmth`: despedida / cierre (logout).
   */
  readonly tono: Tono
  /**
   * Si `true`, anade un punto final con el color complementario del tono
   * (cyan en aurora, tertiary en warmth). Por defecto `false`.
   */
  readonly withDot?: boolean
  /** Permite componer con un padre que controle layout o animacion. */
  readonly className?: string
}

const COLOR_NOMBRE: Record<Tono, string> = {
  aurora: "text-aurora-violet",
  warmth: "text-warmth",
}

const COLOR_DOT: Record<Tono, string> = {
  aurora: "text-aurora-cyan",
  warmth: "text-text-tertiary",
}

/**
 * Firma personal narrativa del producto: el nombre del usuario en serif italic
 * con tono de marca, opcionalmente cerrado por un punto cromatico.
 *
 * Patron reutilizado en welcome del login, despedida del logout y hero del
 * viaje (mi-ficha). NO confundir con `SaludoBienvenida` (bandeja), que es un
 * saludo temporal en sans display con punto aurora-violet.
 *
 * Para animar la entrada (motion), envuelve este componente en un `motion.span`
 * externo y deja las clases tipograficas aqui.
 */
export function FirmaNombre({ nombre, tono, withDot = false, className }: FirmaNombreProps) {
  const clases = `font-normal font-serif italic ${COLOR_NOMBRE[tono]}${className ? ` ${className}` : ""}`
  return (
    <span className={clases}>
      {nombre}
      {withDot ? <span className={COLOR_DOT[tono]}>.</span> : null}
    </span>
  )
}
