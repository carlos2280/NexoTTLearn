import { BadRequestException, NotFoundException } from "@nestjs/common"
import { describe, expect, it } from "vitest"
import {
  ACTOR_ID,
  CURSO_ID,
  INSCRIPCION_ID,
  MODULO_BE_ID,
  MODULO_FE_ID,
  buildConfirmarLoteService,
} from "./asignaciones.test-helpers"

describe("AsignacionesConfirmarLoteService.confirmar", () => {
  it("404 si el curso no existe", async () => {
    const { service, prisma } = buildConfirmarLoteService()
    prisma.curso.findUnique.mockResolvedValue(null)
    await expect(
      service.confirmar(
        CURSO_ID,
        { items: [{ inscripcionId: INSCRIPCION_ID, asignaciones: [] }] },
        ACTOR_ID,
      ),
    ).rejects.toThrow(NotFoundException)
  })

  it("400 si una inscripcion no pertenece al curso o no esta ACTIVA", async () => {
    const { service, prisma } = buildConfirmarLoteService()
    prisma.curso.findUnique.mockResolvedValue({ id: CURSO_ID })
    prisma.inscripcion.findMany.mockResolvedValue([])
    await expect(
      service.confirmar(
        CURSO_ID,
        { items: [{ inscripcionId: INSCRIPCION_ID, asignaciones: [] }] },
        ACTOR_ID,
      ),
    ).rejects.toThrow(BadRequestException)
  })

  it("aplica + arma resumen cuantitativo (creadas/actualizadas/eliminadas)", async () => {
    const { service, prisma } = buildConfirmarLoteService()
    prisma.curso.findUnique.mockResolvedValue({ id: CURSO_ID })
    prisma.inscripcion.findMany.mockResolvedValue([
      {
        id: INSCRIPCION_ID,
        tipo: "SOLICITUD",
        asignaciones: [
          { moduloId: MODULO_FE_ID, tipo: "RECOMENDADO" },
          { moduloId: MODULO_BE_ID, tipo: "OPCIONAL" },
        ],
      },
    ])
    prisma.modulo.count.mockResolvedValue(2)

    const r = await service.confirmar(
      CURSO_ID,
      {
        items: [
          {
            inscripcionId: INSCRIPCION_ID,
            asignaciones: [
              { moduloId: MODULO_FE_ID, tipo: "OBLIGATORIO" },
              { moduloId: "00000000-0000-0000-0000-000000000a99", tipo: "RECOMENDADO" },
            ],
          },
        ],
      },
      ACTOR_ID,
    )
    expect(r.ok).toBe(true)
    expect(r.resumen).toMatchObject({
      candidatosAfectados: 1,
      asignacionesActualizadas: 1,
      asignacionesCreadas: 1,
      asignacionesEliminadas: 1,
      obligatorios: 1,
      recomendados: 1,
      opcionales: 0,
    })
    expect(prisma.logActividad.create).toHaveBeenCalled()
  })
})
