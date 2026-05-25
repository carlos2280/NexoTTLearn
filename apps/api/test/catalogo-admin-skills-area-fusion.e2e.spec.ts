// biome-ignore lint/correctness/noNodejsModules: el harness e2e necesita filesystem para detectar dist/.
import { existsSync } from "node:fs"
// biome-ignore lint/correctness/noNodejsModules: idem.
import { join, resolve } from "node:path"
import type { INestApplication, Type } from "@nestjs/common"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcrypt"
import supertest, { type Agent, type Response } from "supertest"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

const HAS_DB_URL = Boolean(process.env.DATABASE_URL)
const DIST_DIR = resolve(__dirname, "..", "dist")
const DIST_DISPONIBLE = existsSync(join(DIST_DIR, "app.module.js"))

if (!HAS_DB_URL) {
  console.warn("catalogo-admin-skills-area-fusion.e2e: DATABASE_URL ausente — tests SKIP.")
}
if (HAS_DB_URL && !DIST_DISPONIBLE) {
  console.warn(
    "catalogo-admin-skills-area-fusion.e2e: dist/ no encontrado — ejecutar `pnpm --filter @nexott-learn/api build`. SKIP.",
  )
}

const RUN_E2E = HAS_DB_URL && DIST_DISPONIBLE

// Admin propio para evitar colisionar con otros e2e (mismo patron que P3a).
const ADMIN_EMAIL = "catalogo-admin-p3b@nttdata.test"
const ADMIN_PASSWORD = "Catalogo1234!"
const PARTICIPANTE_EMAIL = "catalogo-part-p3b@nttdata.test"
const PARTICIPANTE_PASSWORD = "Catalogo1234!"
const FIXTURE_SUFFIX = "-p3b-e2e"

interface ModuloApp {
  // biome-ignore lint/style/useNamingConvention: la clase Nest es PascalCase.
  AppModule: Type<unknown>
}
interface ModuloHttp {
  configurarHttp: (app: unknown) => void
}

function extraerXsrf(res: Response): string | null {
  const setCookie = res.headers["set-cookie"]
  if (!setCookie) {
    return null
  }
  const arr = Array.isArray(setCookie) ? setCookie : [setCookie]
  for (const raw of arr) {
    const m = /^XSRF-TOKEN=([^;]+)/.exec(raw)
    if (m?.[1]) {
      return m[1]
    }
  }
  return null
}

describe.runIf(RUN_E2E)("catalogo-admin skills cambio area + fusion e2e (P3b)", () => {
  let app: INestApplication
  let agenteAdmin: Agent
  let agentePart: Agent
  let csrfAdmin: string
  let csrfPart: string
  let prisma: PrismaClient

  beforeAll(async () => {
    prisma = new PrismaClient()
    try {
      await prisma.$queryRaw`SELECT 1`
    } catch (error) {
      const detalle = error instanceof Error ? error.message : String(error)
      throw new Error(`No se pudo conectar a la BD para los e2e: ${detalle}`)
    }

    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12)
    const colAdmin = await prisma.colaborador.upsert({
      where: { email: ADMIN_EMAIL },
      update: { nombre: "Catalogo Admin P3b", estadoEmpleado: "ACTIVO" },
      create: { email: ADMIN_EMAIL, nombre: "Catalogo Admin P3b", estadoEmpleado: "ACTIVO" },
      select: { id: true },
    })
    await prisma.usuario.upsert({
      where: { colaboradorId: colAdmin.id },
      update: {
        passwordHash,
        requiereCambioPassword: false,
        passwordInicialCaduca: null,
        intentosFallidos: 0,
        bloqueado: false,
        rol: "ADMIN",
        mfaHabilitado: false,
        requiereSetupMfa: false,
      },
      create: {
        colaboradorId: colAdmin.id,
        rol: "ADMIN",
        passwordHash,
        requiereCambioPassword: false,
        intentosFallidos: 0,
        bloqueado: false,
        mfaHabilitado: false,
      },
    })

    const passwordHashPart = await bcrypt.hash(PARTICIPANTE_PASSWORD, 12)
    const colPart = await prisma.colaborador.upsert({
      where: { email: PARTICIPANTE_EMAIL },
      update: { nombre: "Participante P3b", estadoEmpleado: "ACTIVO" },
      create: { email: PARTICIPANTE_EMAIL, nombre: "Participante P3b", estadoEmpleado: "ACTIVO" },
      select: { id: true },
    })
    await prisma.usuario.upsert({
      where: { colaboradorId: colPart.id },
      update: {
        passwordHash: passwordHashPart,
        requiereCambioPassword: false,
        passwordInicialCaduca: null,
        intentosFallidos: 0,
        bloqueado: false,
        rol: "PARTICIPANTE",
        mfaHabilitado: false,
        requiereSetupMfa: false,
      },
      create: {
        colaboradorId: colPart.id,
        rol: "PARTICIPANTE",
        passwordHash: passwordHashPart,
        requiereCambioPassword: false,
        intentosFallidos: 0,
        bloqueado: false,
        mfaHabilitado: false,
      },
    })

    await prisma.$executeRaw`
      DELETE FROM sesiones
      WHERE (sess::jsonb->>'usuarioId') IN (
        SELECT id::text FROM usuarios WHERE colaborador_id IN (${colAdmin.id}::uuid, ${colPart.id}::uuid)
      )
    `

    const moduleApp = (await import(join(DIST_DIR, "app.module.js"))) as ModuloApp
    const moduleHttp = (await import(join(DIST_DIR, "bootstrap-http.js"))) as ModuloHttp
    const { Test } = await import("@nestjs/testing")
    const { ThrottlerGuard } = await import("@nestjs/throttler")
    const throttlerSiempreOk = { canActivate: (): boolean => true }

    const moduleRef = await Test.createTestingModule({
      imports: [moduleApp.AppModule],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue(throttlerSiempreOk)
      .compile()

    app = moduleRef.createNestApplication()
    moduleHttp.configurarHttp(app)
    await app.init()

    agenteAdmin = supertest.agent(app.getHttpServer())
    const loginAdmin = await agenteAdmin
      .post("/api/v1/auth/login")
      .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
    if (loginAdmin.status !== 200) {
      throw new Error(`Login admin P3b fallo con status ${loginAdmin.status}`)
    }
    const tokenAdmin = extraerXsrf(loginAdmin)
    if (!tokenAdmin) {
      throw new Error("No se obtuvo XSRF token tras login admin")
    }
    csrfAdmin = tokenAdmin

    agentePart = supertest.agent(app.getHttpServer())
    const loginPart = await agentePart
      .post("/api/v1/auth/login")
      .send({ email: PARTICIPANTE_EMAIL, password: PARTICIPANTE_PASSWORD })
    if (loginPart.status !== 200) {
      throw new Error(`Login participante P3b fallo con status ${loginPart.status}`)
    }
    const tokenPart = extraerXsrf(loginPart)
    if (!tokenPart) {
      throw new Error("No se obtuvo XSRF token tras login participante")
    }
    csrfPart = tokenPart
  }, 60_000)

  afterAll(async () => {
    try {
      const suffixLike = `%${FIXTURE_SUFFIX}%`
      await prisma.$executeRaw`
        DELETE FROM bloques
        WHERE skill_que_mide_id IN (
          SELECT id FROM skills WHERE etiqueta_visible LIKE ${suffixLike}
        )
      `
      await prisma.$executeRaw`
        DELETE FROM secciones_skills
        WHERE skill_id IN (
          SELECT id FROM skills WHERE etiqueta_visible LIKE ${suffixLike}
        )
      `
      await prisma.$executeRaw`
        DELETE FROM cursos_skills_exigidas
        WHERE skill_id IN (
          SELECT id FROM skills WHERE etiqueta_visible LIKE ${suffixLike}
        )
      `
      await prisma.$executeRaw`
        DELETE FROM cursos_areas_exigidas
        WHERE area_id IN (
          SELECT id FROM areas WHERE nombre LIKE ${suffixLike}
        )
      `
      await prisma.$executeRaw`
        DELETE FROM historico_renombrados_skill
        WHERE skill_id IN (
          SELECT id FROM skills WHERE etiqueta_visible LIKE ${suffixLike}
        )
      `
      await prisma.$executeRaw`
        DELETE FROM historico_cambios_area_skill
        WHERE skill_id IN (
          SELECT id FROM skills WHERE etiqueta_visible LIKE ${suffixLike}
        )
      `
      await prisma.$executeRaw`DELETE FROM skills WHERE etiqueta_visible LIKE ${suffixLike}`
      await prisma.$executeRaw`
        DELETE FROM secciones WHERE modulo_id IN (
          SELECT id FROM modulos WHERE titulo LIKE ${suffixLike}
        )
      `
      await prisma.$executeRaw`DELETE FROM modulos WHERE titulo LIKE ${suffixLike}`
      await prisma.$executeRaw`DELETE FROM cursos WHERE titulo LIKE ${suffixLike}`
      await prisma.$executeRaw`DELETE FROM clientes WHERE nombre LIKE ${suffixLike}`
      await prisma.$executeRaw`DELETE FROM areas WHERE nombre LIKE ${suffixLike}`

      for (const email of [ADMIN_EMAIL, PARTICIPANTE_EMAIL]) {
        const col = await prisma.colaborador.findUnique({
          where: { email },
          select: { id: true },
        })
        if (col) {
          await prisma.$executeRaw`
            DELETE FROM sesiones
            WHERE (sess::jsonb->>'usuarioId') IN (
              SELECT id::text FROM usuarios WHERE colaborador_id = ${col.id}::uuid
            )
          `
          await prisma.activityLog.deleteMany({ where: { usuario: { colaboradorId: col.id } } })
          await prisma.usuario.deleteMany({ where: { colaboradorId: col.id } })
          await prisma.colaborador.delete({ where: { id: col.id } })
        }
      }
    } catch (error) {
      const detalle = error instanceof Error ? error.message : String(error)
      console.warn(`catalogo-admin P3b cleanup fallo (no rompe teardown): ${detalle}`)
    }

    if (app) {
      await app.close()
    }
    if (prisma) {
      await prisma.$disconnect()
    }
  })

  it("POST /skills/:id/preview-cambio-area reporta impacto real (curso + seccion)", async () => {
    // Fixtures: area origen + area destino + skill + cliente + curso + curso_skill_exigida + modulo + seccion + seccion_skill.
    const areaOrigen = await prisma.area.create({
      data: { nombre: `Area-Origen${FIXTURE_SUFFIX}` },
      select: { id: true },
    })
    const areaDestino = await prisma.area.create({
      data: { nombre: `Area-Destino${FIXTURE_SUFFIX}` },
      select: { id: true },
    })
    const skill = await prisma.skill.create({
      data: { etiquetaVisible: `preview.skill${FIXTURE_SUFFIX}`, areaId: areaOrigen.id },
      select: { id: true },
    })
    const cliente = await prisma.cliente.create({
      data: { nombre: `Cliente-Preview${FIXTURE_SUFFIX}` },
      select: { id: true },
    })
    const curso = await prisma.curso.create({
      data: {
        titulo: `Curso-Preview${FIXTURE_SUFFIX}`,
        clienteId: cliente.id,
        fechaInicio: new Date("2026-01-01"),
        fechaDeadline: new Date("2026-12-31"),
      },
      select: { id: true },
    })
    await prisma.cursoSkillExigida.create({
      data: { cursoId: curso.id, skillId: skill.id, notaMinima: 70 },
    })
    const modulo = await prisma.modulo.create({
      data: { titulo: `Modulo-Preview${FIXTURE_SUFFIX}` },
      select: { id: true },
    })
    const seccion = await prisma.seccion.create({
      data: { moduloId: modulo.id, titulo: `Seccion-Preview${FIXTURE_SUFFIX}`, orden: 1 },
      select: { id: true },
    })
    await prisma.seccionSkill.create({ data: { seccionId: seccion.id, skillId: skill.id } })

    const res = await agenteAdmin
      .post(`/api/v1/catalogo/skills/${skill.id}/preview-cambio-area`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .send({ areaDestinoId: areaDestino.id })

    expect(res.status).toBe(200)
    const body = res.body as {
      skillId: string
      areaActualId: string
      areaDestinoId: string
      impacto: {
        cursosAfectados: readonly { cursoId: string; titulo: string }[]
        modulosAfectados: readonly { moduloId: string; titulo: string }[]
        bloquesAfectados: number
        seccionesAfectadas: number
        totalReferencias: number
      }
    }
    expect(body.areaActualId).toBe(areaOrigen.id)
    expect(body.areaDestinoId).toBe(areaDestino.id)
    expect(body.impacto.cursosAfectados.some((c) => c.cursoId === curso.id)).toBe(true)
    expect(body.impacto.modulosAfectados.some((m) => m.moduloId === modulo.id)).toBe(true)
    expect(body.impacto.seccionesAfectadas).toBe(1)
    expect(body.impacto.totalReferencias).toBeGreaterThanOrEqual(2)
  })

  it("POST /skills/:id/area cambia area, persiste motivo en historico y emite SKILL_CAMBIO_AREA con metadata", async () => {
    const areaOrigen = await prisma.area.create({
      data: { nombre: `Area-Cambio-Origen${FIXTURE_SUFFIX}` },
      select: { id: true },
    })
    const areaDestino = await prisma.area.create({
      data: { nombre: `Area-Cambio-Destino${FIXTURE_SUFFIX}` },
      select: { id: true },
    })
    const skill = await prisma.skill.create({
      data: { etiquetaVisible: `cambio.area.skill${FIXTURE_SUFFIX}`, areaId: areaOrigen.id },
      select: { id: true },
    })

    const res = await agenteAdmin
      .post(`/api/v1/catalogo/skills/${skill.id}/area`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .set("X-Motivo", "reorganizacion del catalogo")
      .send({ areaDestinoId: areaDestino.id })
    expect(res.status).toBe(200)
    expect((res.body as { areaId: string }).areaId).toBe(areaDestino.id)

    const hist = await prisma.historicoCambiosAreaSkill.findFirst({
      where: { skillId: skill.id },
      orderBy: { fecha: "desc" },
      select: { motivo: true, areaAnteriorId: true, areaNuevaId: true },
    })
    expect(hist).not.toBeNull()
    expect(hist?.motivo).toBe("reorganizacion del catalogo")
    expect(hist?.areaAnteriorId).toBe(areaOrigen.id)
    expect(hist?.areaNuevaId).toBe(areaDestino.id)

    const log = await prisma.activityLog.findFirst({
      where: { accion: "SKILL_CAMBIO_AREA", recursoId: skill.id },
      select: { metadata: true },
    })
    expect(log).not.toBeNull()
    const meta = log?.metadata as Record<string, unknown> | null
    expect(meta?.motivo).toBe("reorganizacion del catalogo")
    expect(meta?.areaAnteriorId).toBe(areaOrigen.id)
    expect(meta?.areaNuevaId).toBe(areaDestino.id)
  })

  it("POST /skills/:id/area: 409 SKILL_YA_EN_AREA_DESTINO si destino == actual", async () => {
    const area = await prisma.area.create({
      data: { nombre: `Area-Misma${FIXTURE_SUFFIX}` },
      select: { id: true },
    })
    const skill = await prisma.skill.create({
      data: { etiquetaVisible: `misma.area${FIXTURE_SUFFIX}`, areaId: area.id },
      select: { id: true },
    })
    const res = await agenteAdmin
      .post(`/api/v1/catalogo/skills/${skill.id}/area`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .set("X-Motivo", "test")
      .send({ areaDestinoId: area.id })
    expect(res.status).toBe(409)
    expect((res.body as { code: string }).code).toBe("SKILL_YA_EN_AREA_DESTINO")
  })

  it("POST /skills/:id/area sin X-Motivo: 422 MOTIVO_REQUERIDO", async () => {
    const areaA = await prisma.area.create({
      data: { nombre: `Area-NoMotivo-A${FIXTURE_SUFFIX}` },
      select: { id: true },
    })
    const areaB = await prisma.area.create({
      data: { nombre: `Area-NoMotivo-B${FIXTURE_SUFFIX}` },
      select: { id: true },
    })
    const skill = await prisma.skill.create({
      data: { etiquetaVisible: `nomotivo.cambio${FIXTURE_SUFFIX}`, areaId: areaA.id },
      select: { id: true },
    })
    const res = await agenteAdmin
      .post(`/api/v1/catalogo/skills/${skill.id}/area`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .send({ areaDestinoId: areaB.id })
    expect(res.status).toBe(422)
    expect((res.body as { code: string }).code).toBe("MOTIVO_REQUERIDO")
  })

  it("POST /skills/fusionar migra referencias, archiva la perdedora y NO toca nota_skill", async () => {
    const area = await prisma.area.create({
      data: { nombre: `Area-Fusion${FIXTURE_SUFFIX}` },
      select: { id: true },
    })
    const ganadora = await prisma.skill.create({
      data: { etiquetaVisible: `fusion.ganadora${FIXTURE_SUFFIX}`, areaId: area.id },
      select: { id: true },
    })
    const perdedora = await prisma.skill.create({
      data: { etiquetaVisible: `fusion.perdedora${FIXTURE_SUFFIX}`, areaId: area.id },
      select: { id: true },
    })
    const modulo = await prisma.modulo.create({
      data: { titulo: `Modulo-Fusion${FIXTURE_SUFFIX}` },
      select: { id: true },
    })
    const seccion = await prisma.seccion.create({
      data: { moduloId: modulo.id, titulo: `Seccion-Fusion${FIXTURE_SUFFIX}`, orden: 1 },
      select: { id: true },
    })
    await prisma.seccionSkill.create({ data: { seccionId: seccion.id, skillId: perdedora.id } })

    const res = await agenteAdmin
      .post("/api/v1/catalogo/skills/fusionar")
      .set("X-XSRF-TOKEN", csrfAdmin)
      .set("X-Motivo", "consolidar skills duplicadas")
      .send({ skillGanadoraId: ganadora.id, skillPerdedoraId: perdedora.id })
    expect(res.status).toBe(200)
    const body = res.body as {
      skillGanadora: { id: string; estado: string }
      skillPerdedora: { id: string; estado: string }
      referenciasMigradas: { secciones: number; cursos: number; bloques: number }
    }
    expect(body.skillGanadora.id).toBe(ganadora.id)
    expect(body.skillPerdedora.estado).toBe("ARCHIVADA")
    expect(body.referenciasMigradas.secciones).toBe(1)

    // La referencia ahora apunta a la ganadora.
    const seccionSkill = await prisma.seccionSkill.findFirst({
      where: { seccionId: seccion.id },
      select: { skillId: true },
    })
    expect(seccionSkill?.skillId).toBe(ganadora.id)

    const log = await prisma.activityLog.findFirst({
      where: { accion: "SKILL_FUSIONADA", recursoId: ganadora.id },
      select: { metadata: true },
    })
    expect(log).not.toBeNull()
    const meta = log?.metadata as Record<string, unknown> | null
    expect(meta?.skillPerdedoraId).toBe(perdedora.id)
  })

  it("POST /skills/fusionar sin X-Motivo: 422 MOTIVO_REQUERIDO", async () => {
    const area = await prisma.area.create({
      data: { nombre: `Area-FusionNoMot${FIXTURE_SUFFIX}` },
      select: { id: true },
    })
    const g = await prisma.skill.create({
      data: { etiquetaVisible: `fusion.nomotivo.g${FIXTURE_SUFFIX}`, areaId: area.id },
      select: { id: true },
    })
    const p = await prisma.skill.create({
      data: { etiquetaVisible: `fusion.nomotivo.p${FIXTURE_SUFFIX}`, areaId: area.id },
      select: { id: true },
    })
    const res = await agenteAdmin
      .post("/api/v1/catalogo/skills/fusionar")
      .set("X-XSRF-TOKEN", csrfAdmin)
      .send({ skillGanadoraId: g.id, skillPerdedoraId: p.id })
    expect(res.status).toBe(422)
    expect((res.body as { code: string }).code).toBe("MOTIVO_REQUERIDO")
  })

  it("sello RolesGuard: PARTICIPANTE -> 403 en preview/cambio-area/fusionar", async () => {
    const area = await prisma.area.create({
      data: { nombre: `Area-Roles${FIXTURE_SUFFIX}` },
      select: { id: true },
    })
    const skill = await prisma.skill.create({
      data: { etiquetaVisible: `roles.skill${FIXTURE_SUFFIX}`, areaId: area.id },
      select: { id: true },
    })

    const preview = await agentePart
      .post(`/api/v1/catalogo/skills/${skill.id}/preview-cambio-area`)
      .set("X-XSRF-TOKEN", csrfPart)
      .send({ areaDestinoId: area.id })
    expect(preview.status).toBe(403)

    const cambio = await agentePart
      .post(`/api/v1/catalogo/skills/${skill.id}/area`)
      .set("X-XSRF-TOKEN", csrfPart)
      .set("X-Motivo", "x")
      .send({ areaDestinoId: area.id })
    expect(cambio.status).toBe(403)

    const fusion = await agentePart
      .post("/api/v1/catalogo/skills/fusionar")
      .set("X-XSRF-TOKEN", csrfPart)
      .set("X-Motivo", "x")
      .send({
        skillGanadoraId: "00000000-0000-0000-0000-000000000001",
        skillPerdedoraId: "00000000-0000-0000-0000-000000000002",
      })
    expect(fusion.status).toBe(403)
  })
})
