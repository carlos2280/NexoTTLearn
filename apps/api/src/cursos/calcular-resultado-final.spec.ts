import { RolAsignacion } from "@prisma/client"
import { describe, expect, it } from "vitest"
import { type NotaSkillSnapshot, calcularResultadoFinal } from "./calcular-resultado-final"

const skillObligatoriaCumple: NotaSkillSnapshot = {
  skillId: "s1",
  caracter: "OBLIGATORIA",
  notaActual: 80,
  umbralCumple: 75,
}

const skillObligatoriaNoCumple: NotaSkillSnapshot = {
  skillId: "s2",
  caracter: "OBLIGATORIA",
  notaActual: 60,
  umbralCumple: 75,
}

const skillObligatoriaSinNota: NotaSkillSnapshot = {
  skillId: "s3",
  caracter: "OBLIGATORIA",
  notaActual: null,
  umbralCumple: 75,
}

const skillOpcionalBaja: NotaSkillSnapshot = {
  skillId: "s4",
  caracter: "OPCIONAL",
  notaActual: 20,
  umbralCumple: 75,
}

describe("calcularResultadoFinal", () => {
  it("MANTENER_PENDIENTE devuelve null sin importar el rol", () => {
    expect(
      calcularResultadoFinal({
        rol: RolAsignacion.ASIGNADO,
        accion: "MANTENER_PENDIENTE",
        notasSkills: [],
      }),
    ).toBeNull()
    expect(
      calcularResultadoFinal({
        rol: RolAsignacion.VOLUNTARIO,
        accion: "MANTENER_PENDIENTE",
        notasSkills: [],
      }),
    ).toBeNull()
  })

  it("RETIRAR devuelve RETIRADO sin importar el rol ni notas", () => {
    expect(
      calcularResultadoFinal({
        rol: RolAsignacion.ASIGNADO,
        accion: "RETIRAR",
        notasSkills: [skillObligatoriaCumple],
      }),
    ).toBe("RETIRADO")
    expect(
      calcularResultadoFinal({
        rol: RolAsignacion.VOLUNTARIO,
        accion: "RETIRAR",
        notasSkills: [],
      }),
    ).toBe("RETIRADO")
  })

  it("VOLUNTARIO + CERRAR_APTO devuelve COMPLETADO", () => {
    expect(
      calcularResultadoFinal({
        rol: RolAsignacion.VOLUNTARIO,
        accion: "CERRAR_APTO",
        notasSkills: [skillObligatoriaNoCumple],
      }),
    ).toBe("COMPLETADO")
  })

  it("VOLUNTARIO + CERRAR_NO_APTO devuelve COMPLETADO (D58)", () => {
    expect(
      calcularResultadoFinal({
        rol: RolAsignacion.VOLUNTARIO,
        accion: "CERRAR_NO_APTO",
        notasSkills: [],
      }),
    ).toBe("COMPLETADO")
  })

  it("ASIGNADO + CERRAR_NO_APTO devuelve NO_APTO directo", () => {
    expect(
      calcularResultadoFinal({
        rol: RolAsignacion.ASIGNADO,
        accion: "CERRAR_NO_APTO",
        notasSkills: [skillObligatoriaCumple],
      }),
    ).toBe("NO_APTO")
  })

  it("ASIGNADO + CERRAR_APTO sin obligatorias devuelve APTO", () => {
    expect(
      calcularResultadoFinal({
        rol: RolAsignacion.ASIGNADO,
        accion: "CERRAR_APTO",
        notasSkills: [skillOpcionalBaja],
      }),
    ).toBe("APTO")
  })

  it("ASIGNADO + CERRAR_APTO con todas las obligatorias cumple devuelve APTO", () => {
    expect(
      calcularResultadoFinal({
        rol: RolAsignacion.ASIGNADO,
        accion: "CERRAR_APTO",
        notasSkills: [skillObligatoriaCumple, skillOpcionalBaja],
      }),
    ).toBe("APTO")
  })

  it("ASIGNADO + CERRAR_APTO con una obligatoria sin cumplir devuelve NO_APTO", () => {
    expect(
      calcularResultadoFinal({
        rol: RolAsignacion.ASIGNADO,
        accion: "CERRAR_APTO",
        notasSkills: [skillObligatoriaCumple, skillObligatoriaNoCumple],
      }),
    ).toBe("NO_APTO")
  })

  it("ASIGNADO + CERRAR_APTO con obligatoria sin nota devuelve NO_APTO", () => {
    expect(
      calcularResultadoFinal({
        rol: RolAsignacion.ASIGNADO,
        accion: "CERRAR_APTO",
        notasSkills: [skillObligatoriaSinNota],
      }),
    ).toBe("NO_APTO")
  })

  it("ASIGNADO + CERRAR_APTO con nota igual al umbral devuelve APTO (borde inclusivo)", () => {
    expect(
      calcularResultadoFinal({
        rol: RolAsignacion.ASIGNADO,
        accion: "CERRAR_APTO",
        notasSkills: [
          {
            skillId: "s1",
            caracter: "OBLIGATORIA",
            notaActual: 75,
            umbralCumple: 75,
          },
        ],
      }),
    ).toBe("APTO")
  })

  it("ASIGNADO + CERRAR_APTO ignora opcionales bajas para el calculo APTO", () => {
    expect(
      calcularResultadoFinal({
        rol: RolAsignacion.ASIGNADO,
        accion: "CERRAR_APTO",
        notasSkills: [skillObligatoriaCumple, skillOpcionalBaja],
      }),
    ).toBe("APTO")
  })
})
