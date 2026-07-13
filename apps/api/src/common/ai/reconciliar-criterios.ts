import { AiInformeCualitativo } from "./ai.types"

export type CriterioReconciliado = NonNullable<
  AiInformeCualitativo["cumplimientoCriterios"]
>[number]

const EVIDENCIA_NO_EVALUADO = "La IA no verificó este criterio."

/**
 * Reconcilia el cumplimiento que la IA devolvió contra la "Lista a evaluar"
 * declarada por el admin. Garantiza que el checklist cubra **exactamente** esos
 * criterios, en su orden canónico:
 *
 *  - criterio esperado que la IA sí verificó → se conserva su `cumple`/evidencia;
 *  - criterio esperado que la IA omitió → se rellena con `cumple: null` + aviso;
 *  - criterio que la IA inventó (no está en la lista) → se descarta.
 *
 * Si no hay lista declarada, se devuelve `[]`: sin criterios del admin no hay
 * checklist (la IA no debe inventar uno). El match es tolerante a mayúsculas y
 * espacios para no perder una verificación real por diferencias cosméticas.
 */
export function reconciliarCriterios(
  devueltos: readonly CriterioReconciliado[],
  esperados: readonly string[],
): CriterioReconciliado[] {
  if (esperados.length === 0) {
    return []
  }

  const porClave = new Map<string, CriterioReconciliado>()
  for (const c of devueltos) {
    const clave = normalizar(c.criterio)
    // Primera aparición gana: si la IA duplica un criterio, ignoramos la copia.
    if (!porClave.has(clave)) {
      porClave.set(clave, c)
    }
  }

  return esperados.map((esperado) => {
    const encontrado = porClave.get(normalizar(esperado))
    if (encontrado) {
      // Usamos el texto canónico del admin, no el que la IA haya reescrito.
      return { criterio: esperado, cumple: encontrado.cumple, evidencia: encontrado.evidencia }
    }
    return { criterio: esperado, cumple: null, evidencia: EVIDENCIA_NO_EVALUADO }
  })
}

function normalizar(valor: string): string {
  return valor.trim().toLowerCase()
}
