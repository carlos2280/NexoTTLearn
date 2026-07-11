/**
 * Carga un módulo .md al sistema para verlo vivo en dev (herramienta de autor).
 *
 * Hace los pasos: asegura el cliente → importa (el servicio real crea curso +
 * módulos + secciones + bloques + skills + área + SeccionSkill + exigidas) →
 * activa el curso → asigna al participante → genera el plan → imprime la URL.
 *
 * El importador es el ÚNICO dueño de skills/área/exigidas (una sola área con el
 * título del curso). Este loader ya NO pre-crea skills ni área ni CursoAreaExigida
 * para no duplicarlas.
 *
 * USO (con la DB y la api de dev corriendo):
 *   cd /home/carlos/projects/nttdata/NexoTTLearn/apps/api
 *   pnpm exec tsx scripts/cargar-modulo.ts /ruta/al/modulo_NN.md
 */
import "dotenv/config"
import { randomUUID } from "node:crypto"
import { readFileSync } from "node:fs"
import { PrismaClient } from "@prisma/client"
import { ImportarCursoService } from "../src/cursos/importar-curso/importar-curso.service"

const BASE = "http://localhost:4000/api/v1"
const PARTICIPANTE = "participante@nexott.local"
const ADMIN = { email: "qa-admin@nexott.local", password: "Cambiar2026!" }

const cookiesFrom = (r: Response): string =>
  (r.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]).join("; ")

const RE_CLIENTE = /cliente:\s*"([^"]+)"/

function extraerCliente(md: string): string {
  return RE_CLIENTE.exec(md)?.[1] ?? "Minera Demo"
}

async function main(): Promise<void> {
  const rutaMd = process.argv[2]
  if (!rutaMd) {
    throw new Error("Falta la ruta del .md: pnpm exec tsx scripts/cargar-modulo.ts <archivo.md>")
  }
  const contenidoMd = readFileSync(rutaMd, "utf8")

  const prisma = new PrismaClient()
  await prisma.$connect()

  // 1) Único prerrequisito: el cliente debe existir (el importador lo exige).
  const cliente = extraerCliente(contenidoMd)
  await prisma.cliente.upsert({
    where: { nombre: cliente },
    update: {},
    create: { nombre: cliente },
  })
  console.log(`cliente: ${cliente}`)

  // 2) Importar (crea curso BORRADOR + skills + área + exigidas) — servicio REAL.
  const res = await new ImportarCursoService(prisma as never).importar({ contenidoMd })
  const cursoId = res.cursoId
  console.log(`IMPORTADO → ${JSON.stringify(res)}`)

  // 3) Activar el curso (el importador ya dejó su área exigida peso 100).
  await prisma.curso.update({ where: { id: cursoId }, data: { estado: "ACTIVO" } })

  // 4) Asignar al participante.
  const colab = await prisma.colaborador.findFirst({
    where: { email: PARTICIPANTE },
    select: { id: true },
  })
  if (!colab) {
    throw new Error(`No existe el colaborador ${PARTICIPANTE} (¿corriste el seed?).`)
  }
  const asig = await prisma.asignacionCurso.upsert({
    where: { colaboradorId_cursoId: { colaboradorId: colab.id, cursoId } },
    update: { rol: "ASIGNADO", estadoAsignado: "ASIGNADO" },
    create: { colaboradorId: colab.id, cursoId, rol: "ASIGNADO", estadoAsignado: "ASIGNADO" },
    select: { id: true },
  })
  await prisma.$disconnect()

  // 5) Generar el plan (admin) para que cargue el panel izquierdo.
  const lg = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(ADMIN),
  })
  const lb = (await lg.json()) as { csrfToken?: string }
  const calc = await fetch(`${BASE}/asignaciones/${asig.id}/plan/calcular`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookiesFrom(lg),
      "X-XSRF-TOKEN": lb.csrfToken ?? "",
      "Idempotency-Key": randomUUID(),
    },
  })
  console.log(`plan/calcular → ${calc.status}`)

  // 6) Listo.
  console.log("\n✅ LISTO. Abrí en dev:")
  console.log(`   http://localhost:5173/cursos/${cursoId}`)
  console.log(`   login: ${PARTICIPANTE} / Qa1234!`)
}

main().catch((e) => {
  console.error("ERROR:", e instanceof Error ? e.message : e)
  process.exit(1)
})
