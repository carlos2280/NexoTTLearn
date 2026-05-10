import { RolUsuario as RolUsuarioPrisma } from "@prisma/client"
import { describe, expect, it } from "vitest"
import type { RolUsuario } from "./sesion.types"

describe("RolUsuario", () => {
  it("admite los literales ADMIN y PARTICIPANTE", () => {
    const admin: RolUsuario = "ADMIN"
    const participante: RolUsuario = "PARTICIPANTE"

    expect(admin).toBe(RolUsuarioPrisma.ADMIN)
    expect(participante).toBe(RolUsuarioPrisma.PARTICIPANTE)
  })

  it("expone exactamente dos miembros (ADMIN, PARTICIPANTE)", () => {
    const valores = Object.values(RolUsuarioPrisma).sort()
    expect(valores).toEqual(["ADMIN", "PARTICIPANTE"])
  })
})
