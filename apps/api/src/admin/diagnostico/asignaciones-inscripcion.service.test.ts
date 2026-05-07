import { BadRequestException, ConflictException, NotFoundException } from "@nestjs/common"
import { describe, expect, it } from "vitest"
import {
  ACTOR_ID,
  CURSO_ID,
  INSCRIPCION_ID,
  MODULO_FE_ID,
  buildCursoAreas,
  buildInscripcionRow,
  buildInscripcionService,
  buildModulos,
} from "./asignaciones.test-helpers"

function setupCargas(prisma: ReturnType<typeof buildInscripcionService>["prisma"]) {
  prisma.cursoArea.findMany.mockResolvedValue(buildCursoAreas())
  prisma.modulo.findMany.mockResolvedValue(buildModulos())
  prisma.curso.findUniqueOrThrow.mockResolvedValue({ umbralBrechaNoCumple: 10 })
}

describe("AsignacionesInscripcionService.obtener", () => {
  it("404 si la inscripcion no existe", async () => {
    const { service, prisma } = buildInscripcionService()
    prisma.inscripcion.findUnique.mockResolvedValue(null)
    await expect(service.obtener(INSCRIPCION_ID)).rejects.toThrow(NotFoundException)
  })

  it("409 si la inscripcion no esta ACTIVA", async () => {
    const { service, prisma } = buildInscripcionService()
    prisma.inscripcion.findUnique.mockResolvedValue({
      ...buildInscripcionRow({}),
      estado: "ABANDONADA",
    })
    await expect(service.obtener(INSCRIPCION_ID)).rejects.toThrow(ConflictException)
  })

  it("retorna sugerencias y confirmadas existentes", async () => {
    const { service, prisma } = buildInscripcionService()
    prisma.inscripcion.findUnique.mockResolvedValue(buildInscripcionRow({ notaFe: 40 }))
    setupCargas(prisma)
    const r = await service.obtener(INSCRIPCION_ID)
    expect(r.cursoId).toBe(CURSO_ID)
    expect(r.tieneEvaluacion).toBe(true)
    expect(r.sugerencias[0]).toMatchObject({ moduloId: MODULO_FE_ID, tipo: "OBLIGATORIO" })
  })
})

describe("AsignacionesInscripcionService.reemplazar", () => {
  it("rechaza moduloIds duplicados con 400", async () => {
    const { service, prisma } = buildInscripcionService()
    prisma.inscripcion.findUnique.mockResolvedValue(buildInscripcionRow({ notaFe: 40 }))
    await expect(
      service.reemplazar(
        INSCRIPCION_ID,
        {
          asignaciones: [
            { moduloId: MODULO_FE_ID, tipo: "OBLIGATORIO" },
            { moduloId: MODULO_FE_ID, tipo: "RECOMENDADO" },
          ],
        },
        ACTOR_ID,
      ),
    ).rejects.toThrow(BadRequestException)
  })

  it("inscripciones LIBRE solo aceptan OPCIONAL", async () => {
    const { service, prisma } = buildInscripcionService()
    prisma.inscripcion.findUnique.mockResolvedValue(buildInscripcionRow({ tipo: "LIBRE" }))
    await expect(
      service.reemplazar(
        INSCRIPCION_ID,
        { asignaciones: [{ moduloId: MODULO_FE_ID, tipo: "OBLIGATORIO" }] },
        ACTOR_ID,
      ),
    ).rejects.toThrow(BadRequestException)
  })

  it("rechaza moduloId que no pertenece al curso", async () => {
    const { service, prisma } = buildInscripcionService()
    prisma.inscripcion.findUnique.mockResolvedValue(buildInscripcionRow({ notaFe: 40 }))
    prisma.modulo.count.mockResolvedValue(0)
    await expect(
      service.reemplazar(
        INSCRIPCION_ID,
        { asignaciones: [{ moduloId: MODULO_FE_ID, tipo: "OBLIGATORIO" }] },
        ACTOR_ID,
      ),
    ).rejects.toThrow(BadRequestException)
  })

  it("reemplaza, registra log y devuelve estado actualizado", async () => {
    const { service, prisma } = buildInscripcionService()
    prisma.inscripcion.findUnique.mockResolvedValue(buildInscripcionRow({ notaFe: 40 }))
    prisma.modulo.count.mockResolvedValue(1)
    setupCargas(prisma)
    await service.reemplazar(
      INSCRIPCION_ID,
      { asignaciones: [{ moduloId: MODULO_FE_ID, tipo: "OBLIGATORIO" }] },
      ACTOR_ID,
    )
    expect(prisma.asignacion.deleteMany).toHaveBeenCalled()
    expect(prisma.asignacion.createMany).toHaveBeenCalled()
    expect(prisma.logActividad.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ tipoAccion: "MODULOS_ASIGNADOS" }),
      }),
    )
  })
})

describe("AsignacionesInscripcionService.eliminar", () => {
  it("404 si no existe la asignacion", async () => {
    const { service, prisma } = buildInscripcionService()
    prisma.inscripcion.findUnique.mockResolvedValue(buildInscripcionRow({ notaFe: 40 }))
    await expect(service.eliminar(INSCRIPCION_ID, MODULO_FE_ID, ACTOR_ID)).rejects.toThrow(
      NotFoundException,
    )
  })
})
