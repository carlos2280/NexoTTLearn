// Iter 10 · D-10.3 · tests del clasificador puro.

import { describe, expect, it } from "vitest"
import { type InputClasificador, clasificarEstadoSeguimiento } from "./seguimiento-clasificador"

const AREA_A = "00000000-0000-0000-0000-000000000010"
const AREA_B = "00000000-0000-0000-0000-000000000011"

function base(overrides: Partial<InputClasificador> = {}): InputClasificador {
  return {
    estadoInscripcion: "ACTIVA",
    etiqueta: "APROBADO",
    areas: [
      { areaId: AREA_A, umbralArea: 70 },
      { areaId: AREA_B, umbralArea: 70 },
    ],
    modulos: [
      { areaId: AREA_A, tipoAsignacion: "OBLIGATORIO", notaModulo: 80 },
      { areaId: AREA_B, tipoAsignacion: "OBLIGATORIO", notaModulo: 75 },
    ],
    notasArea: new Map([
      [AREA_A, 80],
      [AREA_B, 75],
    ]),
    transversal: null,
    entrevistaIA: null,
    ...overrides,
  }
}

describe("clasificarEstadoSeguimiento", () => {
  it("Completado: inscripcion COMPLETADA siempre", () => {
    expect(
      clasificarEstadoSeguimiento(
        base({ estadoInscripcion: "COMPLETADA", etiqueta: "INSUFICIENTE" }),
      ),
    ).toBe("Completado")
  })

  it("Apto: todos OBLIGATORIOS >= umbralArea, sin transversal ni entrevista", () => {
    expect(clasificarEstadoSeguimiento(base())).toBe("Apto")
  })

  it("Apto requiere transversal aprobado cuando el curso lo tiene", () => {
    const conTransversalNoAprobado = base({
      transversal: { umbralAprobacion: 70, ultimaNota: 50 },
    })
    expect(clasificarEstadoSeguimiento(conTransversalNoAprobado)).toBe("EnRuta")
    const conTransversalAprobado = base({
      transversal: { umbralAprobacion: 70, ultimaNota: 80 },
    })
    expect(clasificarEstadoSeguimiento(conTransversalAprobado)).toBe("Apto")
  })

  it("Apto requiere entrevistaIA aprobada cuando el curso la tiene", () => {
    const sinAprobar = base({ entrevistaIA: { aprobada: false } })
    expect(clasificarEstadoSeguimiento(sinAprobar)).toBe("EnRuta")
    const aprobada = base({ entrevistaIA: { aprobada: true } })
    expect(clasificarEstadoSeguimiento(aprobada)).toBe("Apto")
  })

  it("EnRiesgo: etiqueta INSUFICIENTE en ACTIVA", () => {
    expect(clasificarEstadoSeguimiento(base({ etiqueta: "INSUFICIENTE" }))).toBe("EnRiesgo")
  })

  it("EnRiesgo: area OBLIGATORIA sin notaArea (sin actividad)", () => {
    const input = base({
      notasArea: new Map([[AREA_A, 80]]), // falta AREA_B obligatoria
    })
    expect(clasificarEstadoSeguimiento(input)).toBe("EnRiesgo")
  })

  it("EnRuta: ACTIVA, sin INSUFICIENTE, sin areas obligatorias incompletas, pero algun OBLIGATORIO debajo de umbral", () => {
    const input = base({
      modulos: [
        { areaId: AREA_A, tipoAsignacion: "OBLIGATORIO", notaModulo: 80 },
        { areaId: AREA_B, tipoAsignacion: "OBLIGATORIO", notaModulo: 50 },
      ],
    })
    expect(clasificarEstadoSeguimiento(input)).toBe("EnRuta")
  })
})
