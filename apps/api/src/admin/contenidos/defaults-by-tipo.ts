import type { TipoContenido } from "@prisma/client"

// Defaults por tipo aplicados cuando el POST /contenidos llega sin payload
// `contenido`. Permiten al admin crear un bloque vacio listo para editar.
// La estructura debe coincidir con los schemas en
// @nexott-learn/shared-types/admin-contenidos. La validacion estricta vive en
// publicacion (no en F4).

export interface PayloadDefaults {
  contenido: Record<string, unknown>
  metadata: Record<string, unknown> | null
}

export function getDefaultsByTipo(tipo: TipoContenido): PayloadDefaults {
  switch (tipo) {
    case "LECTURA":
      return {
        contenido: { cuerpo: "" },
        metadata: null,
      }
    case "VIDEO":
      return {
        contenido: { url: "", proveedor: "youtube" },
        metadata: null,
      }
    case "RECURSO":
      return {
        contenido: { tipoRecurso: "link", url: "" },
        metadata: null,
      }
    case "EJEMPLO_CODIGO":
      return {
        contenido: {
          explicacion: "",
          lenguaje: "javascript",
          codigo: "",
          esInteractivo: false,
          preguntasComprension: [],
        },
        metadata: null,
      }
    case "EJERCICIO":
      // Default modo "guiado" porque es el flujo mas comun (admin guia al
      // alumno con enunciado y solucion de referencia). El front cambia a
      // "reto" desde el editor si hace falta.
      return {
        contenido: {
          modo: "guiado",
          lenguaje: "javascript",
          archivosIniciales: [],
          tests: [],
          enunciado: "",
          solucionReferencia: "",
          pistas: [],
          restricciones: [],
          criteriosEvaluacion: [],
        },
        metadata: { intentosPermitidos: 3 },
      }
    case "TEST":
      return {
        contenido: {
          preguntas: [],
          aleatorizar: false,
          mostrarResultadoInmediato: true,
          intentosPermitidos: 3,
        },
        metadata: null,
      }
    default: {
      // Exhaustiveness check: si Prisma agrega un TipoContenido sin
      // cubrirlo aqui, TS marca _tipo como never y compila falla.
      const _tipo: never = tipo
      throw new Error(`Tipo de contenido no soportado: ${String(_tipo)}`)
    }
  }
}
