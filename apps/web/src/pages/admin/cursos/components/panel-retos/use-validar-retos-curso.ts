import { obtenerContenidoDeSeccion } from "@/features/catalogo/api/bloques.api"
import { ejecutarSuite, resumirValidacionReferencia } from "@/features/codigo-ejecucion"
import { type QueryClient, useQuery, useQueryClient } from "@tanstack/react-query"
import { useCallback, useEffect, useRef, useState } from "react"
import { emparejarReto } from "./emparejar-reto"
import { estadoDesdeResumen } from "./estado-reto"
import type { EstadoReto, Progreso, RetoDelCurso } from "./retos.types"

/**
 * Clave propia para el contenido de sección de ESTA pantalla. No reusa la del
 * participante (`BLOQUES_DE_SECCION_KEY`, en `features/me`) a propósito: son
 * roles y flujos distintos que nunca conviven, y acoplarlos obligaría a que un
 * cambio de caché del alumno pasara por el admin. Ver follow-up en P15.
 */
const CONTENIDO_SECCION_KEY = ["admin", "retos", "contenido-seccion"] as const

/** Los resultados viven en la caché de queries para sobrevivir al cambio de pestaña. */
function estadosQueryKey(cursoId: string) {
  return ["admin", "retos", "estados", cursoId] as const
}

const VACIO: ReadonlyMap<string, EstadoReto> = new Map()

/**
 * Corre la solución de referencia de cada reto contra sus propias pruebas, con
 * el runner real del navegador. SECUENCIAL a propósito, por dos razones: los
 * workers compiten por CPU (y Pyodide es pesado), y disparar ~92 peticiones de
 * contenido en paralelo reventaría el throttler `long` (100/60s). Ir de a uno
 * reparte las peticiones a lo largo de los minutos que dura la corrida.
 *
 * Los resultados se guardan en la caché de TanStack Query indexados por curso,
 * no en `useState`: el propio panel invita a abrir el editor o mirar otra
 * pestaña, y perder cuatro minutos de validación por eso era inaceptable.
 */
export function useValidarRetosCurso(cursoId: string) {
  const queryClient = useQueryClient()
  const [progreso, setProgreso] = useState<Progreso | null>(null)
  const [deteniendo, setDeteniendo] = useState(false)
  const cancelado = useRef(false)
  const corriendo = useRef(false)

  // `useQuery` y no `getQueryData`: hace falta SUSCRIBIRSE a la entrada de
  // caché para que cada `marcar` repinte la fila. El `queryFn` solo siembra el
  // mapa vacío; quien escribe de verdad es `marcar` vía `setQueryData`.
  const { data: estados = VACIO } = useQuery({
    queryKey: estadosQueryKey(cursoId),
    queryFn: () => VACIO,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  })

  // Al desmontar (cambio de pestaña o de curso) se corta el bucle: si no,
  // seguiría ejecutando workers y pidiendo secciones que ya nadie mira.
  useEffect(() => {
    cancelado.current = false
    return () => {
      cancelado.current = true
    }
  }, [])

  const marcar = useCallback(
    (bloqueId: string, estado: EstadoReto) => {
      queryClient.setQueryData<ReadonlyMap<string, EstadoReto>>(
        estadosQueryKey(cursoId),
        (previos) => new Map(previos ?? []).set(bloqueId, estado),
      )
    },
    [queryClient, cursoId],
  )

  const validar = useCallback(
    async (retos: readonly RetoDelCurso[]) => {
      if (corriendo.current || retos.length === 0) {
        return
      }
      corriendo.current = true
      cancelado.current = false
      setDeteniendo(false)
      setProgreso({ hechos: 0, total: retos.length })
      // Cada corrida parte de contenido fresco: el flujo natural es ver rojo,
      // arreglar en el editor y revalidar, y servir la sección cacheada haría
      // que un reto ya arreglado (o ya roto) mostrara el veredicto anterior.
      await queryClient.invalidateQueries({
        queryKey: CONTENIDO_SECCION_KEY,
        refetchType: "none",
      })

      for (const [indice, reto] of retos.entries()) {
        if (cancelado.current) {
          break
        }
        marcar(reto.bloqueId, { tipo: "validando" })
        // El resultado se pinta aunque entretanto se haya cancelado: el trabajo
        // ya se hizo y tirarlo dejaría la fila en "Validando…" para siempre.
        const estado = await validarUnReto(queryClient, reto)
        marcar(reto.bloqueId, estado)
        setProgreso({ hechos: indice + 1, total: retos.length })
      }

      corriendo.current = false
      setDeteniendo(false)
      setProgreso(null)
    },
    [queryClient, marcar],
  )

  const detener = useCallback(() => {
    cancelado.current = true
    // El reto en curso puede tardar (tests × tiempo límite). Sin esta señal el
    // botón parece no haber hecho nada y se vuelve a pulsar.
    setDeteniendo(true)
  }, [])

  return { estados, progreso, deteniendo, validar, detener }
}

async function validarUnReto(queryClient: QueryClient, reto: RetoDelCurso): Promise<EstadoReto> {
  try {
    // `staleTime` infinito + la invalidación del arranque: dentro de UNA corrida
    // cada sección se pide una sola vez (hay secciones con varios retos), y
    // entre corridas siempre se refresca.
    const bloques = await queryClient.fetchQuery({
      queryKey: [...CONTENIDO_SECCION_KEY, reto.seccionId] as const,
      queryFn: () => obtenerContenidoDeSeccion(reto.seccionId),
      staleTime: Number.POSITIVE_INFINITY,
    })
    const emparejado = emparejarReto(bloques, reto.bloqueId)
    if (!emparejado.ok) {
      return { tipo: "no-validable", motivo: emparejado.motivo, codigo: emparejado.codigo }
    }
    const resultado = await ejecutarSuite({
      lenguaje: emparejado.reto.lenguaje,
      codigo: emparejado.reto.solucionReferencia,
      tests: emparejado.reto.tests,
      timeoutSegPorTest: emparejado.reto.tiempoLimiteSeg,
    })
    return estadoDesdeResumen(resumirValidacionReferencia(resultado))
  } catch (error) {
    return {
      tipo: "error",
      mensaje: error instanceof Error ? error.message : "Error desconocido",
    }
  }
}
