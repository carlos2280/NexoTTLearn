import { CanalNotif, EstadoEmpleado, TipoEventoNotif } from "@prisma/client"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { AuditLogService } from "../common/audit/audit-log.service"
import { PrismaService } from "../common/prisma/prisma.service"
import { EnvioArgs, EnvioResultado, IEmailProvider } from "./email/email-provider.interface"
import { NotificacionesService } from "./notificaciones.service"
import { catalogoTipoEvento } from "./tipo-evento.constants"

interface PrismaMock {
  usuario: { findUnique: ReturnType<typeof vi.fn> }
  preferenciaNotificacion: {
    findUnique: ReturnType<typeof vi.fn>
    findMany: ReturnType<typeof vi.fn>
    deleteMany: ReturnType<typeof vi.fn>
    upsert: ReturnType<typeof vi.fn>
  }
  notificacion: {
    create: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
    updateMany: ReturnType<typeof vi.fn>
    findFirst: ReturnType<typeof vi.fn>
    findMany: ReturnType<typeof vi.fn>
    count: ReturnType<typeof vi.fn>
  }
  notificacionCanal: { create: ReturnType<typeof vi.fn> }
  $transaction: ReturnType<typeof vi.fn>
}

function buildPrismaMock(): PrismaMock {
  const notif = {
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
  }
  const canales = { create: vi.fn() }
  const prisma: PrismaMock = {
    usuario: { findUnique: vi.fn() },
    preferenciaNotificacion: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      deleteMany: vi.fn(),
      upsert: vi.fn(),
    },
    notificacion: notif,
    notificacionCanal: canales,
    $transaction: vi.fn(),
  }
  // `$transaction([...])` con array devuelve los resultados literales.
  // `$transaction(async tx => ...)` ejecuta el callback con el mismo mock.
  prisma.$transaction.mockImplementation(
    async (arg: ((tx: PrismaMock) => Promise<unknown>) | readonly Promise<unknown>[]) => {
      if (typeof arg === "function") {
        return arg(prisma)
      }
      return Promise.all(arg)
    },
  )
  return prisma
}

function buildAuditMock(): AuditLogService {
  return { record: vi.fn().mockResolvedValue(undefined) } as unknown as AuditLogService
}

class StubEmailProvider implements IEmailProvider {
  public readonly providerName = "mock" as const
  public llamadas: EnvioArgs[] = []
  private respuesta: EnvioResultado = { enviado: true }

  enviar(args: EnvioArgs): Promise<EnvioResultado> {
    this.llamadas.push(args)
    return Promise.resolve(this.respuesta)
  }

  programar(respuesta: EnvioResultado): void {
    this.respuesta = respuesta
  }
}

const USUARIO_ID = "11111111-1111-1111-1111-111111111111"
const NOTIF_ID = "22222222-2222-2222-2222-222222222222"

describe("NotificacionesService.crear", () => {
  let prisma: PrismaMock
  let email: StubEmailProvider
  let service: NotificacionesService

  beforeEach(() => {
    prisma = buildPrismaMock()
    email = new StubEmailProvider()
    service = new NotificacionesService(prisma as unknown as PrismaService, email, buildAuditMock())
  })

  it("no-op cuando el usuario es EX_EMPLEADO (§19.3 punto 5)", async () => {
    prisma.usuario.findUnique.mockResolvedValue({
      id: USUARIO_ID,
      colaborador: { email: "ex@nexott.app", estadoEmpleado: EstadoEmpleado.EX_EMPLEADO },
    })

    const resultado = await service.crear({
      usuarioId: USUARIO_ID,
      tipo: TipoEventoNotif.PLAN_RECALCULADO,
      payload: {},
    })

    expect(resultado).toEqual({ creada: false, motivo: "ex-empleado" })
    expect(prisma.notificacion.create).not.toHaveBeenCalled()
    expect(email.llamadas).toHaveLength(0)
  })

  it("no-op cuando el usuario no existe (defensa adicional)", async () => {
    prisma.usuario.findUnique.mockResolvedValue(null)

    const resultado = await service.crear({
      usuarioId: USUARIO_ID,
      tipo: TipoEventoNotif.PLAN_RECALCULADO,
      payload: {},
    })

    expect(resultado).toEqual({ creada: false, motivo: "ex-empleado" })
    expect(prisma.notificacion.create).not.toHaveBeenCalled()
  })

  it("no-op cuando el usuario ha silenciado un tipo no critico", async () => {
    prisma.usuario.findUnique.mockResolvedValue({
      id: USUARIO_ID,
      colaborador: { email: "u@nexott.app", estadoEmpleado: EstadoEmpleado.ACTIVO },
    })
    prisma.preferenciaNotificacion.findUnique.mockResolvedValue({ silenciado: true })

    const resultado = await service.crear({
      usuarioId: USUARIO_ID,
      tipo: TipoEventoNotif.PLAN_RECALCULADO,
      payload: {},
    })

    expect(resultado).toEqual({ creada: false, motivo: "silenciado" })
    expect(prisma.notificacion.create).not.toHaveBeenCalled()
  })

  it("ignora la preferencia silenciada cuando el tipo es critico (§19.3 punto 1)", async () => {
    prisma.usuario.findUnique.mockResolvedValue({
      id: USUARIO_ID,
      colaborador: { email: "u@nexott.app", estadoEmpleado: EstadoEmpleado.ACTIVO },
    })
    prisma.notificacion.create.mockResolvedValue({ id: NOTIF_ID })
    prisma.notificacionCanal.create.mockResolvedValue({})

    const resultado = await service.crear({
      usuarioId: USUARIO_ID,
      tipo: TipoEventoNotif.RESULTADO_CIERRE,
      payload: { asignacionId: "a", cursoTitulo: "Curso", resultado: "APTO" },
    })

    expect(prisma.preferenciaNotificacion.findUnique).not.toHaveBeenCalled()
    expect(resultado).toEqual({
      creada: true,
      notificacionId: NOTIF_ID,
      canalesEnviados: [CanalNotif.IN_APP],
    })
    const createCall = prisma.notificacion.create.mock.calls[0]?.[0] as {
      data: { esCritico: boolean }
    }
    expect(createCall.data.esCritico).toBe(true)
  })

  it("crea IN_APP solo cuando no hay plantilla disponible para el tipo (P10a default)", async () => {
    prisma.usuario.findUnique.mockResolvedValue({
      id: USUARIO_ID,
      colaborador: { email: "u@nexott.app", estadoEmpleado: EstadoEmpleado.ACTIVO },
    })
    prisma.preferenciaNotificacion.findUnique.mockResolvedValue(null)
    prisma.notificacion.create.mockResolvedValue({ id: NOTIF_ID })
    prisma.notificacionCanal.create.mockResolvedValue({})

    const resultado = await service.crear({
      usuarioId: USUARIO_ID,
      tipo: TipoEventoNotif.PLAN_RECALCULADO,
      payload: { planId: "p", asignacionId: "a", cursoTitulo: "Curso" },
    })

    expect(resultado).toEqual({
      creada: true,
      notificacionId: NOTIF_ID,
      canalesEnviados: [CanalNotif.IN_APP],
    })
    expect(email.llamadas).toHaveLength(0)
    expect(prisma.notificacionCanal.create).toHaveBeenCalledTimes(1)
  })

  it("persiste error_correo cuando el provider devuelve fallo en un tipo con plantilla", async () => {
    const spy = vi.spyOn(catalogoTipoEvento, "tienePlantilla").mockReturnValue(true)
    try {
      prisma.usuario.findUnique.mockResolvedValue({
        id: USUARIO_ID,
        colaborador: { email: "u@nexott.app", estadoEmpleado: EstadoEmpleado.ACTIVO },
      })
      prisma.preferenciaNotificacion.findUnique.mockResolvedValue(null)
      prisma.notificacion.create.mockResolvedValue({ id: NOTIF_ID })
      prisma.notificacionCanal.create.mockResolvedValue({})
      prisma.notificacion.update.mockResolvedValue({ id: NOTIF_ID })
      email.programar({
        enviado: false,
        motivo: "error-resend",
        detalle: "Resend down",
      })

      const resultado = await service.crear({
        usuarioId: USUARIO_ID,
        tipo: TipoEventoNotif.PLAN_RECALCULADO,
        payload: { planId: "p", asignacionId: "a", cursoTitulo: "Curso" },
      })

      expect(resultado).toMatchObject({ creada: true, canalesEnviados: [CanalNotif.IN_APP] })
      expect(email.llamadas).toHaveLength(1)
      expect(prisma.notificacion.update).toHaveBeenCalledWith({
        where: { id: NOTIF_ID },
        data: { errorCorreo: "Resend down" },
      })
    } finally {
      spy.mockRestore()
    }
  })

  it("registra canal CORREO cuando el envio email es exitoso (modo AUTOMATICO)", async () => {
    const spy = vi.spyOn(catalogoTipoEvento, "tienePlantilla").mockReturnValue(true)
    try {
      prisma.usuario.findUnique.mockResolvedValue({
        id: USUARIO_ID,
        colaborador: { email: "u@nexott.app", estadoEmpleado: EstadoEmpleado.ACTIVO },
      })
      prisma.preferenciaNotificacion.findUnique.mockResolvedValue(null)
      prisma.notificacion.create.mockResolvedValue({ id: NOTIF_ID })
      prisma.notificacionCanal.create.mockResolvedValue({})
      email.programar({ enviado: true })

      const resultado = await service.crear({
        usuarioId: USUARIO_ID,
        tipo: TipoEventoNotif.PLAN_RECALCULADO,
        payload: { planId: "p", asignacionId: "a", cursoTitulo: "Curso" },
      })

      expect(resultado).toMatchObject({
        creada: true,
        canalesEnviados: [CanalNotif.IN_APP, CanalNotif.CORREO],
      })
      expect(prisma.notificacionCanal.create).toHaveBeenCalledTimes(2)
      expect(prisma.notificacion.update).not.toHaveBeenCalled()
    } finally {
      spy.mockRestore()
    }
  })

  it("modo MANUAL (flag-deshabilitado) registra error_correo y no anade canal CORREO", async () => {
    const spy = vi.spyOn(catalogoTipoEvento, "tienePlantilla").mockReturnValue(true)
    try {
      prisma.usuario.findUnique.mockResolvedValue({
        id: USUARIO_ID,
        colaborador: { email: "u@nexott.app", estadoEmpleado: EstadoEmpleado.ACTIVO },
      })
      prisma.preferenciaNotificacion.findUnique.mockResolvedValue(null)
      prisma.notificacion.create.mockResolvedValue({ id: NOTIF_ID })
      prisma.notificacionCanal.create.mockResolvedValue({})
      prisma.notificacion.update.mockResolvedValue({ id: NOTIF_ID })
      email.programar({ enviado: false, motivo: "flag-deshabilitado" })

      const resultado = await service.crear({
        usuarioId: USUARIO_ID,
        tipo: TipoEventoNotif.PLAN_RECALCULADO,
        payload: { planId: "p", asignacionId: "a", cursoTitulo: "Curso" },
      })

      expect(resultado).toMatchObject({ creada: true, canalesEnviados: [CanalNotif.IN_APP] })
      expect(prisma.notificacion.update).toHaveBeenCalledWith({
        where: { id: NOTIF_ID },
        data: { errorCorreo: "flag-deshabilitado" },
      })
    } finally {
      spy.mockRestore()
    }
  })

  it("no consulta preferencias para tipos criticos (corto-circuito de §19.3 punto 1)", async () => {
    prisma.usuario.findUnique.mockResolvedValue({
      id: USUARIO_ID,
      colaborador: { email: "u@nexott.app", estadoEmpleado: EstadoEmpleado.ACTIVO },
    })
    prisma.notificacion.create.mockResolvedValue({ id: NOTIF_ID })
    prisma.notificacionCanal.create.mockResolvedValue({})

    await service.crear({
      usuarioId: USUARIO_ID,
      tipo: TipoEventoNotif.ASIGNACION_CURSO,
      payload: {},
    })

    expect(prisma.preferenciaNotificacion.findUnique).not.toHaveBeenCalled()
  })
})

// =============================================================================
// P10b — Inbox + preferencias.
// =============================================================================

const OTRO_USUARIO_ID = "33333333-3333-3333-3333-333333333333"

function buildService(): {
  prisma: PrismaMock
  audit: AuditLogService
  service: NotificacionesService
} {
  const prisma = buildPrismaMock()
  const email = new StubEmailProvider()
  const audit = buildAuditMock()
  const service = new NotificacionesService(prisma as unknown as PrismaService, email, audit)
  return { prisma, audit, service }
}

describe("NotificacionesService.listarPorUsuario", () => {
  it("filtra por usuario, leida, archivada y tipoEvento, y devuelve paginado", async () => {
    const { prisma, service } = buildService()
    prisma.notificacion.findMany.mockResolvedValue([
      {
        id: NOTIF_ID,
        tipoEvento: TipoEventoNotif.PLAN_RECALCULADO,
        esCritico: false,
        fechaCreacion: new Date("2026-05-01T00:00:00Z"),
        leida: false,
        fechaLeida: null,
        archivada: false,
      },
    ])
    prisma.notificacion.count.mockResolvedValue(1)

    const result = await service.listarPorUsuario({
      usuarioId: USUARIO_ID,
      query: {
        page: 1,
        pageSize: 20,
        archivada: false,
        sort: "-fechaCreacion",
        leida: false,
        tipoEvento: [TipoEventoNotif.PLAN_RECALCULADO],
        desde: new Date("2026-04-01T00:00:00Z"),
        hasta: new Date("2026-06-01T00:00:00Z"),
      },
    })

    expect(result.meta).toEqual({ page: 1, pageSize: 20, total: 1, totalPages: 1 })
    expect(result.data[0]?.fechaCreacion).toBe("2026-05-01T00:00:00.000Z")
    const findCall = prisma.notificacion.findMany.mock.calls[0]?.[0] as {
      where: Record<string, unknown>
      orderBy: { fechaCreacion: "desc" | "asc" }
    }
    expect(findCall.where.usuarioId).toBe(USUARIO_ID)
    expect(findCall.where.leida).toBe(false)
    expect(findCall.where.archivada).toBe(false)
    expect(findCall.where.tipoEvento).toEqual({ in: [TipoEventoNotif.PLAN_RECALCULADO] })
    expect(findCall.where.fechaCreacion).toEqual({
      gte: new Date("2026-04-01T00:00:00Z"),
      lte: new Date("2026-06-01T00:00:00Z"),
    })
    expect(findCall.orderBy.fechaCreacion).toBe("desc")
  })

  it("omite leida del where cuando query.leida es undefined", async () => {
    const { prisma, service } = buildService()
    prisma.notificacion.findMany.mockResolvedValue([])
    prisma.notificacion.count.mockResolvedValue(0)

    await service.listarPorUsuario({
      usuarioId: USUARIO_ID,
      query: { page: 1, pageSize: 20, archivada: false, sort: "-fechaCreacion" },
    })

    const findCall = prisma.notificacion.findMany.mock.calls[0]?.[0] as {
      where: Record<string, unknown>
    }
    expect("leida" in findCall.where).toBe(false)
  })

  it("sort=fechaCreacion produce orden ascendente", async () => {
    const { prisma, service } = buildService()
    prisma.notificacion.findMany.mockResolvedValue([])
    prisma.notificacion.count.mockResolvedValue(0)

    await service.listarPorUsuario({
      usuarioId: USUARIO_ID,
      query: { page: 1, pageSize: 20, archivada: false, sort: "fechaCreacion" },
    })

    const findCall = prisma.notificacion.findMany.mock.calls[0]?.[0] as {
      orderBy: { fechaCreacion: "asc" | "desc" }
    }
    expect(findCall.orderBy.fechaCreacion).toBe("asc")
  })
})

describe("NotificacionesService.contarNoLeidas", () => {
  it("cuenta solo notif no leidas y no archivadas del usuario", async () => {
    const { prisma, service } = buildService()
    prisma.notificacion.count.mockResolvedValue(7)

    const total = await service.contarNoLeidas(USUARIO_ID)

    expect(total).toBe(7)
    expect(prisma.notificacion.count).toHaveBeenCalledWith({
      where: { usuarioId: USUARIO_ID, leida: false, archivada: false },
    })
  })
})

describe("NotificacionesService.obtenerDetalle", () => {
  it("devuelve detalle con canalesEnviados mapeados", async () => {
    const { prisma, service } = buildService()
    prisma.notificacion.findFirst.mockResolvedValue({
      id: NOTIF_ID,
      tipoEvento: TipoEventoNotif.PLAN_RECALCULADO,
      esCritico: false,
      payload: { planId: "p1" },
      fechaCreacion: new Date("2026-05-01T00:00:00Z"),
      leida: false,
      fechaLeida: null,
      archivada: false,
      errorCorreo: null,
      canales: [{ canal: CanalNotif.IN_APP }, { canal: CanalNotif.CORREO }],
    })

    const detalle = await service.obtenerDetalle(USUARIO_ID, NOTIF_ID)

    expect(detalle.canalesEnviados).toEqual([CanalNotif.IN_APP, CanalNotif.CORREO])
    expect(detalle.payload).toEqual({ planId: "p1" })
  })

  it("404 cuando la notif pertenece a otro usuario (sin revelar existencia)", async () => {
    const { prisma, service } = buildService()
    prisma.notificacion.findFirst.mockResolvedValue(null)

    await expect(service.obtenerDetalle(OTRO_USUARIO_ID, NOTIF_ID)).rejects.toMatchObject({
      response: {
        code: "NOTIFICACION_NO_ENCONTRADA",
      },
    })
    const findCall = prisma.notificacion.findFirst.mock.calls[0]?.[0] as {
      where: { id: string; usuarioId: string }
    }
    expect(findCall.where.usuarioId).toBe(OTRO_USUARIO_ID)
  })
})

describe("NotificacionesService.marcarLeida", () => {
  it("update con count>0 no consulta existencia (race-safe)", async () => {
    const { prisma, service } = buildService()
    prisma.notificacion.updateMany.mockResolvedValue({ count: 1 })

    await service.marcarLeida(USUARIO_ID, NOTIF_ID)

    expect(prisma.notificacion.updateMany).toHaveBeenCalledWith({
      where: { id: NOTIF_ID, usuarioId: USUARIO_ID, leida: false },
      data: { leida: true, fechaLeida: expect.any(Date) as Date },
    })
    expect(prisma.notificacion.findFirst).not.toHaveBeenCalled()
  })

  it("count=0 + existe en BD -> noop sin error (idempotente)", async () => {
    const { prisma, service } = buildService()
    prisma.notificacion.updateMany.mockResolvedValue({ count: 0 })
    prisma.notificacion.findFirst.mockResolvedValue({ id: NOTIF_ID })

    await expect(service.marcarLeida(USUARIO_ID, NOTIF_ID)).resolves.toBeUndefined()
  })

  it("count=0 + no existe -> 404", async () => {
    const { prisma, service } = buildService()
    prisma.notificacion.updateMany.mockResolvedValue({ count: 0 })
    prisma.notificacion.findFirst.mockResolvedValue(null)

    await expect(service.marcarLeida(USUARIO_ID, NOTIF_ID)).rejects.toMatchObject({
      response: { code: "NOTIFICACION_NO_ENCONTRADA" },
    })
  })
})

describe("NotificacionesService.marcarTodasLeidas", () => {
  it("update global del usuario sin verificacion previa", async () => {
    const { prisma, service } = buildService()
    prisma.notificacion.updateMany.mockResolvedValue({ count: 5 })

    await service.marcarTodasLeidas(USUARIO_ID)

    expect(prisma.notificacion.updateMany).toHaveBeenCalledWith({
      where: { usuarioId: USUARIO_ID, leida: false },
      data: { leida: true, fechaLeida: expect.any(Date) as Date },
    })
  })

  it("noop cuando no hay no-leidas (count=0)", async () => {
    const { prisma, service } = buildService()
    prisma.notificacion.updateMany.mockResolvedValue({ count: 0 })

    await expect(service.marcarTodasLeidas(USUARIO_ID)).resolves.toBeUndefined()
  })
})

describe("NotificacionesService.archivar", () => {
  it("update count>0 = idempotente", async () => {
    const { prisma, service } = buildService()
    prisma.notificacion.updateMany.mockResolvedValue({ count: 1 })

    await service.archivar(USUARIO_ID, NOTIF_ID)

    expect(prisma.notificacion.updateMany).toHaveBeenCalledWith({
      where: { id: NOTIF_ID, usuarioId: USUARIO_ID, archivada: false },
      data: { archivada: true },
    })
  })

  it("count=0 + no existe -> 404", async () => {
    const { prisma, service } = buildService()
    prisma.notificacion.updateMany.mockResolvedValue({ count: 0 })
    prisma.notificacion.findFirst.mockResolvedValue(null)

    await expect(service.archivar(USUARIO_ID, NOTIF_ID)).rejects.toMatchObject({
      response: { code: "NOTIFICACION_NO_ENCONTRADA" },
    })
  })
})

describe("NotificacionesService.obtenerPreferencias", () => {
  it("devuelve silenciados + tiposCriticos hardcodeados", async () => {
    const { prisma, service } = buildService()
    prisma.preferenciaNotificacion.findMany.mockResolvedValue([
      { tipoEvento: TipoEventoNotif.PLAN_RECALCULADO },
      { tipoEvento: TipoEventoNotif.TRANSVERSAL_DISPONIBLE },
    ])

    const prefs = await service.obtenerPreferencias(USUARIO_ID)

    expect(prefs.silenciados).toEqual([
      TipoEventoNotif.PLAN_RECALCULADO,
      TipoEventoNotif.TRANSVERSAL_DISPONIBLE,
    ])
    expect(prefs.tiposCriticos).toEqual(
      expect.arrayContaining([
        TipoEventoNotif.ASIGNACION_CURSO,
        TipoEventoNotif.CASO_REABIERTO,
        TipoEventoNotif.RESULTADO_CIERRE,
        TipoEventoNotif.EXCEL_CARGADO,
        TipoEventoNotif.MODULO_HUERFANO_SKILL,
      ]),
    )
  })

  it("usuario sin filas devuelve silenciados=[]", async () => {
    const { prisma, service } = buildService()
    prisma.preferenciaNotificacion.findMany.mockResolvedValue([])

    const prefs = await service.obtenerPreferencias(USUARIO_ID)

    expect(prefs.silenciados).toEqual([])
  })
})

describe("NotificacionesService.actualizarPreferencias", () => {
  function setupParaUpdate(prisma: PrismaMock): void {
    prisma.preferenciaNotificacion.deleteMany.mockResolvedValue({ count: 0 })
    prisma.preferenciaNotificacion.upsert.mockResolvedValue({})
    prisma.preferenciaNotificacion.findMany.mockResolvedValue([])
  }

  it("silenciar tipo no critico + audit fuera del TX, sin PII", async () => {
    const { prisma, audit, service } = buildService()
    setupParaUpdate(prisma)
    prisma.preferenciaNotificacion.findMany.mockResolvedValue([
      { tipoEvento: TipoEventoNotif.PLAN_RECALCULADO },
    ])

    const result = await service.actualizarPreferencias(USUARIO_ID, {
      silenciar: [TipoEventoNotif.PLAN_RECALCULADO],
      desilenciar: [],
    })

    expect(result.silenciados).toEqual([TipoEventoNotif.PLAN_RECALCULADO])
    expect(prisma.preferenciaNotificacion.upsert).toHaveBeenCalledTimes(1)
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        usuarioId: USUARIO_ID,
        accion: "PREFERENCIA_NOTIFICACION_ACTUALIZADA",
        exito: true,
        metadata: {
          silenciadas: [TipoEventoNotif.PLAN_RECALCULADO],
          desilenciadas: [],
        },
      }),
    )
  })

  it("desilenciar tipo eliminandolo de la tabla", async () => {
    const { prisma, service } = buildService()
    setupParaUpdate(prisma)

    await service.actualizarPreferencias(USUARIO_ID, {
      silenciar: [],
      desilenciar: [TipoEventoNotif.PLAN_RECALCULADO],
    })

    expect(prisma.preferenciaNotificacion.deleteMany).toHaveBeenCalledWith({
      where: { usuarioId: USUARIO_ID, tipoEvento: { in: [TipoEventoNotif.PLAN_RECALCULADO] } },
    })
    expect(prisma.preferenciaNotificacion.upsert).not.toHaveBeenCalled()
  })

  it("422 cuando tipo critico va en silenciar", async () => {
    const { prisma, service } = buildService()
    setupParaUpdate(prisma)

    await expect(
      service.actualizarPreferencias(USUARIO_ID, {
        silenciar: [TipoEventoNotif.RESULTADO_CIERRE],
        desilenciar: [],
      }),
    ).rejects.toMatchObject({
      response: {
        code: "VALIDACION_TIPO_CRITICO_NO_SILENCIABLE",
        details: { tiposCriticos: [TipoEventoNotif.RESULTADO_CIERRE] },
      },
    })
    expect(prisma.preferenciaNotificacion.upsert).not.toHaveBeenCalled()
  })

  it("422 cuando un tipo aparece en silenciar y desilenciar a la vez", async () => {
    const { prisma, service } = buildService()
    setupParaUpdate(prisma)

    await expect(
      service.actualizarPreferencias(USUARIO_ID, {
        silenciar: [TipoEventoNotif.PLAN_RECALCULADO],
        desilenciar: [TipoEventoNotif.PLAN_RECALCULADO],
      }),
    ).rejects.toMatchObject({
      response: {
        code: "VALIDACION_TIPO_EN_SILENCIAR_Y_DESILENCIAR",
        details: { tipos: [TipoEventoNotif.PLAN_RECALCULADO] },
      },
    })
    expect(prisma.preferenciaNotificacion.deleteMany).not.toHaveBeenCalled()
    expect(prisma.preferenciaNotificacion.upsert).not.toHaveBeenCalled()
  })
})
