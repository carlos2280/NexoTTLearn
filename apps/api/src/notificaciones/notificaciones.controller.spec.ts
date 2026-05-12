import { InternalServerErrorException } from "@nestjs/common"
import { RolUsuario, TipoEventoNotif } from "@prisma/client"
import type { Request } from "express"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { SesionUsuario } from "../common/types/sesion.types"
import { NotificacionesController } from "./notificaciones.controller"
import { NotificacionesService } from "./notificaciones.service"

interface ServiceMock {
  listarPorUsuario: ReturnType<typeof vi.fn>
  contarNoLeidas: ReturnType<typeof vi.fn>
  obtenerDetalle: ReturnType<typeof vi.fn>
  marcarLeida: ReturnType<typeof vi.fn>
  marcarTodasLeidas: ReturnType<typeof vi.fn>
  archivar: ReturnType<typeof vi.fn>
  obtenerPreferencias: ReturnType<typeof vi.fn>
  actualizarPreferencias: ReturnType<typeof vi.fn>
}

function buildServiceMock(): ServiceMock {
  return {
    listarPorUsuario: vi.fn(),
    contarNoLeidas: vi.fn(),
    obtenerDetalle: vi.fn(),
    marcarLeida: vi.fn(),
    marcarTodasLeidas: vi.fn(),
    archivar: vi.fn(),
    obtenerPreferencias: vi.fn(),
    actualizarPreferencias: vi.fn(),
  }
}

const SESION: SesionUsuario = {
  usuarioId: "11111111-1111-1111-1111-111111111111",
  rol: RolUsuario.PARTICIPANTE,
}
const NOTIF_ID = "22222222-2222-2222-2222-222222222222"

function buildReq(): Request {
  return {
    headers: {},
    ip: "127.0.0.1",
  } as unknown as Request
}

describe("NotificacionesController", () => {
  let svc: ServiceMock
  let ctrl: NotificacionesController

  beforeEach(() => {
    svc = buildServiceMock()
    ctrl = new NotificacionesController(svc as unknown as NotificacionesService)
  })

  it("E1 listar — pasa usuarioId de sesion + query al service", async () => {
    svc.listarPorUsuario.mockResolvedValue({
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    })

    await ctrl.listar({ page: 1, pageSize: 20, archivada: false, sort: "-fechaCreacion" }, SESION)

    expect(svc.listarPorUsuario).toHaveBeenCalledWith({
      usuarioId: SESION.usuarioId,
      query: { page: 1, pageSize: 20, archivada: false, sort: "-fechaCreacion" },
    })
  })

  it("E2 badge — devuelve { noLeidas }", async () => {
    svc.contarNoLeidas.mockResolvedValue(3)
    const out = await ctrl.badge(SESION)
    expect(out).toEqual({ noLeidas: 3 })
  })

  it("E3 detalle — delega al service con usuarioId de sesion", async () => {
    svc.obtenerDetalle.mockResolvedValue({ id: NOTIF_ID })
    await ctrl.obtenerDetalle(NOTIF_ID, SESION)
    expect(svc.obtenerDetalle).toHaveBeenCalledWith(SESION.usuarioId, NOTIF_ID)
  })

  it("E4 marcar-leida — delega + sin retorno", async () => {
    svc.marcarLeida.mockResolvedValue(undefined)
    await ctrl.marcarLeida(NOTIF_ID, SESION)
    expect(svc.marcarLeida).toHaveBeenCalledWith(SESION.usuarioId, NOTIF_ID)
  })

  it("E5 marcar-todas-leidas — delega solo con usuarioId", async () => {
    svc.marcarTodasLeidas.mockResolvedValue(undefined)
    await ctrl.marcarTodasLeidas(SESION)
    expect(svc.marcarTodasLeidas).toHaveBeenCalledWith(SESION.usuarioId)
  })

  it("E6 archivar — delega + sin retorno", async () => {
    svc.archivar.mockResolvedValue(undefined)
    await ctrl.archivar(NOTIF_ID, SESION)
    expect(svc.archivar).toHaveBeenCalledWith(SESION.usuarioId, NOTIF_ID)
  })

  it("E7 preferencias — delega con usuarioId", async () => {
    svc.obtenerPreferencias.mockResolvedValue({ silenciados: [], tiposCriticos: [] })
    await ctrl.preferencias(SESION)
    expect(svc.obtenerPreferencias).toHaveBeenCalledWith(SESION.usuarioId)
  })

  it("E8 patch preferencias — incluye contextoHttp y body validado", async () => {
    svc.actualizarPreferencias.mockResolvedValue({ silenciados: [], tiposCriticos: [] })
    const body = { silenciar: [TipoEventoNotif.PLAN_RECALCULADO], desilenciar: [] }
    await ctrl.actualizarPreferencias(body, SESION, buildReq())
    expect(svc.actualizarPreferencias).toHaveBeenCalledWith(
      SESION.usuarioId,
      body,
      expect.objectContaining({ ip: "127.0.0.1" }),
    )
  })

  it("rechaza con 500 si pasa el guard sin sesion (defensa en profundidad)", async () => {
    await expect(ctrl.badge(undefined)).rejects.toBeInstanceOf(InternalServerErrorException)
  })

  it("E2 badge tiene metadata @Throttle short (R-S10-1)", () => {
    // Verificacion estructural — el decorator @Throttle inyecta metadata por nombre
    // de configuracion. Buscamos cualquier key que contenga "throttle".
    const metadataKeys = Reflect.getMetadataKeys(ctrl.badge)
    expect(metadataKeys.some((k) => String(k).toLowerCase().includes("throttle"))).toBe(true)
  })
})
