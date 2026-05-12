import { CanalNotif, EstadoEmpleado, TipoEventoNotif } from "@prisma/client"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { PrismaService } from "../common/prisma/prisma.service"
import { EnvioArgs, EnvioResultado, IEmailProvider } from "./email/email-provider.interface"
import { NotificacionesService } from "./notificaciones.service"
import { catalogoTipoEvento } from "./tipo-evento.constants"

interface PrismaMock {
  usuario: { findUnique: ReturnType<typeof vi.fn> }
  preferenciaNotificacion: { findUnique: ReturnType<typeof vi.fn> }
  notificacion: {
    create: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
  }
  notificacionCanal: { create: ReturnType<typeof vi.fn> }
  $transaction: ReturnType<typeof vi.fn>
}

function buildPrismaMock(): PrismaMock {
  const notif = {
    create: vi.fn(),
    update: vi.fn(),
  }
  const canales = { create: vi.fn() }
  const prisma: PrismaMock = {
    usuario: { findUnique: vi.fn() },
    preferenciaNotificacion: { findUnique: vi.fn() },
    notificacion: notif,
    notificacionCanal: canales,
    $transaction: vi.fn(),
  }
  // `$transaction(async tx => ...)` ejecuta el callback recibiendo el mismo
  // mock — asi los stubs de notificacion/notificacionCanal son consultados
  // por igual dentro o fuera de la transaccion.
  prisma.$transaction.mockImplementation(async (cb: (tx: PrismaMock) => Promise<unknown>) =>
    cb(prisma),
  )
  return prisma
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
    service = new NotificacionesService(prisma as unknown as PrismaService, email)
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
