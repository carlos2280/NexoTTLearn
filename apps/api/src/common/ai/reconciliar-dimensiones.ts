import { AiInformeCualitativo } from "./ai.types"

export type DimensionReconciliada = AiInformeCualitativo["porDimension"][number]

const COMENTARIO_NO_EVALUADA = "La IA no puntuó esta dimensión."

/**
 * Reconcilia las dimensiones que la IA devolvió contra los ejes esperados
 * (skills del transversal). Garantiza que el informe cubra **exactamente** esos
 * ejes, en su orden canónico:
 *
 *  - dimensión esperada que la IA sí puntuó → se conserva su nota/comentario;
 *  - dimensión esperada que la IA omitió → se rellena con `nota: null` + aviso;
 *  - dimensión que la IA inventó (no está en los ejes) → se descarta.
 *
 * El match es tolerante a mayúsculas/espacios para no perder una puntuación real
 * por diferencias cosméticas del nombre. Si no hay ejes esperados (transversal
 * sin skills), se devuelve lo que la IA entregó tal cual.
 */
export function reconciliarDimensiones(
  devueltas: readonly DimensionReconciliada[],
  esperadas: readonly string[],
): DimensionReconciliada[] {
  if (esperadas.length === 0) {
    return [...devueltas]
  }

  const porClave = new Map<string, DimensionReconciliada>()
  for (const d of devueltas) {
    const clave = normalizar(d.dimension)
    // Primera aparición gana: si la IA duplica una dimensión, ignoramos la copia.
    if (!porClave.has(clave)) {
      porClave.set(clave, d)
    }
  }

  return esperadas.map((esperada) => {
    const encontrada = porClave.get(normalizar(esperada))
    if (encontrada) {
      // Usamos el nombre canónico de la skill, no el que la IA haya reescrito.
      return { dimension: esperada, nota: encontrada.nota, comentario: encontrada.comentario }
    }
    return { dimension: esperada, nota: null, comentario: COMENTARIO_NO_EVALUADA }
  })
}

function normalizar(valor: string): string {
  return valor.trim().toLowerCase()
}
