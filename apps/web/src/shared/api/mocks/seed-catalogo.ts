import type {
  AreaResponse,
  ClienteResponse,
  ModuloResponse,
  SkillResponse,
} from "@nexott-learn/shared-types"

function isoAhora(): string {
  return new Date().toISOString()
}

function uuid(suffix: string): string {
  return `00000000-0000-4000-a000-${suffix.padStart(12, "0")}`
}

const ahora = isoAhora()

const ID_AREA_BACKEND = uuid("area1")
const ID_AREA_FRONTEND = uuid("area2")
const ID_AREA_DATOS = uuid("area3")
const ID_AREA_CLOUD = uuid("area4")
const ID_AREA_PRODUCTO = uuid("area5")
const ID_AREA_CALIDAD = uuid("area6")

export const SEED_AREAS: AreaResponse[] = [
  {
    id: ID_AREA_BACKEND,
    nombre: "Backend",
    codigo: "backend",
    descripcion: "Servicios, APIs, datos, infra.",
    createdAt: ahora,
    updatedAt: ahora,
  },
  {
    id: ID_AREA_FRONTEND,
    nombre: "Frontend",
    codigo: "frontend",
    descripcion: "Web, móvil, experiencia.",
    createdAt: ahora,
    updatedAt: ahora,
  },
  {
    id: ID_AREA_DATOS,
    nombre: "Datos",
    codigo: "data",
    descripcion: "Analítica, pipelines, BI.",
    createdAt: ahora,
    updatedAt: ahora,
  },
  {
    id: ID_AREA_CLOUD,
    nombre: "Cloud & DevOps",
    codigo: "cloud",
    descripcion: "AWS, Azure, GCP, IaC, CI/CD.",
    createdAt: ahora,
    updatedAt: ahora,
  },
  {
    id: ID_AREA_PRODUCTO,
    nombre: "Producto",
    codigo: "soft",
    descripcion: "Discovery, gestión, métricas.",
    createdAt: ahora,
    updatedAt: ahora,
  },
  {
    id: ID_AREA_CALIDAD,
    nombre: "Calidad",
    codigo: "qa",
    descripcion: "Testing automatizado, QA, performance.",
    createdAt: ahora,
    updatedAt: ahora,
  },
]

export const SEED_SKILLS: SkillResponse[] = [
  {
    id: uuid("skill1"),
    etiquetaVisible: "TypeScript",
    areaId: ID_AREA_BACKEND,
    estado: "ACTIVA",
    createdAt: ahora,
    updatedAt: ahora,
  },
  {
    id: uuid("skill2"),
    etiquetaVisible: "NestJS",
    areaId: ID_AREA_BACKEND,
    estado: "ACTIVA",
    createdAt: ahora,
    updatedAt: ahora,
  },
  {
    id: uuid("skill3"),
    etiquetaVisible: "PostgreSQL",
    areaId: ID_AREA_BACKEND,
    estado: "ACTIVA",
    createdAt: ahora,
    updatedAt: ahora,
  },
  {
    id: uuid("skill4"),
    etiquetaVisible: "React",
    areaId: ID_AREA_FRONTEND,
    estado: "ACTIVA",
    createdAt: ahora,
    updatedAt: ahora,
  },
  {
    id: uuid("skill5"),
    etiquetaVisible: "Vite",
    areaId: ID_AREA_FRONTEND,
    estado: "ACTIVA",
    createdAt: ahora,
    updatedAt: ahora,
  },
  {
    id: uuid("skill6"),
    etiquetaVisible: "AngularJS (1.x)",
    areaId: ID_AREA_FRONTEND,
    estado: "ARCHIVADA",
    createdAt: ahora,
    updatedAt: ahora,
  },
  {
    id: uuid("skill7"),
    etiquetaVisible: "SQL avanzado",
    areaId: ID_AREA_DATOS,
    estado: "ACTIVA",
    createdAt: ahora,
    updatedAt: ahora,
  },
  {
    id: uuid("skill8"),
    etiquetaVisible: "Terraform",
    areaId: ID_AREA_CLOUD,
    estado: "ACTIVA",
    createdAt: ahora,
    updatedAt: ahora,
  },
]

export const SEED_MODULOS: ModuloResponse[] = [
  {
    id: uuid("mod1"),
    titulo: "Fundamentos de TypeScript",
    descripcion: "Tipos, genéricos, narrowing, utility types.",
    estado: "ACTIVO",
    createdAt: ahora,
    updatedAt: ahora,
  },
  {
    id: uuid("mod2"),
    titulo: "NestJS desde cero",
    descripcion: "Módulos, providers, guards, pipes, interceptors.",
    estado: "ACTIVO",
    createdAt: ahora,
    updatedAt: ahora,
  },
  {
    id: uuid("mod3"),
    titulo: "Prisma + PostgreSQL",
    descripcion: "Schema, migraciones, queries, transacciones.",
    estado: "ACTIVO",
    createdAt: ahora,
    updatedAt: ahora,
  },
  {
    id: uuid("mod4"),
    titulo: "React moderno",
    descripcion: "Hooks, Suspense, Server Components, Tanstack Query.",
    estado: "ACTIVO",
    createdAt: ahora,
    updatedAt: ahora,
  },
  {
    id: uuid("mod5"),
    titulo: "Legacy: AngularJS",
    descripcion: "Solo para clientes con sistemas heredados.",
    estado: "ARCHIVADO",
    createdAt: ahora,
    updatedAt: ahora,
  },
]

export const SEED_CLIENTES: ClienteResponse[] = [
  {
    id: uuid("cli1"),
    nombre: "BBVA",
    activo: true,
    fechaCreacion: ahora,
    createdAt: ahora,
    updatedAt: ahora,
  },
  {
    id: uuid("cli2"),
    nombre: "Mapfre",
    activo: true,
    fechaCreacion: ahora,
    createdAt: ahora,
    updatedAt: ahora,
  },
  {
    id: uuid("cli3"),
    nombre: "Telefónica",
    activo: true,
    fechaCreacion: ahora,
    createdAt: ahora,
    updatedAt: ahora,
  },
  {
    id: uuid("cli4"),
    nombre: "Iberdrola",
    activo: true,
    fechaCreacion: ahora,
    createdAt: ahora,
    updatedAt: ahora,
  },
  {
    id: uuid("cli5"),
    nombre: "ACME (histórico)",
    activo: false,
    fechaCreacion: ahora,
    createdAt: ahora,
    updatedAt: ahora,
  },
]
