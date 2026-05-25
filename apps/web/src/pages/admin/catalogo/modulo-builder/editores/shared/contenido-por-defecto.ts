import type { TipoBloque } from "@nexott-learn/shared-types"

function nuevoId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 12)
}

/**
 * Contexto opcional para defaults dependientes de la sección. Hoy sólo lo usa
 * `CODIGO_TESTS`, que necesita el id de un `CODIGO_PREGUNTAS` hermano para
 * cumplir el contrato Zod del backend al crear (uuid no-vacío).
 */
export interface ContextoContenidoDefecto {
  readonly codigoPreguntasHermanoId?: string
}

/**
 * Contenido JSON por defecto para crear un bloque vacio del tipo indicado.
 * Para tipos evaluables (QUIZ, CODIGO_*) el backend valida shape estricto al
 * crear, así que se siembran placeholders mínimos válidos que el admin edita.
 *
 * `CODIGO_TESTS` exige `codigoPreguntasId` uuid y al menos un test: el caller
 * (use-builder-acciones) pasa el id del hermano como contexto. Si no hay
 * hermano disponible el dialog deshabilita esa opción antes de llegar aquí.
 */
export function contenidoPorDefecto(
  tipo: TipoBloque,
  contexto?: ContextoContenidoDefecto,
): Record<string, unknown> {
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
        preguntas: [
          {
            id: nuevoId(),
            tipo: "OPCION_UNICA",
            pesoPunto: 1,
            enunciado: "Nueva pregunta",
            opciones: [
              { id: nuevoId(), texto: "Opción correcta", esCorrecta: true },
              { id: nuevoId(), texto: "Opción incorrecta", esCorrecta: false },
            ],
            explicacion: "",
          },
        ],
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
        enunciado: "Describe el reto: qué recibe por stdin y qué debe imprimir por stdout.",
        esqueletoInicial: "",
        tiempoLimiteSeg: 30,
      }
    case "CODIGO_TESTS":
      return {
        codigoPreguntasId: contexto?.codigoPreguntasHermanoId ?? "",
        solucionReferencia: "",
        tests: [
          {
            id: nuevoId(),
            descripcion: "Caso de ejemplo",
            entrada: "",
            salidaEsperada: "",
            visible: true,
          },
        ],
      }
    default:
      return {}
  }
}
