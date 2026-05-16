import type { TipoBloque } from "@nexott-learn/shared-types"

/**
 * Contenido JSON por defecto para crear un bloque vacio del tipo indicado.
 * Cada tipo tiene su forma propia (validacion estricta llega en lotes
 * posteriores cuando hagamos schemas Zod en shared-types).
 */
export function contenidoPorDefecto(tipo: TipoBloque): Record<string, unknown> {
  switch (tipo) {
    case "PARRAFO":
      return { html: "", textoPlano: "", tiempoLecturaMin: 0 }
    case "TIP":
      return { variante: "info", html: "" }
    case "VIDEO":
      return {
        url: "",
        proveedor: "otro",
        marcarAlPorcentaje: 90,
        notas: "",
      }
    case "RECURSO":
      return {
        subtipo: "enlace",
        url: "",
        titulo: "",
        descripcion: "",
        abrirNuevaPestana: true,
      }
    case "QUIZ":
      return {
        intentosMax: null,
        solucionVisible: "al_aprobar",
        ordenAleatorio: false,
        notaMinima: 60,
        preguntas: [],
      }
    case "CODIGO_ILUSTRATIVO":
      return {
        lenguaje: "typescript",
        codigo: "",
        descripcion: "",
      }
    case "CODIGO_PREGUNTAS":
      return {
        lenguaje: "typescript",
        enunciado: "",
        esqueletoInicial: "",
        tiempoLimiteSeg: 30,
      }
    case "CODIGO_TESTS":
      return {
        codigoPreguntasId: "",
        solucionReferencia: "",
        tests: [],
      }
    default:
      return {}
  }
}
