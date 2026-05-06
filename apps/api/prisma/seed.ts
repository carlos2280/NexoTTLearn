/**
 * Entrypoint de seed. Delega al orquestador modular en `seed/`.
 *
 * Modos:
 *   pnpm db:seed             → seed completo idempotente (full)
 *   pnpm db:seed:minimal     → solo admin + áreas (arranque mínimo)
 *   pnpm db:seed:reset       → trunca tablas de dominio y vuelve a seedear full
 *
 * El seed completo replica el caso real "Empresa XYZ" del ESQUEMA.md
 * (DOCUMENTOS/doc/v2/ESQUEMA.md) más variantes para cubrir flujos de test:
 * cursos en BORRADOR / ACTIVO / CERRADO, inscripciones SOLICITUD y LIBRE,
 * múltiples intentos por bloque, proyectos en distintas etapas, entrevista IA,
 * expediente sellado, logs con causaId encadenado, notificaciones de los
 * 10 tipos.
 */
import { runSeed } from "./seed/index.js"

const args = process.argv.slice(2)
const mode = args.includes("--minimal") ? "minimal" : "full"
const reset = args.includes("--reset")

runSeed({ mode, reset }).catch((err: unknown) => {
  console.error("✗ Seed falló:", err)
  process.exit(1)
})
