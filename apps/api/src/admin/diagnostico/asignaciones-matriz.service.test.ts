import { NotFoundException } from "@nestjs/common"
import { describe, expect, it } from "vitest"
import {
  CURSO_ID,
  buildCursoAreas,
  buildInscripcionRow,
  buildMatrizService,
  buildModulos,
} from "./asignaciones.test-helpers"

describe("AsignacionesMatrizService.obtenerMatriz", () => {
  it("404 si el curso no existe", async () => {
    const { service, prisma } = buildMatrizService()
    prisma.curso.findUnique.mockResolvedValue(null)
    await expect(service.obtenerMatriz(CURSO_ID, {})).rejects.toThrow(NotFoundException)
  })

  it("retorna areas, modulos y candidatos con sugerencias y contadores", async () => {
    const { service, prisma } = buildMatrizService()
    prisma.curso.findUnique.mockResolvedValue({ id: CURSO_ID, umbralBrechaNoCumple: 10 })
    prisma.cursoArea.findMany.mockResolvedValue(buildCursoAreas())
    prisma.modulo.findMany.mockResolvedValue(buildModulos())
    prisma.inscripcion.findMany.mockResolvedValue([
      buildInscripcionRow({ notaFe: 50, notaBe: 80 }),
      buildInscripcionRow({ notaFe: 90, notaBe: 90 }),
      buildInscripcionRow({}),
    ])

    const r = await service.obtenerMatriz(CURSO_ID, {})

    expect(r.cursoId).toBe(CURSO_ID)
    expect(r.umbralBrechaNoCumple).toBe(10)
    expect(r.areas).toHaveLength(2)
    expect(r.modulos).toHaveLength(2)
    expect(r.candidatos).toHaveLength(3)
    expect(r.contadores).toEqual({
      candidatos: 3,
      conSugerencia: 1,
      cumplenTodo: 1,
      sinEvaluacion: 1,
      yaConfirmados: 0,
    })
  })
})
