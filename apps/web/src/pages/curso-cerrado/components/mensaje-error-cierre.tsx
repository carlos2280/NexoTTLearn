import { Banner } from "@/shared/components/ui/banner"
import { resolverMensajeErrorCierre } from "./resolver-mensaje-error-cierre"

interface MensajeErrorCierreProps {
  readonly error: Error | null
}

/**
 * Banner de error de la pantalla de cierre. Solo render — la decision de tono
 * y texto por code vive en `resolverMensajeErrorCierre` (funcion pura
 * testeada en aislado, sin testing-library). Si no hay error o el resolver
 * devuelve `null`, no se pinta nada.
 *
 * El redirect por `CONFLICT_CURSO_NO_CERRADO` lo gestiona la pagina antes de
 * llegar aqui — este componente solo cubre los 409 "en sitio" + fallback.
 */
export function MensajeErrorCierre({ error }: MensajeErrorCierreProps) {
  const mensaje = resolverMensajeErrorCierre(error)
  if (!mensaje) {
    return null
  }
  return <Banner tone={mensaje.tone}>{mensaje.texto}</Banner>
}
