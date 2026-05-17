import { useMejorIntentoBloque } from "@/features/intentos-bloque/hooks/use-mejor-intento-bloque"
import { type ReactNode, useState } from "react"
import { BloqueEvaluableColapsado } from "./bloque-evaluable-colapsado"

interface EvaluableConColapsoProps {
  readonly bloqueId: string
  readonly colaboradorId: string
  readonly notaMinima: number
  readonly tituloColapsado: string
  readonly children: ReactNode
}

/**
 * Envuelve un bloque evaluable activo (Quiz o reto de codigo) para mostrarlo
 * colapsado cuando ya esta aprobado al montar. El estado expandido se decide
 * UNA SOLA VEZ al montar: si el participante aprueba durante esta sesion
 * (envia un intento que pasa), NO se colapsa de golpe — el banner del hijo
 * se queda visible. Solo al cambiar de seccion y volver, el wrapper se
 * remonta y vuelve a colapsar (cumple la ley 07 "cumplido se desvanece").
 *
 * Al hacer click en "Reintentar", el bloque hijo se monta fresh — sin
 * estado anterior, pero su mejor intento sigue contando porque el server
 * lo respeta (D13).
 */
export function EvaluableConColapso({
  bloqueId,
  colaboradorId,
  notaMinima,
  tituloColapsado,
  children,
}: EvaluableConColapsoProps) {
  const mejor = useMejorIntentoBloque({ colaboradorId, bloqueId })
  const aprobadoAlMontar = (mejor.data?.nota ?? -1) >= notaMinima
  const [forzarExpandido, setForzarExpandido] = useState(false)

  // Mientras la query carga por primera vez, no decidimos — renderizar el
  // bloque hijo evita un parpadeo "colapsado -> expandido" si el cache
  // tarda. El propio bloque hijo gestiona su loading interno.
  if (mejor.isLoading) {
    return <>{children}</>
  }

  if (aprobadoAlMontar && !forzarExpandido) {
    return (
      <BloqueEvaluableColapsado
        titulo={tituloColapsado}
        onExpandir={() => setForzarExpandido(true)}
      />
    )
  }

  return <>{children}</>
}
