import type { BloqueDetalleAdmin, CrearBloqueAdminInput } from "@nexott-learn/shared-types"

type ExtractByTipo<T extends CrearBloqueAdminInput["tipo"]> = Extract<
  CrearBloqueAdminInput,
  { tipo: T }
>

export function buildDuplicateInput(source: BloqueDetalleAdmin): CrearBloqueAdminInput | null {
  const payload = source.payload as CrearBloqueAdminInput["payload"]
  switch (source.tipo) {
    case "PARRAFO":
      return { tipo: "PARRAFO", payload: payload as ExtractByTipo<"PARRAFO">["payload"] }
    case "TIP":
      return { tipo: "TIP", payload: payload as ExtractByTipo<"TIP">["payload"] }
    case "VIDEO":
      return { tipo: "VIDEO", payload: payload as ExtractByTipo<"VIDEO">["payload"] }
    case "RECURSO":
      return { tipo: "RECURSO", payload: payload as ExtractByTipo<"RECURSO">["payload"] }
    case "QUIZ":
      return { tipo: "QUIZ", payload: payload as ExtractByTipo<"QUIZ">["payload"] }
    case "CODIGO": {
      const { codigoUbicacion, codigoInteractivo, codigoEvaluable, codigoLenguaje } = source
      if (!(codigoUbicacion && codigoInteractivo && codigoEvaluable && codigoLenguaje)) {
        return null
      }
      return {
        tipo: "CODIGO",
        payload: payload as ExtractByTipo<"CODIGO">["payload"],
        codigoUbicacion,
        codigoInteractivo,
        codigoEvaluable,
        codigoLenguaje,
        solucionReferencia: source.solucionReferencia ?? undefined,
      }
    }
    default: {
      const _exhaustive: never = source.tipo
      return _exhaustive
    }
  }
}
