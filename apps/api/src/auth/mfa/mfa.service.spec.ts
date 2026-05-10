import { NotFoundException, UnauthorizedException } from "@nestjs/common"
import { AccionAuditoria, EstadoEmpleado, RolUsuario } from "@prisma/client"
import { generateSecret, generateSync } from "otplib"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { AuditLogService } from "../../common/audit/audit-log.service"
import { CifradoService } from "../../common/crypto/cifrado.service"
import { PrismaService } from "../../common/prisma/prisma.service"
import { MfaService } from "./mfa.service"

const USUARIO_ID = "11111111-1111-1111-1111-111111111111"
const CHALLENGE_ID = "22222222-2222-2222-2222-222222222222"

interface MockPrisma {
  usuario: {
    findUnique: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
  }
  mfaChallenge: {
    create: ReturnType<typeof vi.fn>
    findUnique: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
  }
  aceptacionAvisoPrivacidad: {
    findFirst: ReturnType<typeof vi.fn>
  }
  $transaction: ReturnType<typeof vi.fn>
}

interface MockAuditLog {
  record: ReturnType<typeof vi.fn>
}

interface MockCifrado {
  encriptar: ReturnType<typeof vi.fn>
  desencriptar: ReturnType<typeof vi.fn>
}

function buildPrismaMock(): MockPrisma {
  return {
    usuario: {
      findUnique: vi.fn(),
      update: vi.fn().mockResolvedValue(undefined),
    },
    mfaChallenge: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn().mockResolvedValue(undefined),
    },
    aceptacionAvisoPrivacidad: {
      findFirst: vi.fn().mockResolvedValue(null),
    },
    $transaction: vi.fn().mockResolvedValue([undefined, undefined]),
  }
}

function buildAuditMock(): MockAuditLog {
  return { record: vi.fn().mockResolvedValue(undefined) }
}

function buildCifradoMock(): MockCifrado {
  return {
    encriptar: vi.fn((p: string) => `cifrado(${p})`),
    desencriptar: vi.fn((p: string) => p.replace(/^cifrado\(/, "").replace(/\)$/, "")),
  }
}

let prisma: MockPrisma
let audit: MockAuditLog
let cifrado: MockCifrado
let service: MfaService

beforeEach(() => {
  prisma = buildPrismaMock()
  audit = buildAuditMock()
  cifrado = buildCifradoMock()
  service = new MfaService(
    prisma as unknown as PrismaService,
    cifrado as unknown as CifradoService,
    audit as unknown as AuditLogService,
  )
})

afterEach(() => {
  vi.useRealTimers()
})

describe("MfaService.setup", () => {
  it("genera secret, lo persiste cifrado y devuelve QR", async () => {
    prisma.usuario.findUnique.mockResolvedValue({
      id: USUARIO_ID,
      colaborador: { email: "u@nttdata.test" },
    })
    const out = await service.setup(USUARIO_ID)
    expect(out.secret).toMatch(/^[A-Z2-7]+$/)
    expect(out.qrCodeDataUrl).toMatch(/^data:image\/png;base64,/)
    const updateCall = prisma.usuario.update.mock.calls[0]?.[0]
    expect(updateCall?.data?.mfaSecret).toMatch(/^cifrado\(/)
    expect(updateCall?.data?.mfaHabilitado).toBe(false)
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        usuarioId: USUARIO_ID,
        accion: AccionAuditoria.MFA_SETUP_INICIADO,
        exito: true,
      }),
    )
  })

  it("setup es idempotente: reemplaza el secret previo", async () => {
    prisma.usuario.findUnique.mockResolvedValue({
      id: USUARIO_ID,
      colaborador: { email: "u@nttdata.test" },
    })
    const a = await service.setup(USUARIO_ID)
    const b = await service.setup(USUARIO_ID)
    expect(a.secret).not.toBe(b.secret)
    expect(prisma.usuario.update).toHaveBeenCalledTimes(2)
  })

  it("setup lanza NotFound si el usuario no existe", async () => {
    prisma.usuario.findUnique.mockResolvedValue(null)
    await expect(service.setup(USUARIO_ID)).rejects.toBeInstanceOf(NotFoundException)
  })
})

describe("MfaService.enable", () => {
  it("activa MFA cuando el codigo es valido", async () => {
    const secret = generateSecret()
    prisma.usuario.findUnique.mockResolvedValue({
      id: USUARIO_ID,
      mfaSecret: `cifrado(${secret})`,
    })
    const codigo = generateSync({ secret })
    await service.enable(USUARIO_ID, codigo)
    expect(prisma.usuario.update).toHaveBeenCalledWith({
      where: { id: USUARIO_ID },
      data: { mfaHabilitado: true, requiereSetupMfa: false },
    })
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ accion: AccionAuditoria.MFA_ENABLED, exito: true }),
    )
  })

  it("enable falla con codigo invalido sin modificar estado", async () => {
    const secret = generateSecret()
    prisma.usuario.findUnique.mockResolvedValue({
      id: USUARIO_ID,
      mfaSecret: `cifrado(${secret})`,
    })
    await expect(service.enable(USUARIO_ID, "000000")).rejects.toBeInstanceOf(UnauthorizedException)
    expect(prisma.usuario.update).not.toHaveBeenCalled()
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ accion: AccionAuditoria.MFA_VERIFY_FAIL, exito: false }),
    )
  })
})

describe("MfaService.crearChallenge", () => {
  it("crea fila con expiracion 5 min y audita LOGIN_PARCIAL_OK", async () => {
    prisma.mfaChallenge.create.mockResolvedValue({ id: CHALLENGE_ID })
    const out = await service.crearChallenge(USUARIO_ID)
    expect(out.mfaChallengeId).toBe(CHALLENGE_ID)
    const createArg = prisma.mfaChallenge.create.mock.calls[0]?.[0]
    const ms = (createArg?.data?.expiraEn as Date).getTime() - Date.now()
    expect(ms).toBeGreaterThan(4 * 60_000)
    expect(ms).toBeLessThanOrEqual(5 * 60_000 + 10)
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        usuarioId: USUARIO_ID,
        accion: AccionAuditoria.LOGIN_PARCIAL_OK,
        exito: true,
        recursoTipo: "mfa_challenge",
        recursoId: CHALLENGE_ID,
      }),
    )
  })
})

describe("MfaService.verify", () => {
  function setupChallengeUsuarioOk(secret: string): void {
    prisma.mfaChallenge.findUnique.mockResolvedValue({
      id: CHALLENGE_ID,
      usuarioId: USUARIO_ID,
      expiraEn: new Date(Date.now() + 60_000),
      usado: false,
      intentos: 0,
    })
    prisma.usuario.findUnique.mockResolvedValue({
      id: USUARIO_ID,
      mfaSecret: `cifrado(${secret})`,
      mfaHabilitado: true,
      rol: RolUsuario.PARTICIPANTE,
      requiereCambioPassword: false,
      colaborador: {
        id: "col-1",
        email: "u@nttdata.test",
        nombre: "U Test",
        estadoEmpleado: EstadoEmpleado.ACTIVO,
      },
    })
  }

  it("verify OK: devuelve perfil, marca challenge usado y audita MFA_VERIFY_OK", async () => {
    const secret = generateSecret()
    setupChallengeUsuarioOk(secret)
    const codigo = generateSync({ secret })
    const out = await service.verify(CHALLENGE_ID, codigo)
    expect(out.usuarioId).toBe(USUARIO_ID)
    expect(out.perfil.mfaHabilitado).toBe(true)
    expect(prisma.$transaction).toHaveBeenCalled()
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ accion: AccionAuditoria.MFA_VERIFY_OK, exito: true }),
    )
  })

  it("verify codigo incorrecto: incrementa intentos y audita fallo", async () => {
    const secret = generateSecret()
    setupChallengeUsuarioOk(secret)
    prisma.mfaChallenge.update.mockResolvedValue({ intentos: 1 })
    await expect(service.verify(CHALLENGE_ID, "000000")).rejects.toBeInstanceOf(
      UnauthorizedException,
    )
    expect(prisma.mfaChallenge.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: CHALLENGE_ID },
        data: { intentos: { increment: 1 } },
      }),
    )
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ accion: AccionAuditoria.MFA_VERIFY_FAIL, exito: false }),
    )
  })

  it("verify con 5 intentos previos: marca usado y rechaza como expirado", async () => {
    prisma.mfaChallenge.findUnique.mockResolvedValue({
      id: CHALLENGE_ID,
      usuarioId: USUARIO_ID,
      expiraEn: new Date(Date.now() + 60_000),
      usado: false,
      intentos: 5,
    })
    await expect(service.verify(CHALLENGE_ID, "000000")).rejects.toMatchObject({
      response: expect.objectContaining({ code: "MFA_CHALLENGE_EXPIRADO" }),
    })
    expect(prisma.mfaChallenge.update).toHaveBeenCalledWith({
      where: { id: CHALLENGE_ID },
      data: { usado: true },
    })
  })

  it("verify challenge expirado por tiempo: rechaza", async () => {
    prisma.mfaChallenge.findUnique.mockResolvedValue({
      id: CHALLENGE_ID,
      usuarioId: USUARIO_ID,
      expiraEn: new Date(Date.now() - 1000),
      usado: false,
      intentos: 0,
    })
    await expect(service.verify(CHALLENGE_ID, "000000")).rejects.toMatchObject({
      response: expect.objectContaining({ code: "MFA_CHALLENGE_EXPIRADO" }),
    })
  })

  it("verify challenge ya usado: rechaza como expirado", async () => {
    prisma.mfaChallenge.findUnique.mockResolvedValue({
      id: CHALLENGE_ID,
      usuarioId: USUARIO_ID,
      expiraEn: new Date(Date.now() + 60_000),
      usado: true,
      intentos: 1,
    })
    await expect(service.verify(CHALLENGE_ID, "000000")).rejects.toMatchObject({
      response: expect.objectContaining({ code: "MFA_CHALLENGE_EXPIRADO" }),
    })
  })

  it("verify de challenge inexistente: rechaza como expirado", async () => {
    prisma.mfaChallenge.findUnique.mockResolvedValue(null)
    await expect(service.verify(CHALLENGE_ID, "000000")).rejects.toMatchObject({
      response: expect.objectContaining({ code: "MFA_CHALLENGE_EXPIRADO" }),
    })
  })
})

describe("MfaService.disable", () => {
  it("disablePropio con codigo OK limpia mfaSecret y audita MFA_DISABLED", async () => {
    const secret = generateSecret()
    prisma.usuario.findUnique.mockResolvedValue({
      id: USUARIO_ID,
      mfaSecret: `cifrado(${secret})`,
      mfaHabilitado: true,
    })
    const codigo = generateSync({ secret })
    await service.disablePropio(USUARIO_ID, codigo)
    expect(prisma.usuario.update).toHaveBeenCalledWith({
      where: { id: USUARIO_ID },
      data: { mfaHabilitado: false, mfaSecret: null, requiereSetupMfa: false },
    })
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ accion: AccionAuditoria.MFA_DISABLED, exito: true }),
    )
  })

  it("disablePropio con codigo incorrecto rechaza y NO toca estado", async () => {
    const secret = generateSecret()
    prisma.usuario.findUnique.mockResolvedValue({
      id: USUARIO_ID,
      mfaSecret: `cifrado(${secret})`,
      mfaHabilitado: true,
    })
    await expect(service.disablePropio(USUARIO_ID, "000000")).rejects.toBeInstanceOf(
      UnauthorizedException,
    )
    expect(prisma.usuario.update).not.toHaveBeenCalled()
  })

  it("disableAdmin desactiva sin codigo y audita con recurso=usuario", async () => {
    const adminId = "33333333-3333-3333-3333-333333333333"
    const victimaId = "44444444-4444-4444-4444-444444444444"
    prisma.usuario.findUnique.mockResolvedValue({ id: victimaId })
    await service.disableAdmin(adminId, victimaId)
    expect(prisma.usuario.update).toHaveBeenCalledWith({
      where: { id: victimaId },
      data: { mfaHabilitado: false, mfaSecret: null, requiereSetupMfa: false },
    })
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        usuarioId: adminId,
        accion: AccionAuditoria.MFA_DISABLED,
        recursoTipo: "usuario",
        recursoId: victimaId,
      }),
    )
  })
})
