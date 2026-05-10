import { NotFoundException } from "@nestjs/common"
import { describe, expect, it } from "vitest"
import {
  CURSO_ID,
  buildCursoArea,
  buildInscripcion,
  buildService,
} from "./diagnostico-matriz.test-helpers"

const QUERY = {} as const

describe("DiagnosticoMatrizService.obtenerMatriz", () => {
  it("404 si el curso no existe", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(null)
    await expect(service.obtenerMatriz(CURSO_ID, QUERY)).rejects.toThrow(NotFoundException)
  })

  it("retorna areas y filas con celdas alineadas", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue({ id: CURSO_ID })
    prisma.cursoArea.findMany.mockResolvedValue([
      buildCursoArea({ areaId: "fe", objetivo: 70, orden: 0 }),
      buildCursoArea({ areaId: "be", objetivo: 70, orden: 1 }),
    ])
    prisma.inscripcion.findMany.mockResolvedValue([
      buildInscripcion({ id: "i1", notasPorArea: { fe: 80, be: 65 } }),
    ])

    const res = await service.obtenerMatriz(CURSO_ID, QUERY)

    expect(res.areas.map((a) => a.id)).toEqual(["fe", "be"])
    expect(res.filas).toHaveLength(1)
    expect(res.filas[0]?.celdas).toEqual([
      { areaId: "fe", nota: 80, semaforo: "verde" },
      { areaId: "be", nota: 65, semaforo: "amarillo" },
    ])
  })

  it("celdas vacias para areas sin captura", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue({ id: CURSO_ID })
    prisma.cursoArea.findMany.mockResolvedValue([
      buildCursoArea({ areaId: "fe", objetivo: 70 }),
      buildCursoArea({ areaId: "be", objetivo: 70 }),
    ])
    prisma.inscripcion.findMany.mockResolvedValue([
      buildInscripcion({ id: "i1", notasPorArea: { fe: 80 } }),
    ])

    const res = await service.obtenerMatriz(CURSO_ID, QUERY)
    expect(res.filas[0]?.celdas[1]).toEqual({ areaId: "be", nota: null, semaforo: "vacio" })
    expect(res.filas[0]?.cobertura).toEqual({ capturadas: 1, total: 2 })
  })

  it("semaforo rojo cuando brecha > 10", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue({ id: CURSO_ID })
    prisma.cursoArea.findMany.mockResolvedValue([buildCursoArea({ areaId: "fe", objetivo: 70 })])
    prisma.inscripcion.findMany.mockResolvedValue([
      buildInscripcion({ id: "i1", notasPorArea: { fe: 30 } }),
    ])

    const res = await service.obtenerMatriz(CURSO_ID, QUERY)
    expect(res.filas[0]?.celdas[0]?.semaforo).toBe("rojo")
  })

  it("filtro soloSinDatos descarta filas con cobertura completa", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue({ id: CURSO_ID })
    prisma.cursoArea.findMany.mockResolvedValue([buildCursoArea({ areaId: "fe", objetivo: 70 })])
    prisma.inscripcion.findMany.mockResolvedValue([
      buildInscripcion({ id: "i1", notasPorArea: { fe: 80 } }),
      buildInscripcion({ id: "i2" }),
    ])

    const res = await service.obtenerMatriz(CURSO_ID, { soloSinDatos: true })
    expect(res.filas.map((f) => f.inscripcionId)).toEqual(["i2"])
  })

  it("contadores agregados son consistentes", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue({ id: CURSO_ID })
    prisma.cursoArea.findMany.mockResolvedValue([
      buildCursoArea({ areaId: "fe", objetivo: 70 }),
      buildCursoArea({ areaId: "be", objetivo: 70 }),
    ])
    prisma.inscripcion.findMany.mockResolvedValue([
      buildInscripcion({ id: "i1", notasPorArea: { fe: 80, be: 75 } }),
      buildInscripcion({ id: "i2", notasPorArea: { fe: 60 } }),
    ])

    const res = await service.obtenerMatriz(CURSO_ID, QUERY)
    expect(res.contadores).toEqual({
      candidatos: 2,
      conDatosCompletos: 1,
      celdasCapturadas: 3,
      celdasTotales: 4,
    })
  })
})
