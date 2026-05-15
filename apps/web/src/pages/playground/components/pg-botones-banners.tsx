import { ArrowRight, Sparkles } from "lucide-react"
import type { ReactNode } from "react"
import { PgSection } from "./pg-section"

export function PgBotonesBanners() {
  return (
    <PgSection
      eyebrow="Componentes · Acción y feedback"
      titulo="Botones y banners"
      descripcion="Acción primaria en índigo. Aurora reservada al CTA cumbre. Banners semánticos sin mezclar con la marca."
    >
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <span className="nx-eyebrow text-text-tertiary">Variantes de botón</span>
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-surface p-6">
            <BtnAurora>
              <Sparkles className="h-4 w-4" />
              Publicar curso
            </BtnAurora>
            <BtnPrimary>
              Guardar
              <ArrowRight className="h-4 w-4" />
            </BtnPrimary>
            <BtnSecondary>Más tarde</BtnSecondary>
            <BtnGhost>Cancelar</BtnGhost>
            <BtnDanger>Archivar</BtnDanger>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <span className="nx-eyebrow text-text-tertiary">Banners semánticos</span>
          <div className="flex flex-col gap-3">
            <Banner tone="info" titulo="Próxima revisión">
              Tienes 3 entrevistas IA pendientes de revisión humana.
            </Banner>
            <Banner tone="success" titulo="Curso publicado">
              Los colaboradores asignados ya pueden empezar.
            </Banner>
            <Banner tone="warning" titulo="Deadline en 7 días">
              El curso "Backend" cierra el 21 de mayo. Revisa pendientes.
            </Banner>
            <Banner tone="danger" titulo="Módulo archivado deja skill huérfana">
              "Pandas básico" se archivó y 2 cursos activos quedan sin cubrir python.pandas.
            </Banner>
          </div>
        </div>
      </div>
    </PgSection>
  )
}

interface BtnProps {
  readonly children: ReactNode
}

function BtnAurora({ children }: BtnProps) {
  return (
    <button
      type="button"
      className="hover:-translate-y-0.5 inline-flex items-center gap-2 rounded-pill px-5 py-2.5 font-semibold text-body-sm text-white transition-all duration-base ease-out"
      style={{ background: "var(--gradient-aurora)", boxShadow: "var(--shadow-aurora-glow)" }}
    >
      {children}
    </button>
  )
}

function BtnPrimary({ children }: BtnProps) {
  return (
    <button
      type="button"
      className="hover:-translate-y-0.5 inline-flex items-center gap-2 rounded-pill bg-accent px-5 py-2.5 font-semibold text-body-sm text-white transition-all duration-base ease-out hover:bg-accent-hover"
      style={{ boxShadow: "var(--shadow-accent-glow)" }}
    >
      {children}
    </button>
  )
}

function BtnSecondary({ children }: BtnProps) {
  return (
    <button
      type="button"
      className="hover:-translate-y-0.5 inline-flex items-center gap-2 rounded-pill border border-border-strong bg-surface px-5 py-2.5 font-semibold text-body-sm text-text-primary transition-all duration-base ease-out hover:border-border-emphasis"
    >
      {children}
    </button>
  )
}

function BtnGhost({ children }: BtnProps) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-2 rounded-pill px-5 py-2.5 font-semibold text-body-sm text-text-secondary transition-colors duration-base hover:bg-subtle hover:text-text-primary"
    >
      {children}
    </button>
  )
}

function BtnDanger({ children }: BtnProps) {
  return (
    <button
      type="button"
      className="hover:-translate-y-0.5 inline-flex items-center gap-2 rounded-pill bg-danger px-5 py-2.5 font-semibold text-body-sm text-white transition-all duration-base ease-out"
    >
      {children}
    </button>
  )
}

interface BannerProps {
  readonly tone: "info" | "success" | "warning" | "danger"
  readonly titulo: string
  readonly children: ReactNode
}

function Banner({ tone, titulo, children }: BannerProps) {
  const map = {
    info: {
      bg: "var(--color-info-soft)",
      border: "var(--color-info)",
      text: "var(--color-info-on-soft)",
    },
    success: {
      bg: "var(--color-success-soft)",
      border: "var(--color-success)",
      text: "var(--color-success-on-soft)",
    },
    warning: {
      bg: "var(--color-warning-soft)",
      border: "var(--color-warning)",
      text: "var(--color-warning-on-soft)",
    },
    danger: {
      bg: "var(--color-danger-soft)",
      border: "var(--color-danger)",
      text: "var(--color-danger-on-soft)",
    },
  }[tone]
  return (
    <div
      className="flex gap-3 rounded-xl border-l-4 px-4 py-3"
      style={{ background: map.bg, borderLeftColor: map.border, color: map.text }}
    >
      <div className="flex flex-col gap-0.5">
        <span className="font-semibold text-body-sm">{titulo}</span>
        <span className="text-caption opacity-90">{children}</span>
      </div>
    </div>
  )
}
