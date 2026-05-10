import { ConflictException, NotFoundException } from "@nestjs/common"
import { describe, expect, it } from "vitest"
import {
  ACTOR_ID,
  CURSO_ID,
  INSCRIPCION_ID,
  QUERY_DEFAULT,
  buildRow,
  buildService,
} from "./inscripciones-curso.test-helpers"

describe("InscripcionesCursoService.listarPorCurso", () => {
  it("404 si el curso no existe", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(null)
    await expect(service.listarPorCurso(CURSO_ID, QUERY_DEFAULT)).rejects.toThrow(NotFoundException)
  })

  it("estadoInvitado=sin-login cuando el participante nunca hizo login", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue({ id: CURSO_ID, _count: { cursoAreas: 3 } })
    prisma.inscripcion.findMany.mockResolvedValue([buildRow({ ultimoLoginEn: null })])
    prisma.inscripcion.count.mockResolvedValue(1)

    const res = await service.listarPorCurso(CURSO_ID, QUERY_DEFAULT)

    expect(res.items).toHaveLength(1)
    expect(res.items[0]?.estadoInvitado).toBe("sin-login")
    expect(res.items[0]?.evaluacion.completa).toBe(false)
  })

  it("estadoInvitado=con-login-con-eval cuando cobertura completa", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue({ id: CURSO_ID, _count: { cursoAreas: 2 } })
    prisma.inscripcion.findMany.mockResolvedValue([
      buildRow({ ultimoLoginEn: new Date(), areasConDato: 2 }),
    ])
    prisma.inscripcion.count.mockResolvedValue(1)

    const res = await service.listarPorCurso(CURSO_ID, QUERY_DEFAULT)
    expect(res.items[0]?.estadoInvitado).toBe("con-login-con-eval")
    expect(res.items[0]?.evaluacion).toEqual({ areasConDato: 2, areasTotales: 2, completa: true })
  })

  it("filtra por estadoInvitado en memoria", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue({ id: CURSO_ID, _count: { cursoAreas: 2 } })
    prisma.inscripcion.findMany.mockResolvedValue([
      buildRow({ ultimoLoginEn: null }),
      buildRow({ ultimoLoginEn: new Date(), areasConDato: 2 }),
    ])
    prisma.inscripcion.count.mockResolvedValue(2)

    const res = await service.listarPorCurso(CURSO_ID, {
      ...QUERY_DEFAULT,
      estadoInvitado: "sin-login",
    })
    expect(res.items).toHaveLength(1)
    expect(res.items[0]?.estadoInvitado).toBe("sin-login")
  })
})

describe("InscripcionesCursoService.quitarDelCurso", () => {
  it("404 si la inscripcion no existe", async () => {
    const { service, prisma } = buildService()
    prisma.inscripcion.findUnique.mockResolvedValue(null)
    await expect(service.quitarDelCurso(CURSO_ID, INSCRIPCION_ID, ACTOR_ID)).rejects.toThrow(
      NotFoundException,
    )
  })

  it("404 si la inscripcion no pertenece al curso", async () => {
    const { service, prisma } = buildService()
    prisma.inscripcion.findUnique.mockResolvedValue({
      id: INSCRIPCION_ID,
      cursoId: "otro-curso",
      estado: "ACTIVA",
    })
    await expect(service.quitarDelCurso(CURSO_ID, INSCRIPCION_ID, ACTOR_ID)).rejects.toThrow(
      NotFoundException,
    )
  })

  it("409 si la inscripcion ya no esta ACTIVA", async () => {
    const { service, prisma } = buildService()
    prisma.inscripcion.findUnique.mockResolvedValue({
      id: INSCRIPCION_ID,
      cursoId: CURSO_ID,
      estado: "ABANDONADA",
    })
    await expect(service.quitarDelCurso(CURSO_ID, INSCRIPCION_ID, ACTOR_ID)).rejects.toThrow(
      ConflictException,
    )
  })

  it("marca ABANDONADA y registra log actividad", async () => {
    const { service, prisma } = buildService()
    prisma.inscripcion.findUnique.mockResolvedValue({
      id: INSCRIPCION_ID,
      cursoId: CURSO_ID,
      estado: "ACTIVA",
    })

    const res = await service.quitarDelCurso(CURSO_ID, INSCRIPCION_ID, ACTOR_ID)

    expect(res).toEqual({ tipo: "ELIMINADA", id: INSCRIPCION_ID })
    expect(prisma.inscripcion.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ estado: "ABANDONADA" }) }),
    )
    expect(prisma.logActividad.create).toHaveBeenCalled()
  })
})
