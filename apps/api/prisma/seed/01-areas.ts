/**
 * Áreas del catálogo global. Subset = ESQUEMA.md "caso real Empresa XYZ" §44.
 *
 * 6 áreas ACTIVA + 1 OBSOLETA (para testar I23: no se permiten áreas obsoletas
 * en cursos BORRADOR nuevos, pero los cursos ACTIVO/CERRADO siguen funcionando).
 */
import type { Area } from "@prisma/client"
import { diasAtras, prisma, uuidEstable } from "./_lib.js"

export const AREA_KEYS = [
  "frontend",
  "backend",
  "bd",
  "cloud",
  "herramientas",
  "softskills",
  "legacy_flash",
] as const

export type AreaKey = (typeof AREA_KEYS)[number]

const AREAS_SEED = [
  {
    key: "frontend",
    nombre: "Frontend",
    color: "#6366F1",
    descripcion: "Interfaces, UX, frameworks web",
    orden: 1,
    estado: "ACTIVA" as const,
  },
  {
    key: "backend",
    nombre: "Backend",
    color: "#10B981",
    descripcion: "APIs, servicios, persistencia",
    orden: 2,
    estado: "ACTIVA" as const,
  },
  {
    key: "bd",
    nombre: "BD",
    color: "#8B5CF6",
    descripcion: "Bases de datos, modelado, ETL",
    orden: 3,
    estado: "ACTIVA" as const,
  },
  {
    key: "cloud",
    nombre: "Cloud",
    color: "#06B6D4",
    descripcion: "Infraestructura, despliegues, escalabilidad",
    orden: 4,
    estado: "ACTIVA" as const,
  },
  {
    key: "herramientas",
    nombre: "Herramientas",
    color: "#F59E0B",
    descripcion: "Git, CI/CD, productividad de dev",
    orden: 5,
    estado: "ACTIVA" as const,
  },
  {
    key: "softskills",
    nombre: "Soft Skills",
    color: "#EC4899",
    descripcion: "Comunicación, feedback, trabajo en equipo",
    orden: 6,
    estado: "ACTIVA" as const,
  },
  {
    key: "legacy_flash",
    nombre: "Adobe Flash (legacy)",
    color: "#9CA3AF",
    descripcion: "Tecnología descontinuada — área OBSOLETA para testar T01·Q1.2",
    orden: 99,
    estado: "OBSOLETA" as const,
  },
] satisfies ReadonlyArray<{
  key: AreaKey
  nombre: string
  color: string
  descripcion: string
  orden: number
  estado: "ACTIVA" | "OBSOLETA"
}>

export type AreasSeedResult = Record<AreaKey, Area>

export async function seedAreas(): Promise<AreasSeedResult> {
  const result = {} as AreasSeedResult

  for (const a of AREAS_SEED) {
    const id = uuidEstable(`area:${a.key}`)
    const area = await prisma.area.upsert({
      where: { nombre: a.nombre },
      update: {
        color: a.color,
        descripcion: a.descripcion,
        orden: a.orden,
        estado: a.estado,
        obsoletaAt: a.estado === "OBSOLETA" ? diasAtras(180) : null,
      },
      create: {
        id,
        nombre: a.nombre,
        color: a.color,
        descripcion: a.descripcion,
        orden: a.orden,
        estado: a.estado,
        obsoletaAt: a.estado === "OBSOLETA" ? diasAtras(180) : null,
      },
    })
    result[a.key] = area
  }

  console.info(
    `  ✓ Áreas: ${AREAS_SEED.filter((a) => a.estado === "ACTIVA").length} activas + 1 obsoleta`,
  )
  return result
}
