import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
  NotImplementedException,
} from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { AccionAuditoria, ModoEntregaPassword, Prisma, RolUsuario } from "@prisma/client"
import bcrypt from "bcrypt"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { AuditLogService } from "../common/audit/audit-log.service"
import { apiErrorCodes } from "../common/errors/api-error.codes"
import { PrismaService } from "../common/prisma/prisma.service"
import { AppEnv } from "../config/env.validation"
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
let config: { get: ReturnType<typeof vi.fn> }
let service: ColaboradoresService

beforeEach(() => {
  prisma = buildPrismaMock()
  auditLog = buildAuditLogMock()
  // ConfigService stub: dominios permitidos del alta masiva (ALTA_LOTE_DOMINIOS).
  config = { get: vi.fn().mockReturnValue(["emeal.nttdata.com"]) }
  service = new ColaboradoresService(
    prisma as unknown as PrismaService,
    auditLog as unknown as AuditLogService,
    config as unknown as ConfigService<AppEnv, true>,
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

describe("ColaboradoresService.crearLote", () => {
  function stubTransaccionOk(): void {
    prisma.$transaction.mockImplementation(
      async (cb: (tx: unknown) => Promise<unknown>) =>
        await cb({
          colaborador: { create: vi.fn().mockResolvedValue({ id: "col-x" }) },
          usuario: { create: vi.fn().mockResolvedValue({ id: "usr-x" }) },
          historicoPassword: { create: vi.fn().mockResolvedValue(undefined) },
        }),
    )
  }

  it("happy path: crea las filas validas y devuelve sus passwords fuertes", async () => {
    stubTransaccionOk()
    const result = await service.crearLote(
      {
        rol: RolUsuario.PARTICIPANTE,
        habilitarMfa: false,
        colaboradores: [
          { email: "ana@emeal.nttdata.com", nombre: "Ana" },
          { email: "beto@emeal.nttdata.com", nombre: "Beto" },
        ],
      },
      ADMIN_ID,
    )
    expect(result.resumen).toEqual({ total: 2, creados: 2, rechazados: 0 })
    expect(result.creados).toHaveLength(2)
    expect(result.creados.every((c) => REGEX_FORTALEZA.test(c.passwordTemporal))).toBe(true)
    expect(result.requiereCambioPassword).toBe(true)
    expect(auditLog.record).toHaveBeenCalledTimes(2)
  })

  it("rechaza dominio no permitido sin abortar el resto", async () => {
    stubTransaccionOk()
    const result = await service.crearLote(
      {
        rol: RolUsuario.PARTICIPANTE,
        habilitarMfa: false,
        colaboradores: [
          { email: "ok@emeal.nttdata.com", nombre: "Ok" },
          { email: "fuera@gmail.com", nombre: "Fuera" },
        ],
      },
      ADMIN_ID,
    )
    expect(result.resumen).toEqual({ total: 2, creados: 1, rechazados: 1 })
    expect(result.rechazados).toContainEqual({
      email: "fuera@gmail.com",
      nombre: "Fuera",
      motivo: "dominio_no_permitido",
    })
  })

  it("deduplica emails repetidos en la tanda (case-insensitive)", async () => {
    stubTransaccionOk()
    const result = await service.crearLote(
      {
        rol: RolUsuario.PARTICIPANTE,
        habilitarMfa: false,
        colaboradores: [
          { email: "ana@emeal.nttdata.com", nombre: "Ana" },
          { email: "ANA@emeal.nttdata.com", nombre: "Ana duplicada" },
        ],
      },
      ADMIN_ID,
    )
    expect(result.resumen.creados).toBe(1)
    expect(result.rechazados).toContainEqual({
      email: "ana@emeal.nttdata.com",
      nombre: "Ana duplicada",
      motivo: "duplicado_en_lote",
    })
  })

  it("email ya existente (P2002): lo reporta como ya_existe sin abortar la tanda", async () => {
    prisma.$transaction.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique violation", {
        code: "P2002",
        clientVersion: "test",
        meta: { target: ["email"] },
      }),
    )
    const result = await service.crearLote(
      {
        rol: RolUsuario.PARTICIPANTE,
        habilitarMfa: false,
        colaboradores: [{ email: "existe@emeal.nttdata.com", nombre: "Existe" }],
      },
      ADMIN_ID,
    )
    expect(result.resumen).toEqual({ total: 1, creados: 0, rechazados: 1 })
    expect(result.rechazados[0]?.motivo).toBe("ya_existe")
  })

  it("modo AUTOMATICO: 501 MODO_AUTOMATICO_NO_DISPONIBLE", async () => {
    prisma.configuracionSistema.findUnique.mockResolvedValue({
      modoEntregaPassword: ModoEntregaPassword.AUTOMATICO,
    })
    await expect(
      service.crearLote(
        {
          rol: RolUsuario.PARTICIPANTE,
          habilitarMfa: false,
          colaboradores: [{ email: "x@emeal.nttdata.com", nombre: "X" }],
        },
        ADMIN_ID,
      ),
    ).rejects.toBeInstanceOf(NotImplementedException)
  })

  it("habilitarMfa=true: persiste requiereSetupMfa=true por fila", async () => {
    let requiereSetupPersistido: boolean | undefined
    prisma.$transaction.mockImplementation(
      async (cb: (tx: unknown) => Promise<unknown>) =>
        await cb({
          colaborador: { create: vi.fn().mockResolvedValue({ id: "col-x" }) },
          usuario: {
            create: vi.fn().mockImplementation((args: { data: { requiereSetupMfa: boolean } }) => {
              requiereSetupPersistido = args.data.requiereSetupMfa
              return Promise.resolve({ id: "usr-x" })
            }),
          },
          historicoPassword: { create: vi.fn().mockResolvedValue(undefined) },
        }),
    )
    const result = await service.crearLote(
      {
        rol: RolUsuario.PARTICIPANTE,
        habilitarMfa: true,
        colaboradores: [{ email: "ana@emeal.nttdata.com", nombre: "Ana" }],
      },
      ADMIN_ID,
    )
    expect(result.resumen.creados).toBe(1)
    expect(requiereSetupPersistido).toBe(true)
  })

  it("error inesperado en una fila: la marca error_interno sin abortar la tanda", async () => {
    prisma.$transaction.mockRejectedValue(new Error("db down"))
    const result = await service.crearLote(
      {
        rol: RolUsuario.PARTICIPANTE,
        habilitarMfa: false,
        colaboradores: [{ email: "ana@emeal.nttdata.com", nombre: "Ana" }],
      },
      ADMIN_ID,
    )
    expect(result.resumen).toEqual({ total: 1, creados: 0, rechazados: 1 })
    expect(result.rechazados[0]?.motivo).toBe("error_interno")
  })

  it("lote mixto: creados + rechazados === total y las passwords solo van en creados", async () => {
    stubTransaccionOk()
    const result = await service.crearLote(
      {
        rol: RolUsuario.PARTICIPANTE,
        habilitarMfa: false,
        colaboradores: [
          { email: "ana@emeal.nttdata.com", nombre: "Ana" },
          { email: "fuera@gmail.com", nombre: "Fuera" },
          { email: "ana@emeal.nttdata.com", nombre: "Ana dup" },
          { email: "beto@emeal.nttdata.com", nombre: "Beto" },
        ],
      },
      ADMIN_ID,
    )
    expect(result.resumen.total).toBe(4)
    expect(result.resumen.creados + result.resumen.rechazados).toBe(4)
    expect(result.creados).toHaveLength(2)
    expect(result.creados.every((c) => c.passwordTemporal.length > 0)).toBe(true)
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
