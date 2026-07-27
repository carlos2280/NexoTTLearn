import type { ResumenValidacion } from "@/features/codigo-ejecucion"
import type { MotivoNoValidable } from "./emparejar-reto"
import type { EstadoReto } from "./retos.types"

/**
 * Traduce el resumen de la corrida al estado que ve el admin. Distingue
 * "no llegó a ejecutarse" de "falla tests" con el mismo criterio que el
 * guardarraíl de a uno: acusar de "falla 5 de 5" a una solución que ni compiló
 * manda al admin a revisar las pruebas cuando el problema es el entorno.
 *
 * Pura: sin fetch, sin DOM.
 */
export function estadoDesdeResumen(resumen: ResumenValidacion): EstadoReto {
  if (resumen.ok) {
    return { tipo: "ok", totales: resumen.totales }
  }
  if (resumen.noEjecuta) {
    return { tipo: "no-ejecuta", detalle: resumirError(resumen.fallidos[0]?.stderr ?? "") }
  }
  return { tipo: "falla", resumen }
}

export interface EtiquetaEstado {
  readonly texto: string
  readonly tono: "neutro" | "success" | "warning" | "danger"
}

/**
 * Etiqueta y tono del chip de una fila. El texto es autoexplicativo sin
 * depender del color (WCAG 1.4.1: el color no puede ser el único portador de
 * información) y evita jerga: quien opera esta pantalla no es necesariamente
 * quien escribió el reto.
 */
export function etiquetaDeEstado(estado: EstadoReto): EtiquetaEstado {
  // biome-ignore lint/style/useDefaultSwitchClause: switch exhaustivo sobre EstadoReto; el chequeo lo hace TypeScript.
  switch (estado.tipo) {
    case "pendiente":
      return { texto: "Sin validar", tono: "neutro" }
    case "validando":
      return { texto: "Validando…", tono: "neutro" }
    case "ok":
      return { texto: "Sin problemas", tono: "success" }
    case "falla":
      return {
        texto: `Falla ${estado.resumen.fallidos.length} de ${estado.resumen.totales}`,
        tono: "warning",
      }
    case "no-ejecuta":
      return { texto: "No arranca", tono: "danger" }
    case "no-validable":
      return {
        texto: estado.codigo === "lenguaje" ? "No se puede validar" : "Falta configuración",
        tono: estado.codigo === "lenguaje" ? "neutro" : "warning",
      }
    case "error":
      return { texto: "Error al validar", tono: "danger" }
  }
}

/**
 * Explicación en tres capas para quien NO escribió el reto: qué se detectó,
 * qué consecuencia tiene para el alumno, y qué paso concreto sigue. Sin las
 * dos últimas, un "Falla 3 de 3" no le dice a un admin no técnico ni si es
 * grave ni a quién avisar.
 */
export interface DetalleEstado {
  readonly quePaso: string
  readonly queSignifica: string
  readonly queHacer: string
  /** Un reto sano no necesita explicación: la fila ni siquiera se despliega. */
  readonly requiereAccion: boolean
}

/**
 * ¿Este reto le pide algo a un humano? Es el criterio único de "a revisar":
 * lo usan el chip del módulo, el resumen de la corrida y el informe copiable,
 * para que el contador y el texto no puedan contradecirse.
 *
 * Es un `switch` plano y no `detalleDeEstado(...)!.requiereAccion` porque se
 * llama una vez por reto en cada render (92 retos × 21 grupos): construir tres
 * párrafos con template literals para tirarlos y quedarse con un booleano es
 * basura gratis en una pantalla que ya pelea la CPU con Pyodide.
 */
export function requiereAccion(estado: EstadoReto): boolean {
  // biome-ignore lint/style/useDefaultSwitchClause: switch exhaustivo sobre EstadoReto; el chequeo lo hace TypeScript.
  switch (estado.tipo) {
    case "pendiente":
    case "validando":
    case "ok":
      return false
    case "falla":
    case "no-ejecuta":
    case "error":
      return true
    case "no-validable":
      // Un lenguaje que el runner no cubre no es un reto roto: puede estar
      // perfecto y solo no ser autocorregible desde aquí.
      return estado.codigo !== "lenguaje"
  }
}

export function detalleDeEstado(estado: EstadoReto): DetalleEstado | null {
  // biome-ignore lint/style/useDefaultSwitchClause: switch exhaustivo sobre EstadoReto; el chequeo lo hace TypeScript.
  switch (estado.tipo) {
    case "pendiente":
    case "validando":
    case "ok":
      return null
    case "falla":
      return {
        quePaso: `La solución oficial no pasa ${estado.resumen.fallidos.length} de ${estado.resumen.totales} de sus propias pruebas (${listarFallidos(estado.resumen)}).`,
        queSignifica:
          "El reto está mal armado: la respuesta que el propio curso da por correcta no supera sus pruebas, así que un alumno que responda bien puede ver su intento como fallido.",
        queHacer:
          "Avisa a quien creó el contenido, o ábrelo en el editor del módulo y revisa la solución de referencia y sus pruebas.",
        requiereAccion: true,
      }
    case "no-ejecuta":
      return {
        quePaso:
          estado.detalle.length > 0
            ? `La solución oficial ni siquiera llegó a ejecutarse: ${estado.detalle}`
            : "La solución oficial ni siquiera llegó a ejecutarse.",
        queSignifica:
          "No es que falle una prueba: el código de la solución tiene un error que impide correrlo. El reto le va a fallar a todos los alumnos.",
        queHacer:
          "Avisa a quien creó el contenido: hay que corregir la solución de referencia en el editor del módulo.",
        requiereAccion: true,
      }
    case "no-validable":
      return detalleNoValidable(estado.codigo, estado.motivo)
    case "error":
      return {
        quePaso: `No pudimos ejecutarla en el navegador: ${estado.mensaje}`,
        queSignifica:
          "Es un problema de esta pantalla, no del reto. Puede pasar si se perdió la conexión o si el navegador cortó la ejecución.",
        queHacer: "Vuelve a validar este módulo. Si se repite siempre, avisa a soporte técnico.",
        requiereAccion: true,
      }
  }
}

function detalleNoValidable(codigo: MotivoNoValidable, motivo: string): DetalleEstado {
  if (codigo === "lenguaje") {
    return {
      quePaso: `${motivo} La revisión automática solo cubre JavaScript, TypeScript y Python.`,
      queSignifica:
        "No es un problema del reto: puede estar perfecto. Simplemente esta pantalla no sabe correrlo.",
      queHacer: "Si quieres asegurarte, revísalo a mano desde el editor del módulo.",
      requiereAccion: false,
    }
  }
  if (codigo === "sin-tests") {
    return {
      quePaso: motivo,
      queSignifica:
        "Sin pruebas, la plataforma no tiene con qué corregir al alumno: el reto no se le puede aprobar nunca.",
      queHacer:
        "Avisa a quien creó el contenido: falta añadir el bloque de pruebas del reto en el editor del módulo.",
      requiereAccion: true,
    }
  }
  if (codigo === "sin-solucion") {
    return {
      quePaso: motivo,
      queSignifica:
        "Sin la respuesta oficial no hay con qué comparar, así que nadie puede verificar que el reto sea resoluble.",
      queHacer:
        "Avisa a quien creó el contenido: falta escribir la solución de referencia en el editor del módulo.",
      requiereAccion: true,
    }
  }
  return {
    quePaso: motivo,
    queSignifica:
      "El contenido de este reto no tiene la forma que la plataforma espera. Suele venir de una importación incompleta.",
    queHacer: "Avisa a soporte técnico con el nombre del curso y del módulo.",
    requiereAccion: true,
  }
}

const LARGO_MAXIMO_ERROR = 300

/**
 * Deja el error del runtime en una línea legible. Se queda con la ÚLTIMA línea
 * no vacía porque en Python el traceback empieza por "Traceback (most recent
 * call last):" y la causa real está al final. Sin esto, un traceback entero se
 * cuela en la fila y, peor, en el mensaje que se le copia a otra persona.
 */
function resumirError(stderr: string): string {
  const lineas = stderr.split("\n").filter((linea) => linea.trim().length > 0)
  const ultima = lineas.at(-1)?.trim() ?? ""
  return ultima.length > LARGO_MAXIMO_ERROR ? `${ultima.slice(0, LARGO_MAXIMO_ERROR)}…` : ultima
}

function listarFallidos(resumen: ResumenValidacion): string {
  return resumen.fallidos
    .map((f) => (f.estado === "timeout" ? `#${f.numero}, que se quedó colgada` : `#${f.numero}`))
    .join(", ")
}
