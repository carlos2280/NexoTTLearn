import { BookOpen, Clock, Users } from "lucide-react"
import { PgSection } from "./pg-section"

interface CursoMock {
  readonly id: string
  readonly area: string
  readonly titulo: string
  readonly cliente: string
  readonly skills: number
  readonly horas: number
  readonly inscritos: number
  readonly avance: number
}

const CURSOS: readonly CursoMock[] = [
  {
    id: "1",
    area: "backend",
    titulo: "Backend + FastAPI",
    cliente: "Banco Atlas",
    skills: 6,
    horas: 24,
    inscritos: 12,
    avance: 68,
  },
  {
    id: "2",
    area: "frontend",
    titulo: "React Avanzado · Hooks y patrones",
    cliente: "Retail Nova",
    skills: 5,
    horas: 18,
    inscritos: 8,
    avance: 42,
  },
  {
    id: "3",
    area: "data",
    titulo: "Data Engineering con PySpark",
    cliente: "Energía Lumen",
    skills: 7,
    horas: 32,
    inscritos: 5,
    avance: 12,
  },
  {
    id: "4",
    area: "cloud",
    titulo: "Azure Fundamentals · Databricks",
    cliente: "Banca Soluciones",
    skills: 4,
    horas: 16,
    inscritos: 14,
    avance: 88,
  },
  {
    id: "5",
    area: "devops",
    titulo: "CI/CD con GitHub Actions",
    cliente: "Plataforma uno",
    skills: 3,
    horas: 12,
    inscritos: 6,
    avance: 55,
  },
  {
    id: "6",
    area: "soft",
    titulo: "Comunicación con cliente",
    cliente: "Transversal",
    skills: 2,
    horas: 8,
    inscritos: 22,
    avance: 30,
  },
]

export function PgCardsCurso() {
  return (
    <PgSection
      eyebrow="Componentes · Curso"
      titulo="Cards de curso"
      descripcion="El corazón visual del producto. Cada card vive su área: tinta de imagen, glow propio en hover, lift sutil."
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {CURSOS.map((curso) => (
          <CursoCard key={curso.id} curso={curso} />
        ))}
      </div>
    </PgSection>
  )
}

function CursoCard({ curso }: { curso: CursoMock }) {
  const { area } = curso
  return (
    <article
      className="group hover:-translate-y-1 flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-all duration-base ease-out"
      style={{ boxShadow: "var(--shadow-card-resting)" }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `var(--shadow-glow-area-${area}), var(--shadow-card-elevated)`
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "var(--shadow-card-resting)"
      }}
    >
      <div
        className="relative h-28 overflow-hidden"
        style={{
          background: `linear-gradient(135deg, var(--color-area-${area}) 0%, rgb(var(--color-area-${area}-rgb) / 0.7) 60%, rgb(var(--color-area-${area}-rgb) / 0.4) 100%)`,
        }}
      >
        <div className="nx-grain absolute inset-0 opacity-30" />
        <span className="absolute top-3 right-3 inline-flex items-center rounded-pill bg-white/95 px-2.5 py-0.5 font-mono font-semibold text-[10px] text-text-primary uppercase tracking-wider">
          {area}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-[10px] text-text-tertiary uppercase tracking-wider">
            {curso.cliente}
          </span>
          <h3 className="text-h3 text-text-primary leading-tight">{curso.titulo}</h3>
        </div>
        <div className="flex items-center gap-4 text-caption text-text-secondary">
          <span className="inline-flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5" /> {curso.skills} skills
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> {curso.horas}h
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5" /> {curso.inscritos}
          </span>
        </div>
        <div className="mt-auto flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between">
            <span className="text-caption text-text-tertiary">Avance promedio</span>
            <span className="tabular font-mono font-semibold text-body-sm text-text-primary">
              {curso.avance}%
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-pill bg-subtle">
            <div
              className="h-full rounded-pill transition-all duration-slow ease-out"
              style={{
                width: `${curso.avance}%`,
                background: `linear-gradient(90deg, var(--color-area-${area}), rgb(var(--color-area-${area}-rgb) / 0.7))`,
              }}
            />
          </div>
        </div>
      </div>
    </article>
  )
}
