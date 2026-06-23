import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
  NotImplementedException,
} from "@nestjs/common"
import { AccionAuditoria, ModoEntregaPassword, Prisma, RolUsuario } from "@prisma/client"
import bcrypt from "bcrypt"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { AuditLogService } from "../common/audit/audit-log.service"
import { apiErrorCodes } from "../common/errors/api-error.codes"
import { PrismaService } from "../common/prisma/prisma.service"
import { ColaboradoresService } from "./colaboradores.service"

interface MockPrisma {
  configuracionSistema: { findUnique: ReturnType<typeof vi.fn> }
  colaborador: { findUnique: ReturnType<typeof vi.fn> }
  usuario: { update: ReturnType<typeof vi.fn>; count: ReturnType<typeof vi.fn> }
  $transaction: ReturnType<typeof vi.fn>
}

function buildPrismaMock(): MockPrisma {
  return {
    configuracionSistema: {
      findUnique: vi.fn().mockResolvedValue({ modoEntregaPassword: ModoEntregaPassword.MANUAL }),
    },
    colaborador: { findUnique: vi.fn() },
    usuario: { update: vi.fn().mockResolvedValue(undefined), count: vi.fn() },
    $transaction: vi.fn(),
  }
}

interface MockAuditLog {
  record: ReturnType<typeof vi.fn>
}

function buildAuditLogMock(): MockAuditLog {
  return {
    record: vi.fn().mockResolvedValue(undefined),
  }
}

const REGEX_FORTALEZA = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{10,}$/
const ADMIN_ID = "admin-1"

let prisma: MockPrisma
let auditLog: MockAuditLog
let service: ColaboradoresService

beforeEach(() => {
  prisma = buildPrismaMock()
  auditLog = buildAuditLogMock()
  service = new ColaboradoresService(
    prisma as unknown as PrismaService,
    auditLog as unknown as AuditLogService,
  )
})

describe("ColaboradoresService.crear", () => {
  it("happy path: crea Colaborador, Usuario y entrada en historico_passwords", async () => {
    const colaborador = {
      id: "col-1",
      email: "nuevo@nttdata.test",
      nombre: "Nuevo",
      estadoEmpleado: "ACTIVO",
    }
    const usuario = { id: "usr-1", rol: RolUsuario.PARTICIPANTE }
    const historicoCreate = vi.fn().mockResolvedValue(undefined)

    prisma.$transaction.mockImplementation(
      async (cb: (tx: unknown) => Promise<unknown>) =>
        await cb({
          colaborador: { create: vi.fn().mockResolvedValue(colaborador) },
          usuario: { create: vi.fn().mockResolvedValue(usuario) },
          historicoPassword: { create: historicoCreate },
        }),
    )

    const result = await service.crear(
      {
        email: "nuevo@nttdata.test",
        nombre: "Nuevo",
        rol: RolUsuario.PARTICIPANTE,
        habilitarMfa: false,
      },
      ADMIN_ID,
    )

    expect(result.colaborador.email).toBe("nuevo@nttdata.test")
    expect(result.usuario.requiereCambioPassword).toBe(true)
    expect(result.modoEntrega).toBe("MANUAL")
    expect(REGEX_FORTALEZA.test(result.passwordTemporal)).toBe(true)
    expect(historicoCreate).toHaveBeenCalled()
    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({
        usuarioId: ADMIN_ID,
        accion: AccionAuditoria.COLABORADOR_CREADO,
        exito: true,
        recursoTipo: "colaborador",
        recursoId: "col-1",
      }),
    )
  })

  it("password generada cumple la regex de fortaleza", async () => {
    prisma.$transaction.mockImplementation(
      async (cb: (tx: unknown) => Promise<unknown>) =>
        await cb({
          colaborador: {
            create: vi.fn().mockResolvedValue({
              id: "x",
              email: "x@y.z",
              nombre: "n",
              estadoEmpleado: "ACTIVO",
            }),
          },
          usuario: { create: vi.fn().mockResolvedValue({ id: "u", rol: RolUsuario.PARTICIPANTE }) },
          historicoPassword: { create: vi.fn().mockResolvedValue(undefined) },
        }),
    )
    const result = await service.crear(
      {
        email: "x@y.z",
        nombre: "n",
        rol: RolUsuario.PARTICIPANTE,
        habilitarMfa: false,
      },
      ADMIN_ID,
    )
    expect(REGEX_FORTALEZA.test(result.passwordTemporal)).toBe(true)
  })

  it("password persistida es bcrypt hash y se replica en historico", async () => {
    let hashPersistido: string | undefined
    prisma.$transaction.mockImplementation(
      async (cb: (tx: unknown) => Promise<unknown>) =>
        await cb({
          colaborador: {
            create: vi.fn().mockResolvedValue({
              id: "x",
              email: "x@y.z",
              nombre: "n",
              estadoEmpleado: "ACTIVO",
            }),
          },
          usuario: {
            create: vi.fn().mockImplementation((args: { data: { passwordHash: string } }) => {
              hashPersistido = args.data.passwordHash
              return Promise.resolve({ id: "u", rol: RolUsuario.PARTICIPANTE })
            }),
          },
          historicoPassword: { create: vi.fn().mockResolvedValue(undefined) },
        }),
    )
    const result = await service.crear(
      {
        email: "x@y.z",
        nombre: "n",
        rol: RolUsuario.PARTICIPANTE,
        habilitarMfa: false,
      },
      ADMIN_ID,
    )
    expect(hashPersistido).toBeDefined()
    expect(hashPersistido).not.toBe(result.passwordTemporal)
    const ok = await bcrypt.compare(result.passwordTemporal, hashPersistido as string)
    expect(ok).toBe(true)
  })

  it("modo AUTOMATICO: 501 MODO_AUTOMATICO_NO_DISPONIBLE", async () => {
    prisma.configuracionSistema.findUnique.mockResolvedValue({
      modoEntregaPassword: ModoEntregaPassword.AUTOMATICO,
    })
    try {
      await service.crear(
        {
          email: "x@y.z",
          nombre: "n",
          rol: RolUsuario.PARTICIPANTE,
          habilitarMfa: false,
        },
        ADMIN_ID,
      )
      throw new Error("se esperaba que lanzara")
    } catch (error) {
      expect(error).toBeInstanceOf(NotImplementedException)
      const r = (error as NotImplementedException).getResponse() as { code: string }
      expect(r.code).toBe(apiErrorCodes.modoAutomaticoNoDisponible)
    }
  })

  it("email duplicado (P2002): 409 CONFLICT_EMAIL_DUPLICADO", async () => {
    prisma.$transaction.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique violation", {
        code: "P2002",
        clientVersion: "test",
        meta: { target: ["email"] },
      }),
    )
    try {
      await service.crear(
        {
          email: "dup@y.z",
          nombre: "n",
          rol: RolUsuario.PARTICIPANTE,
          habilitarMfa: false,
        },
        ADMIN_ID,
      )
      throw new Error("se esperaba que lanzara")
    } catch (error) {
      expect(error).toBeInstanceOf(ConflictException)
      const r = (error as ConflictException).getResponse() as { code: string }
      expect(r.code).toBe(apiErrorCodes.conflictEmailDuplicado)
    }
  })

  it("habilitarMfa=true: persiste requiereSetupMfa=true, mfaHabilitado=false (estado bisagra)", async () => {
    let mfaPersistido: boolean | undefined
    let requiereSetupPersistido: boolean | undefined
    prisma.$transaction.mockImplementation(
      async (cb: (tx: unknown) => Promise<unknown>) =>
        await cb({
          colaborador: {
            create: vi.fn().mockResolvedValue({
              id: "x",
              email: "x@y.z",
              nombre: "n",
              estadoEmpleado: "ACTIVO",
            }),
          },
          usuario: {
            create: vi
              .fn()
              .mockImplementation(
                (args: { data: { mfaHabilitado: boolean; requiereSetupMfa: boolean } }) => {
                  mfaPersistido = args.data.mfaHabilitado
                  requiereSetupPersistido = args.data.requiereSetupMfa
                  return Promise.resolve({ id: "u", rol: RolUsuario.PARTICIPANTE })
                },
              ),
          },
          historicoPassword: { create: vi.fn().mockResolvedValue(undefined) },
        }),
    )
    const result = await service.crear(
      {
        email: "x@y.z",
        nombre: "n",
        rol: RolUsuario.PARTICIPANTE,
        habilitarMfa: true,
      },
      ADMIN_ID,
    )
    expect(mfaPersistido).toBe(false)
    expect(requiereSetupPersistido).toBe(true)
    expect(result.usuario.requiereSetupMfa).toBe(true)
  })

  it("habilitarMfa=false: persiste requiereSetupMfa=false (sin bisagra)", async () => {
    let requiereSetupPersistido: boolean | undefined
    prisma.$transaction.mockImplementation(
      async (cb: (tx: unknown) => Promise<unknown>) =>
        await cb({
          colaborador: {
            create: vi.fn().mockResolvedValue({
              id: "x",
              email: "x@y.z",
              nombre: "n",
              estadoEmpleado: "ACTIVO",
            }),
          },
          usuario: {
            create: vi.fn().mockImplementation((args: { data: { requiereSetupMfa: boolean } }) => {
              requiereSetupPersistido = args.data.requiereSetupMfa
              return Promise.resolve({ id: "u", rol: RolUsuario.PARTICIPANTE })
            }),
          },
          historicoPassword: { create: vi.fn().mockResolvedValue(undefined) },
        }),
    )
    const result = await service.crear(
      {
        email: "x@y.z",
        nombre: "n",
        rol: RolUsuario.PARTICIPANTE,
        habilitarMfa: false,
      },
      ADMIN_ID,
    )
    expect(requiereSetupPersistido).toBe(false)
    expect(result.usuario.requiereSetupMfa).toBe(false)
  })
})

describe("ColaboradoresService.cambiarRol", () => {
  const colaboradorId = "col-1"
  const usuarioObjetivoId = "usr-objetivo"

  beforeEach(() => {
    // El check del "ultimo admin" + el update viven en una transaccion
    // serializable. El mock ejecuta el callback pasando `prisma` como `tx`, de
    // modo que `tx.usuario.count`/`tx.usuario.update` son los mismos spies.
    prisma.$transaction.mockImplementation(
      async (cb: (tx: unknown) => Promise<unknown>) => await cb(prisma),
    )
  })

  it("happy path PARTICIPANTE -> ADMIN: actualiza rol y audita USUARIO_ROL_CAMBIADO", async () => {
    prisma.colaborador.findUnique.mockResolvedValue({
      usuario: { id: usuarioObjetivoId, rol: RolUsuario.PARTICIPANTE },
    })

    const result = await service.cambiarRol(
      colaboradorId,
      RolUsuario.ADMIN,
      ADMIN_ID,
      "promocion aprobada por RRHH",
    )

    expect(result).toEqual({
      usuarioId: usuarioObjetivoId,
      rolAnterior: RolUsuario.PARTICIPANTE,
      rolNuevo: RolUsuario.ADMIN,
    })
    expect(prisma.usuario.update).toHaveBeenCalledWith({
      where: { id: usuarioObjetivoId },
      data: { rol: RolUsuario.ADMIN },
      select: { id: true },
    })
    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({
        usuarioId: ADMIN_ID,
        accion: AccionAuditoria.USUARIO_ROL_CAMBIADO,
        exito: true,
        recursoTipo: "usuario",
        recursoId: usuarioObjetivoId,
        metadata: {
          rolAnterior: RolUsuario.PARTICIPANTE,
          rolNuevo: RolUsuario.ADMIN,
          motivo: "promocion aprobada por RRHH",
        },
      }),
    )
  })

  it("colaborador inexistente: 404 NO_ENCONTRADO", async () => {
    prisma.colaborador.findUnique.mockResolvedValue(null)
    await expect(
      service.cambiarRol(colaboradorId, RolUsuario.ADMIN, ADMIN_ID, "x"),
    ).rejects.toBeInstanceOf(NotFoundException)
    expect(prisma.usuario.update).not.toHaveBeenCalled()
  })

  it("colaborador sin cuenta de acceso: 409 CONFLICT", async () => {
    prisma.colaborador.findUnique.mockResolvedValue({ usuario: null })
    await expect(
      service.cambiarRol(colaboradorId, RolUsuario.ADMIN, ADMIN_ID, "x"),
    ).rejects.toBeInstanceOf(ConflictException)
    expect(prisma.usuario.update).not.toHaveBeenCalled()
  })

  it("un admin no puede cambiar su propio rol: 403 PROHIBIDO", async () => {
    prisma.colaborador.findUnique.mockResolvedValue({
      usuario: { id: ADMIN_ID, rol: RolUsuario.ADMIN },
    })
    await expect(
      service.cambiarRol(colaboradorId, RolUsuario.PARTICIPANTE, ADMIN_ID, "x"),
    ).rejects.toBeInstanceOf(ForbiddenException)
    expect(prisma.usuario.update).not.toHaveBeenCalled()
  })

  it("cambiar al mismo rol es un no-op rechazado: 409 CONFLICT", async () => {
    prisma.colaborador.findUnique.mockResolvedValue({
      usuario: { id: usuarioObjetivoId, rol: RolUsuario.PARTICIPANTE },
    })
    await expect(
      service.cambiarRol(colaboradorId, RolUsuario.PARTICIPANTE, ADMIN_ID, "x"),
    ).rejects.toBeInstanceOf(ConflictException)
    expect(prisma.usuario.update).not.toHaveBeenCalled()
  })

  it("no permite degradar al ultimo administrador: 409 CONFLICT", async () => {
    prisma.colaborador.findUnique.mockResolvedValue({
      usuario: { id: usuarioObjetivoId, rol: RolUsuario.ADMIN },
    })
    prisma.usuario.count.mockResolvedValue(1)
    await expect(
      service.cambiarRol(colaboradorId, RolUsuario.PARTICIPANTE, ADMIN_ID, "x"),
    ).rejects.toBeInstanceOf(ConflictException)
    expect(prisma.usuario.update).not.toHaveBeenCalled()
  })

  it("el recuento del ultimo admin solo cuenta administradores efectivos (no bloqueados ni ex-empleados)", async () => {
    prisma.colaborador.findUnique.mockResolvedValue({
      usuario: { id: usuarioObjetivoId, rol: RolUsuario.ADMIN },
    })
    prisma.usuario.count.mockResolvedValue(2)

    await service.cambiarRol(colaboradorId, RolUsuario.PARTICIPANTE, ADMIN_ID, "rotacion")

    expect(prisma.usuario.count).toHaveBeenCalledWith({
      where: {
        rol: RolUsuario.ADMIN,
        bloqueado: false,
        colaborador: { estadoEmpleado: "ACTIVO" },
      },
    })
  })

  it("conflicto de concurrencia (P2034) en la transaccion: 409 CONFLICT", async () => {
    prisma.colaborador.findUnique.mockResolvedValue({
      usuario: { id: usuarioObjetivoId, rol: RolUsuario.ADMIN },
    })
    prisma.usuario.count.mockResolvedValue(2)
    prisma.$transaction.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("serialization failure", {
        code: "P2034",
        clientVersion: "test",
      }),
    )
    await expect(
      service.cambiarRol(colaboradorId, RolUsuario.PARTICIPANTE, ADMIN_ID, "x"),
    ).rejects.toBeInstanceOf(ConflictException)
  })

  it("permite degradar un admin cuando hay mas de uno", async () => {
    prisma.colaborador.findUnique.mockResolvedValue({
      usuario: { id: usuarioObjetivoId, rol: RolUsuario.ADMIN },
    })
    prisma.usuario.count.mockResolvedValue(2)

    const result = await service.cambiarRol(
      colaboradorId,
      RolUsuario.PARTICIPANTE,
      ADMIN_ID,
      "rotacion de funciones",
    )

    expect(result.rolNuevo).toBe(RolUsuario.PARTICIPANTE)
    expect(prisma.usuario.update).toHaveBeenCalledWith({
      where: { id: usuarioObjetivoId },
      data: { rol: RolUsuario.PARTICIPANTE },
      select: { id: true },
    })
  })
})
