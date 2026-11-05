import { ConflictException, NotFoundException } from "@nestjs/common"
import { Test } from "@nestjs/testing"
import { AccionAuditoria, EstadoCurso } from "@prisma/client"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { AuditLogService } from "../../common/audit/audit-log.service"
import { PrismaService } from "../../common/prisma/prisma.service"
import { PlanPersonalRecalculoService } from "../../plan-personal/plan-personal-recalculo.service"
import { RepararSkillsCursoService } from "./reparar-skills.service"

function cursoRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "c1",
    titulo: "Data Engineer - AWS",
    estado: EstadoCurso.ACTIVO,
    areasExigidas: [],
    skillsExigidas: [],
    modulosHabilitados: [
      {
        modulo: {
          id: "m1",
          titulo: "Semana 1",
          secciones: [
            {
              id: "s1",
              skills: [],
              bloques: [{ id: "p1", tipo: "PARRAFO", esEvaluable: false, skillQueMideId: null }],
            },
            {
              id: "s2",
              skills: [],
              bloques: [{ id: "q1", tipo: "QUIZ", esEvaluable: true, skillQueMideId: null }],
            },
          ],
        },
      },
    ],
    ...overrides,
  }
}

function buildTx() {
  return {
    area: { upsert: vi.fn().mockResolvedValue({ id: "area-nueva" }) },
    skill: { upsert: vi.fn().mockResolvedValue({ id: "k-def" }) },
    bloque: { update: vi.fn().mockResolvedValue({ id: "q1" }) },
    seccionSkill: { createMany: vi.fn().mockResolvedValue({ count: 0 }) },
    cursoSkillExigida: { createMany: vi.fn().mockResolvedValue({ count: 0 }) },
    cursoAreaExigida: { create: vi.fn().mockResolvedValue({}) },
  }
}

let tx: ReturnType<typeof buildTx>
let prisma: {
  curso: { findUnique: ReturnType<typeof vi.fn> }
  asignacionCurso: { count: ReturnType<typeof vi.fn> }
  $transaction: ReturnType<typeof vi.fn>
}
let audit: { record: ReturnType<typeof vi.fn> }
let recalculo: { recalcularMasivo: ReturnType<typeof vi.fn> }
let service: RepararSkillsCursoService

beforeEach(async () => {
  tx = buildTx()
  prisma = {
    curso: { findUnique: vi.fn().mockResolvedValue(cursoRow()) },
    asignacionCurso: { count: vi.fn().mockResolvedValue(4) },
    $transaction: vi.fn(async (cb: (t: typeof tx) => Promise<unknown>) => await cb(tx)),
  }
  audit = { record: vi.fn().mockResolvedValue(undefined) }
  recalculo = {
    recalcularMasivo: vi
      .fn()
      .mockResolvedValue({ cursoId: "c1", total: 4, recalculadas: 4, fallidas: 0, duracionMs: 1 }),
  }
  const ref = await Test.createTestingModule({
    providers: [
      {
        provide: RepararSkillsCursoService,
        useFactory: (p: PrismaService, a: AuditLogService, r: PlanPersonalRecalculoService) =>
          new RepararSkillsCursoService(p, a, r),
        inject: [PrismaService, AuditLogService, PlanPersonalRecalculoService],
      },
      { provide: PrismaService, useValue: prisma },
      { provide: AuditLogService, useValue: audit },
      { provide: PlanPersonalRecalculoService, useValue: recalculo },
    ],
  }).compile()
  service = ref.get(RepararSkillsCursoService)
})

describe("RepararSkillsCursoService.reparar", () => {
  it("curso sin skills: completa bloque, secciones, exigidas y área, y recalcula", async () => {
    const res = await service.reparar("c1", "admin-1")

    expect(tx.skill.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { etiquetaVisible: "Data Engineer - AWS · Semana 1" },
        create: { etiquetaVisible: "Data Engineer - AWS · Semana 1", areaId: "area-nueva" },
      }),
    )
    // Sin subir version: los intentos existentes no se invalidan.
    expect(tx.bloque.update).toHaveBeenCalledWith({
      where: { id: "q1" },
      data: { skillQueMideId: "k-def" },
      select: { id: true },
    })
    expect(tx.seccionSkill.createMany).toHaveBeenCalledWith({
      data: [
        { seccionId: "s1", skillId: "k-def" },
        { seccionId: "s2", skillId: "k-def" },
      ],
      skipDuplicates: true,
    })
    expect(tx.cursoSkillExigida.createMany).toHaveBeenCalledWith({
      data: [{ cursoId: "c1", skillId: "k-def", notaMinima: 60 }],
      skipDuplicates: true,
    })
    expect(tx.cursoAreaExigida.create).toHaveBeenCalledWith({
      data: { cursoId: "c1", areaId: "area-nueva", peso: 100, puntajeObjetivo: 60 },
    })
    expect(recalculo.recalcularMasivo).toHaveBeenCalledWith("c1", "admin-1")
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        accion: AccionAuditoria.MODULO_ACTUALIZADO,
        recursoId: "m1",
        metadata: expect.objectContaining({ origen: "REPARAR_SKILLS", cursoId: "c1" }),
      }),
    )
    expect(res).toEqual({
      cursoId: "c1",
      bloquesCompletados: 1,
      seccionesCompletadas: 2,
      skillsExigidasAgregadas: 1,
      areaExigidaAgregada: true,
      planes: { total: 4, recalculados: 4, fallidos: 0 },
    })
  })

  it("curso con área exigida: cuelga las skills nuevas de esa área y no crea otra", async () => {
    prisma.curso.findUnique.mockResolvedValue(cursoRow({ areasExigidas: [{ areaId: "area-ya" }] }))

    const res = await service.reparar("c1", "admin-1")

    expect(tx.area.upsert).not.toHaveBeenCalled()
    expect(tx.cursoAreaExigida.create).not.toHaveBeenCalled()
    expect(tx.skill.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ create: expect.objectContaining({ areaId: "area-ya" }) }),
    )
    expect(res.areaExigidaAgregada).toBe(false)
  })

  it("curso ya completo: no escribe, no recalcula ni notifica", async () => {
    prisma.curso.findUnique.mockResolvedValue(
      cursoRow({
        areasExigidas: [{ areaId: "a" }],
        skillsExigidas: [{ skillId: "k" }],
        modulosHabilitados: [
          {
            modulo: {
              id: "m1",
              titulo: "M",
              secciones: [
                {
                  id: "s1",
                  skills: [{ skillId: "k" }],
                  bloques: [{ id: "q", tipo: "QUIZ", esEvaluable: true, skillQueMideId: "k" }],
                },
              ],
            },
          },
        ],
      }),
    )

    const res = await service.reparar("c1", "admin-1")

    expect(prisma.$transaction).not.toHaveBeenCalled()
    expect(recalculo.recalcularMasivo).not.toHaveBeenCalled()
    expect(res.planes).toEqual({ total: 0, recalculados: 0, fallidos: 0 })
  })

  it("curso inexistente: 404", async () => {
    prisma.curso.findUnique.mockResolvedValue(null)
    await expect(service.reparar("c1", "admin-1")).rejects.toBeInstanceOf(NotFoundException)
  })

  it("curso cerrado: 409 y no toca nada", async () => {
    prisma.curso.findUnique.mockResolvedValue(cursoRow({ estado: EstadoCurso.CERRADO }))
    await expect(service.reparar("c1", "admin-1")).rejects.toBeInstanceOf(ConflictException)
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })
})

describe("RepararSkillsCursoService.previsualizar", () => {
  it("cuenta lo que cambiaría sin escribir nada", async () => {
    const res = await service.previsualizar("c1")

    expect(res).toEqual({
      cursoId: "c1",
      bloques: 1,
      secciones: 2,
      skillsExigidas: 1,
      areaExigida: true,
      planes: 4,
    })
    expect(prisma.$transaction).not.toHaveBeenCalled()
    expect(prisma.asignacionCurso.count).toHaveBeenCalledWith({
      where: expect.objectContaining({ cursoId: "c1", rol: "ASIGNADO" }),
    })
  })

  it("curso cerrado: 409", async () => {
    prisma.curso.findUnique.mockResolvedValue(cursoRow({ estado: EstadoCurso.CERRADO }))
    await expect(service.previsualizar("c1")).rejects.toBeInstanceOf(ConflictException)
  })
})
