import type { MeAvanceSeccionEstado } from "@nexott-learn/shared-types"
import { describe, expect, it } from "vitest"
import { indexarEstadoAvancePorSeccion } from "./sidebar-plan.helpers"

const ESTADOS: readonly MeAvanceSeccionEstado[] = [
  { seccionId: "sec-1", completada: true, bloquesCompletados: 2, bloquesTotales: 2 },
  { seccionId: "sec-2", completada: false, bloquesCompletados: 1, bloquesTotales: 3 },
  { seccionId: "sec-3", completada: true, bloquesCompletados: 0, bloquesTotales: 0 },
]

describe("indexarEstadoAvancePorSeccion", () => {
  it("indexa por seccionId para consulta O(1)", () => {
    const map = indexarEstadoAvancePorSeccion(ESTADOS)
    expect(map.get("sec-2")).toEqual({
      seccionId: "sec-2",
      completada: false,
      bloquesCompletados: 1,
      bloquesTotales: 3,
    })
    expect(map.size).toBe(3)
  })

  it("devuelve mapa vacío si el avance aún no cargó (no inventa estado)", () => {
    expect(indexarEstadoAvancePorSeccion(undefined).size).toBe(0)
  })

  it("una sección desconocida devuelve undefined, no un falso completado", () => {
    expect(indexarEstadoAvancePorSeccion(ESTADOS).get("sec-inexistente")).toBeUndefined()
  })

  it("conserva el detalle de bloques: alimenta el ícono de reto del voluntario", () => {
    // Sin plan personal (D-AS-1) este es el único lugar de donde el sidebar
    // sabe que una sección tiene reto; antes el voluntario veía todo como
    // lectura.
    const map = indexarEstadoAvancePorSeccion(ESTADOS)
    expect(map.get("sec-2")?.bloquesTotales).toBe(3)
    expect(map.get("sec-3")?.bloquesTotales).toBe(0)
  })
})
