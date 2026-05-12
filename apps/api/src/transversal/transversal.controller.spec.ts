import { AccionAuditoria } from "@prisma/client"
import { Request } from "express"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { AuditLogService } from "../common/audit/audit-log.service"
import { PrismaService } from "../common/prisma/prisma.service"
import { SesionUsuario } from "../common/types/sesion.types"
import { TransversalController } from "./transversal.controller"
import { CargarCapaResult, TransversalService } from "./transversal.service"

/**
 * FIX-P8-cierre §5.116: el controller registra `INTENTO_TRANSVERSAL_CAPA_CARGADA`
 * fuera del TX y NO en replay idempotente (D-AUDIT-2). Spec dedicado a este
 * cableado — el spec del service cubre la mecanica interna de cada capa.
 */

const INTENTO_ID = "11111111-1111-1111-1111-111111111111"
const USUARIO_ID = "22222222-2222-2222-2222-222222222222"
const IDEMPOTENCY_KEY = "33333333-3333-3333-3333-333333333333"
const ADMIN_SESION: SesionUsuario = {
  usuarioId: USUARIO_ID,
  rol: "ADMIN" as never,
}

function buildResultado(
  capa: "tests" | "cualitativa" | "comprension",
  replay = false,
): CargarCapaResult {
  return {
    capa,
    replay,
    response: {
      intentoId: INTENTO_ID,
      estado: "EVALUADO",
      anulado: false,
      fecha: new Date("2026-05-12T00:00:00Z").toISOString(),
      repoUrl: null,
      comentarioColaborador: null,
      notaCapaTests: capa === "tests" ? 80 : null,
      notaCapaCualitativa: capa === "cualitativa" ? 80 : null,
      notaCapaComprension: capa === "comprension" ? 80 : null,
      notaGlobal: null,
      aprobado: null,
      motivoAnulacion: null,
      evaluacionesCapas: {},
    } as unknown as CargarCapaResult["response"],
  }
}

interface MockTransversal {
  cargarCapaTests: ReturnType<typeof vi.fn>
  cargarCapaCualitativa: ReturnType<typeof vi.fn>
  cargarCapaComprension: ReturnType<typeof vi.fn>
}

interface MockAudit {
  record: ReturnType<typeof vi.fn>
}

let transversal: MockTransversal
let auditLog: MockAudit
let controller: TransversalController
const reqFake = {
  ip: "127.0.0.1",
  headers: {},
  get: vi.fn().mockReturnValue(undefined),
} as unknown as Request

beforeEach(() => {
  transversal = {
    cargarCapaTests: vi.fn(),
    cargarCapaCualitativa: vi.fn(),
    cargarCapaComprension: vi.fn(),
  }
  auditLog = { record: vi.fn().mockResolvedValue(undefined) }
  controller = new TransversalController(
    transversal as unknown as TransversalService,
    auditLog as unknown as AuditLogService,
    {} as unknown as PrismaService,
  )
})

describe("TransversalController §5.116 — audit INTENTO_TRANSVERSAL_CAPA_CARGADA", () => {
  it("E7 cargarCapaTests registra audit cuando no es replay", async () => {
    transversal.cargarCapaTests.mockResolvedValue(buildResultado("tests"))
    await controller.cargarCapaTests(
      INTENTO_ID,
      { nota: 80, detalle: { fuente: "ci" } },
      IDEMPOTENCY_KEY,
      ADMIN_SESION,
      reqFake,
    )
    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({
        accion: AccionAuditoria.INTENTO_TRANSVERSAL_CAPA_CARGADA,
        recursoTipo: "intento_transversal",
        recursoId: INTENTO_ID,
        metadata: expect.objectContaining({ capa: "TESTS" }),
      }),
    )
  })

  it("E8 cargarCapaCualitativa registra audit con capa CUALITATIVA", async () => {
    transversal.cargarCapaCualitativa.mockResolvedValue(buildResultado("cualitativa"))
    await controller.cargarCapaCualitativa(
      INTENTO_ID,
      { nota: 80, detalle: { comentarios: "ok" } } as never,
      IDEMPOTENCY_KEY,
      ADMIN_SESION,
      reqFake,
    )
    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({
        accion: AccionAuditoria.INTENTO_TRANSVERSAL_CAPA_CARGADA,
        metadata: expect.objectContaining({ capa: "CUALITATIVA" }),
      }),
    )
  })

  it("E9 cargarCapaComprension registra audit con capa COMPRENSION", async () => {
    transversal.cargarCapaComprension.mockResolvedValue(buildResultado("comprension"))
    await controller.cargarCapaComprension(
      INTENTO_ID,
      { nota: 80, detalle: { resumen: "ok" } } as never,
      IDEMPOTENCY_KEY,
      ADMIN_SESION,
      reqFake,
    )
    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({
        accion: AccionAuditoria.INTENTO_TRANSVERSAL_CAPA_CARGADA,
        metadata: expect.objectContaining({ capa: "COMPRENSION" }),
      }),
    )
  })

  it("NO registra audit cuando la idempotencia devuelve replay=true (D-AUDIT-2)", async () => {
    transversal.cargarCapaTests.mockResolvedValue(buildResultado("tests", true))
    await controller.cargarCapaTests(
      INTENTO_ID,
      { nota: 80, detalle: { fuente: "ci" } },
      IDEMPOTENCY_KEY,
      ADMIN_SESION,
      reqFake,
    )
    expect(auditLog.record).not.toHaveBeenCalled()
  })
})
