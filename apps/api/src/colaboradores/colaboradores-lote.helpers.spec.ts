import { describe, expect, it } from "vitest"
import { prepararLoteColaboradores } from "./colaboradores-lote.helpers"

const DOMINIOS = ["emeal.nttdata.com"]

describe("prepararLoteColaboradores", () => {
  it("normaliza email (minusculas + trim) y nombre (trim)", () => {
    const { validos } = prepararLoteColaboradores(
      [{ email: "  Ana@Emeal.NTTData.com ", nombre: "  Ana  " }],
      DOMINIOS,
    )
    expect(validos).toEqual([{ email: "ana@emeal.nttdata.com", nombre: "Ana" }])
  })

  it("rechaza dominio no permitido y deja pasar el permitido", () => {
    const { validos, rechazados } = prepararLoteColaboradores(
      [
        { email: "ok@emeal.nttdata.com", nombre: "Ok" },
        { email: "fuera@gmail.com", nombre: "Fuera" },
      ],
      DOMINIOS,
    )
    expect(validos).toHaveLength(1)
    expect(rechazados).toEqual([
      { email: "fuera@gmail.com", nombre: "Fuera", motivo: "dominio_no_permitido" },
    ])
  })

  it("deduplica por email (case-insensitive), conserva la primera fila", () => {
    const { validos, rechazados } = prepararLoteColaboradores(
      [
        { email: "ana@emeal.nttdata.com", nombre: "Ana" },
        { email: "ANA@emeal.nttdata.com", nombre: "Ana dup" },
      ],
      DOMINIOS,
    )
    expect(validos).toEqual([{ email: "ana@emeal.nttdata.com", nombre: "Ana" }])
    expect(rechazados).toEqual([
      { email: "ana@emeal.nttdata.com", nombre: "Ana dup", motivo: "duplicado_en_lote" },
    ])
  })

  it("prioriza dominio sobre duplicado (fila invalida y repetida = dominio_no_permitido)", () => {
    const { rechazados } = prepararLoteColaboradores(
      [
        { email: "x@gmail.com", nombre: "Uno" },
        { email: "x@gmail.com", nombre: "Dos" },
      ],
      DOMINIOS,
    )
    expect(rechazados.every((r) => r.motivo === "dominio_no_permitido")).toBe(true)
  })

  it("con '*' permite cualquier dominio", () => {
    const { validos, rechazados } = prepararLoteColaboradores(
      [{ email: "libre@cualquiera.com", nombre: "Libre" }],
      ["*"],
    )
    expect(validos).toHaveLength(1)
    expect(rechazados).toHaveLength(0)
  })
})
