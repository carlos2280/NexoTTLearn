import { type ResultadoEjecucionSuite, useEjecutarCodigo } from "@/features/codigo-ejecucion"
import { Banner } from "@/shared/components/ui/banner"
import { Button } from "@/shared/components/ui/button"
import { lenguajeEjecutableSchema } from "@nexott-learn/shared-types"
import { Play } from "lucide-react"
import { useMemo, useState } from "react"
import type { TestUnit } from "./codigo-test-fila"
import { resumirValidacionReferencia } from "./resumir-validacion-referencia"

interface ValidarReferenciaProps {
  readonly solucionReferencia: string
  readonly tests: readonly TestUnit[]
  readonly lenguaje: string
  /** El mismo `tiempoLimiteSeg` del reto, para validar bajo la restricción real
   *  del participante (no una constante que daría falsos rojos/verdes). */
  readonly tiempoLimiteSeg: number
}

/**
 * Guardarraíl del editor admin: corre la solución de referencia contra todos
 * los tests con el mismo runner del participante y avisa si no pasan todos.
 * Solo aviso (no bloquea el guardado): evita publicar retos rotos de fábrica.
 * Deshabilitado si el lenguaje no es autocorregible o faltan solución/tests.
 */
export function ValidarReferencia({
  solucionReferencia,
  tests,
  lenguaje,
  tiempoLimiteSeg,
}: ValidarReferenciaProps) {
  const ejecutor = useEjecutarCodigo()
  const lenguajeEjecutable = lenguajeEjecutableSchema.safeParse(lenguaje)
  const tieneSolucion = solucionReferencia.trim().length > 0
  const tieneTests = tests.length > 0

  // Firma de las entradas: si cambian tras validar, el resultado mostrado queda
  // obsoleto y se oculta. Un verde caduco tras romper un test sería una trampa.
  const firmaActual = useMemo(
    () => JSON.stringify({ solucionReferencia, tests, tiempoLimiteSeg }),
    [solucionReferencia, tests, tiempoLimiteSeg],
  )
  const [firmaValidada, setFirmaValidada] = useState<string | null>(null)

  const puedeValidar =
    lenguajeEjecutable.success && tieneSolucion && tieneTests && !ejecutor.isPending
  const motivo = motivoNoValidable({
    lenguajeEjecutable: lenguajeEjecutable.success,
    tieneSolucion,
    tieneTests,
  })

  function validar() {
    if (!lenguajeEjecutable.success) {
      return
    }
    setFirmaValidada(firmaActual)
    ejecutor.mutate({
      lenguaje: lenguajeEjecutable.data,
      codigo: solucionReferencia,
      tests,
      timeoutSegPorTest: tiempoLimiteSeg,
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={validar}
          disabled={!puedeValidar}
          isLoading={ejecutor.isPending}
        >
          <Play className="h-3.5 w-3.5 fill-current" aria-hidden={true} />
          Validar solución
        </Button>
        {motivo ? <span className="text-caption text-text-tertiary">{motivo}</span> : null}
      </div>
      {firmaValidada === firmaActual ? (
        <ResultadoValidacion resultado={ejecutor.data} error={ejecutor.error} />
      ) : null}
    </div>
  )
}

function motivoNoValidable(args: {
  readonly lenguajeEjecutable: boolean
  readonly tieneSolucion: boolean
  readonly tieneTests: boolean
}): string | null {
  if (!args.lenguajeEjecutable) {
    return "Validación disponible solo para JavaScript, TypeScript y Python."
  }
  if (!args.tieneSolucion) {
    return "Escribe la solución de referencia para poder validarla."
  }
  if (!args.tieneTests) {
    return "Añade al menos un test para validar la solución."
  }
  return null
}

interface ResultadoValidacionProps {
  readonly resultado: ResultadoEjecucionSuite | undefined
  readonly error: Error | null
}

function ResultadoValidacion({ resultado, error }: ResultadoValidacionProps) {
  if (error) {
    return (
      <Banner tone="danger" title="No se pudo validar">
        No pudimos ejecutar la solución en el navegador: {error.message}
      </Banner>
    )
  }
  if (!resultado) {
    return null
  }
  const resumen = resumirValidacionReferencia(resultado)
  if (resumen.ok) {
    const cuenta = resumen.totales === 1 ? "el test" : `los ${resumen.totales} tests`
    return <Banner tone="success">La solución de referencia pasa {cuenta}.</Banner>
  }
  if (resumen.noEjecuta) {
    const detalle = resumen.fallidos[0]?.stderr.trim()
    return (
      <Banner tone="danger" title="La solución no llega a ejecutarse">
        {detalle ? `${detalle}. ` : ""}Revisa que compile y que sus dependencias carguen antes de
        publicar.
      </Banner>
    )
  }
  const numeros = resumen.fallidos
    .map((f) => (f.estado === "timeout" ? `#${f.numero} (timeout)` : `#${f.numero}`))
    .join(", ")
  return (
    <Banner tone="warning" title="La solución no pasa todos los tests">
      No pasa {resumen.fallidos.length} de {resumen.totales} tests: {numeros}. Revísala antes de
      publicar — un reto roto frustra al alumno.
    </Banner>
  )
}
