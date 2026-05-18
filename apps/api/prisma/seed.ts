/**
 * seed.ts — Orquestador único.
 *
 * Siembra el curso destacado "Frontend para devs backend" (10 modulos,
 * 22 secciones, 44 bloques placeholder) + 3 admins + 10 participantes
 * con escenarios reales para validar la plataforma de punta a punta.
 *
 * Cada fase vive en su propio modulo bajo `seeds/`. Ver `seeds/README.md`.
 *
 * Comando: `pnpm db:seed`  (o `make db-seed`).
 *
 * Idempotente: re-correrlo NO duplica, actualiza.
 *
 * Credenciales (override via env QA_ADMIN_PASSWORD / QA_USER_PASSWORD):
 *  - Admins:        Cambiar2026!
 *  - Participantes: Qa1234!
 */

import { PrismaClient } from "@prisma/client"
import { log } from "./seeds/_utils"
import {
  ADMINS,
  AREAS,
  CLIENTE_NOMBRE,
  PARTICIPANTES,
  SKILLS_FRONTEND,
  seedAdmins,
  seedAreas,
  seedCliente,
  seedParticipantes,
  seedSkillsFrontend,
} from "./seeds/catalogo"
import { seedCurso, seedModulos } from "./seeds/curso"
import { MODULOS_FRONTEND } from "./seeds/modulos"
import { seedAsignacionesFrontend, seedNotasSkill } from "./seeds/progreso"

async function main(): Promise<void> {
  if (process.env.DATABASE_URL?.includes("@prod") || process.env.NODE_ENV === "production") {
    throw new Error("[seed] NO ejecutar en produccion. Aborta.")
  }
  const prisma = new PrismaClient()
  try {
    log("Iniciando seed (curso 'Frontend para devs backend')...")
    await seedAdmins(prisma)
    await seedParticipantes(prisma)
    const areaIdByNombre = await seedAreas(prisma)
    const clienteIdResolved = await seedCliente(prisma)
    const skillIdByEtiqueta = await seedSkillsFrontend(prisma, areaIdByNombre)
    const modulos = await seedModulos(prisma, skillIdByEtiqueta)
    const cursoIdResolved = await seedCurso(prisma, clienteIdResolved, modulos, skillIdByEtiqueta)
    await seedAsignacionesFrontend(prisma, cursoIdResolved, modulos)
    await seedNotasSkill(prisma, cursoIdResolved, skillIdByEtiqueta)

    log("")
    log("===== RESUMEN seed =====")
    log(`Admins:          ${ADMINS.length}`)
    log(`Participantes:   ${PARTICIPANTES.length}`)
    log(`Cliente:         ${CLIENTE_NOMBRE}`)
    log(`Areas:           ${AREAS.length}`)
    log(`Skills:          ${SKILLS_FRONTEND.length}`)
    log(`Modulos:         ${MODULOS_FRONTEND.length}`)
    log(`Secciones:       ${MODULOS_FRONTEND.reduce((acc, m) => acc + m.secciones.length, 0)}`)
    log(`Asignaciones:    ${PARTICIPANTES.length}`)
    log("")
    log("Curso destacado: 'Frontend para devs backend' (10 modulos placeholder).")
    log("Entrevista IA y Transversal habilitados.")
    log("")
    log("Admins (password Cambiar2026!):")
    for (const a of ADMINS) {
      log(
        `  - ${a.email.padEnd(40)} ${a.requiereCambioPassword ? "(cambio pwd obligado)" : "(sin cambio)"}`,
      )
    }
    log("")
    log("Participantes (password Qa1234!):")
    for (const a of PARTICIPANTES) {
      log(`  - ${a.email.padEnd(40)} → ${a.estado}`)
    }
    log("========================")
  } catch (err) {
    log(`ERROR: ${err instanceof Error ? err.message : String(err)}`)
    if (err instanceof Error && err.stack) {
      log(err.stack)
    }
    process.exitCode = 1
  } finally {
    await prisma.$disconnect()
  }
}

main()
