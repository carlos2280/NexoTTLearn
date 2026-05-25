/**
 * seed.ts — Orquestador unico del seed.
 *
 * Siembra el unico curso vivo de la plataforma:
 *   "Frontend desde Cero: Mentalidad, Codigo y Confianza"
 * con 3 admins + 1 participante de prueba inscrito al curso. Pensado para
 * QA manual y demos.
 *
 * Cada fase vive en su propio modulo bajo `seeds/`. Ver `seeds/README.md`.
 *
 * Comando: `pnpm db:seed` (o `make db-seed`).
 *
 * Idempotente: re-correrlo NO duplica, actualiza.
 *
 * Credenciales (override via env QA_ADMIN_PASSWORD / QA_USER_PASSWORD):
 *   - Admins:        Cambiar2026!
 *   - Participante:  Qa1234!
 */

import { PrismaClient } from "@prisma/client"

import { log } from "./seeds/_utils"
import {
  ADMINS,
  AREAS,
  CLIENTE_NOMBRE,
  PARTICIPANTES,
  seedAdmins,
  seedAreas,
  seedCliente,
  seedParticipantes,
} from "./seeds/catalogo"
import {
  CURSO_SOPORTE_REACT_TITULO,
  SKILLS_SOPORTE_REACT,
  seedCursoSoporteReact,
  seedInscripcionSoporte,
  seedModulosSoporteReact,
  seedSkillsSoporteReact,
} from "./seeds/curso-soporte-react"
import { MODULOS_SOPORTE_REACT } from "./seeds/modulos/soporte-react"

async function main(): Promise<void> {
  if (process.env.DATABASE_URL?.includes("@prod") || process.env.NODE_ENV === "production") {
    throw new Error("[seed] NO ejecutar en produccion. Aborta.")
  }
  const prisma = new PrismaClient()
  try {
    log(`Iniciando seed (curso '${CURSO_SOPORTE_REACT_TITULO}')...`)

    await seedAdmins(prisma)
    await seedParticipantes(prisma)
    const areaIdByNombre = await seedAreas(prisma)
    const clienteIdResolved = await seedCliente(prisma)

    const skillIdByEtiqueta = await seedSkillsSoporteReact(prisma, areaIdByNombre)
    const modulos = await seedModulosSoporteReact(prisma, skillIdByEtiqueta)
    const cursoIdResolved = await seedCursoSoporteReact(
      prisma,
      clienteIdResolved,
      modulos,
      skillIdByEtiqueta,
    )
    await seedInscripcionSoporte(prisma, cursoIdResolved, modulos)

    log("")
    log("===== RESUMEN seed =====")
    log(`Admins:          ${ADMINS.length}`)
    log(`Participantes:   ${PARTICIPANTES.length}`)
    log(`Cliente:         ${CLIENTE_NOMBRE}`)
    log(`Areas:           ${AREAS.length}`)
    log(`Skills:          ${SKILLS_SOPORTE_REACT.length}`)
    log(`Modulos:         ${MODULOS_SOPORTE_REACT.length}`)
    log(`Secciones:       ${MODULOS_SOPORTE_REACT.reduce((acc, m) => acc + m.secciones.length, 0)}`)
    log("")
    log(`Curso vivo: '${CURSO_SOPORTE_REACT_TITULO}' (cursoId=${cursoIdResolved})`)
    log("")
    log("Admins (password Cambiar2026!):")
    for (const a of ADMINS) {
      log(
        `  - ${a.email.padEnd(40)} ${a.requiereCambioPassword ? "(cambio pwd obligado)" : "(sin cambio)"}`,
      )
    }
    log("")
    log("Participante de prueba (password Qa1234!):")
    for (const p of PARTICIPANTES) {
      log(`  - ${p.email.padEnd(40)} (sin cambio pwd, inscrito en estado ASIGNADO)`)
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
