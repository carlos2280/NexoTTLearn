import { Banner } from "@/shared/components/ui/banner"
import { BotonCopiar } from "./boton-copiar"
import type { ResumenCorrida } from "./reporte-reto"

interface ResumenCorridaProps {
  readonly resumen: ResumenCorrida
  readonly informe: string
}

/**
 * Cierre de la corrida: qué se encontró y cómo pasárselo a quien puede
 * arreglarlo. El botón de copiar es la razón de ser de este bloque — quien
 * revisa aquí casi nunca es quien edita el contenido.
 *
 * El verde exige que NO quede nada sin validar. Antes bastaba con que no
 * hubiera fallos, así que validar un módulo de un curso de 92 retos coronaba
 * la pantalla con "Ningún reto necesita arreglo": el título y el color son lo
 * que se recuerda, aunque el cuerpo aclarara los 82 pendientes.
 */
export function ResumenCorridaBanner({ resumen, informe }: ResumenCorridaProps) {
  const revisados = resumen.ok + resumen.aRevisar + resumen.noAplica
  if (revisados === 0) {
    return null
  }

  const completo = resumen.sinValidar === 0
  const limpio = resumen.aRevisar === 0

  return (
    <Banner tone={tono(limpio, completo)} title={titulo(resumen, limpio, completo)}>
      <div className="flex flex-col gap-3">
        <span>
          Revisamos {revisados} de {resumen.total} retos: {resumen.ok} sin problemas,{" "}
          {resumen.aRevisar} a revisar
          {resumen.noAplica > 0 ? `, ${resumen.noAplica} que no se pueden validar aquí` : ""}.
          {resumen.sinValidar > 0 ? ` Quedan ${resumen.sinValidar} sin validar.` : ""}
          {limpio ? "" : " Abre los módulos marcados en ámbar para ver el detalle de cada uno."}
        </span>
        <div>
          <BotonCopiar
            texto={informe}
            etiqueta="Copiar informe"
            etiquetaCopiado="Informe copiado"
          />
        </div>
      </div>
    </Banner>
  )
}

function tono(limpio: boolean, completo: boolean): "success" | "info" | "warning" {
  if (!limpio) {
    return "warning"
  }
  return completo ? "success" : "info"
}

function titulo(resumen: ResumenCorrida, limpio: boolean, completo: boolean): string {
  if (!limpio) {
    return `${resumen.aRevisar} ${resumen.aRevisar === 1 ? "reto necesita" : "retos necesitan"} revisión`
  }
  return completo
    ? "Ningún reto necesita arreglo"
    : `Sin problemas en los ${resumen.ok} retos revisados`
}
