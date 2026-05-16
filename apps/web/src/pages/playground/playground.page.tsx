import { Link } from "react-router-dom"
import { PgAreasEstados } from "./components/pg-areas-estados"
import { PgBotonesBanners } from "./components/pg-botones-banners"
import { PgCardsCurso } from "./components/pg-cards-curso"
import { PgCodeBlock } from "./components/pg-code-block"
import { PgKpis } from "./components/pg-kpis"
import { PgManifiesto } from "./components/pg-manifiesto"
import { PgPaletas } from "./components/pg-paletas"
import { PgSkillChips } from "./components/pg-skill-chips"
import { PgTipografia } from "./components/pg-tipografia"

export function PlaygroundPage() {
  return (
    <main className="min-h-full bg-canvas">
      <PlaygroundHero />
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-20 px-6 py-16 sm:px-10">
        <PgManifiesto />
        <PgPaletas />
        <PgTipografia />
        <PgAreasEstados />
        <PgCardsCurso />
        <PgKpis />
        <PgSkillChips />
        <PgCodeBlock />
        <PgBotonesBanners />
        <PgFooter />
      </div>
    </main>
  )
}

function PlaygroundHero() {
  return (
    <header
      className="relative overflow-hidden border-border border-b"
      style={{ background: "var(--color-canvas)" }}
    >
      <div
        aria-hidden={true}
        className="pointer-events-none absolute inset-0"
        style={{ background: "var(--gradient-admin-canvas)" }}
      />
      <div className="relative mx-auto flex w-full max-w-[1280px] flex-col gap-6 px-6 py-20 sm:px-10">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="font-mono text-caption text-text-tertiary hover:text-text-primary"
          >
            ← volver
          </Link>
          <span className="font-mono text-caption text-text-tertiary">/playground · dev only</span>
        </div>
        <div className="flex flex-col gap-3">
          <span className="nx-eyebrow text-aurora-violet">Sistema visual · v2</span>
          <h1 className="max-w-3xl text-display-lg text-text-primary leading-none">
            Los primitivos de NexoTT Learn
            <span className="text-aurora-violet">.</span>
          </h1>
          <p className="max-w-2xl text-body-lg text-text-secondary">
            Stripe en el rigor sistémico. Apple en la calma y el espacio. Linear en el motion que
            responde. Esta es la fundación visual sobre la que se construye toda la plataforma.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          {[
            "Manifiesto",
            "Paletas",
            "Tipografía",
            "Áreas",
            "Estados",
            "Cards de curso",
            "KPI",
            "Skills",
            "Code",
            "Botones",
          ].map((tag) => (
            <span
              key={tag}
              className="rounded-pill border border-border-strong bg-surface px-3 py-1 font-mono text-caption text-text-secondary"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </header>
  )
}

function PgFooter() {
  return (
    <footer className="flex flex-col gap-2 border-border border-t pt-8 pb-4 text-center">
      <span className="font-mono text-caption text-text-tertiary">
        NexoTT Learn — sistema visual v2
      </span>
      <span className="text-caption text-text-tertiary">
        Si algo de aquí no te encaja, lo cambiamos antes de tocar el resto de la app.
      </span>
    </footer>
  )
}
