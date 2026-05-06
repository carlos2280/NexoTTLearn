/**
 * Orquestador del seed modular.
 *
 * Modos:
 *   - "minimal": solo admin + áreas (suficiente para arrancar la app sin demo).
 *   - "full":    todo el set de datos (curso XYZ + auxiliares + cerrado + flujos).
 *
 * Reset:
 *   Si reset=true, trunca todas las tablas de dominio en orden inverso de FK
 *   antes de seedear. Útil entre cambios estructurales o para tests E2E que
 *   requieren un estado conocido. NO toca migraciones.
 */
import { credencialesParaConsola, seedUsuarios } from "./00-usuarios.js"
import { seedAreas } from "./01-areas.js"
import { seedCursoXyz } from "./02-curso-xyz.js"
import { seedCursosAuxiliares } from "./03-curso-libre.js"
import { seedCursoCerrado } from "./04-curso-cerrado.js"
import { seedInscripciones } from "./05-inscripciones.js"
import { seedEntrevistasYAlertas } from "./06-entrevistas-alertas.js"
import { seedLogsYNotificaciones } from "./07-logs-notificaciones.js"
import { prisma } from "./_lib.js"

export type SeedOptions = {
  mode: "minimal" | "full"
  reset: boolean
}

export async function runSeed(opts: SeedOptions): Promise<void> {
  const t0 = Date.now()
  console.info(`\n→ NexoTT Learn · seed (modo=${opts.mode}, reset=${opts.reset})`)

  if (opts.reset) {
    await truncarDominio()
  }

  console.info(`\n[1/${opts.mode === "minimal" ? 2 : 8}] Usuarios`)
  const usuarios = await seedUsuarios()

  console.info(`[2/${opts.mode === "minimal" ? 2 : 8}] Áreas`)
  const areas = await seedAreas()

  if (opts.mode === "minimal") {
    await finalizar(t0)
    return
  }

  console.info("[3/8] Curso XYZ ACTIVO")
  const cursoXyz = await seedCursoXyz(areas)

  console.info("[4/8] Cursos auxiliares (libre / borrador / duplicado)")
  const cursosAux = await seedCursosAuxiliares(areas, cursoXyz.cursoId)

  console.info("[5/8] Curso CERRADO + expediente")
  const cursoCerrado = await seedCursoCerrado(areas, usuarios)

  console.info("[6/8] Inscripciones, evaluaciones iniciales y entregas")
  await seedInscripciones(usuarios, areas, cursoXyz, cursosAux)

  console.info("[7/8] Entrevistas IA y alertas")
  await seedEntrevistasYAlertas(usuarios, cursoXyz)

  console.info("[8/8] Logs encadenados y notificaciones")
  await seedLogsYNotificaciones(usuarios, cursoXyz, cursoCerrado)

  await finalizar(t0)
}

async function finalizar(t0: number): Promise<void> {
  const ms = Date.now() - t0
  console.info(`\n✓ Seed completado en ${ms} ms.\n`)

  console.info(
    "Credenciales útiles (todas con `debeCambiarPassword=false` excepto admin/participante):",
  )
  for (const c of credencialesParaConsola()) {
    console.info(`  · ${c.rol.padEnd(13)} ${c.email.padEnd(34)} → ${c.password}`)
  }
  console.info("")

  await prisma.$disconnect()
}

// ────────────────────────────────────────────────────────────────────────────
// Reset: trunca todas las tablas de dominio respetando FK.
// ────────────────────────────────────────────────────────────────────────────

async function truncarDominio(): Promise<void> {
  console.info("→ Reset: truncando tablas de dominio...")
  // Orden inverso de dependencias (de hojas a raíces).
  await prisma.notificacion.deleteMany({})
  await prisma.logActividad.deleteMany({})
  await prisma.authEvento.deleteMany({})

  await prisma.alertaIA.deleteMany({})
  await prisma.detalleCapaEvaluacion.deleteMany({})
  await prisma.entregaProyecto.deleteMany({})
  await prisma.entregaBloque.deleteMany({})
  await prisma.entrevistaIASesion.deleteMany({})

  await prisma.evaluacionInicial.deleteMany({})
  await prisma.estadoModuloInscripcion.deleteMany({})
  await prisma.asignacion.deleteMany({})
  await prisma.inscripcion.deleteMany({})

  await prisma.expedienteEntryArea.deleteMany({})
  await prisma.expedienteEntry.deleteMany({})

  await prisma.rubricaEntrevistaItem.deleteMany({})
  await prisma.entrevistaIAConfig.deleteMany({})
  await prisma.proyectoTransversal.deleteMany({})
  await prisma.miniProyecto.deleteMany({})

  await prisma.bloque.deleteMany({})
  await prisma.seccion.deleteMany({})
  await prisma.modulo.deleteMany({})

  await prisma.cursoArea.deleteMany({})
  await prisma.curso.deleteMany({})
  await prisma.area.deleteMany({})

  await prisma.usuario.deleteMany({})
  console.info("  ✓ Tablas truncadas.\n")
}
