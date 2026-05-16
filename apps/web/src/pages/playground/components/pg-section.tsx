import type { ReactNode } from "react"

interface PgSectionProps {
  readonly eyebrow: string
  readonly titulo: string
  readonly descripcion?: string
  readonly children: ReactNode
}

export function PgSection({ eyebrow, titulo, descripcion, children }: PgSectionProps) {
  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-1.5">
        <span className="nx-eyebrow text-aurora-violet">{eyebrow}</span>
        <h2 className="text-h1 text-text-primary">
          {titulo}
          <span className="text-aurora-violet">.</span>
        </h2>
        {descripcion ? (
          <p className="max-w-2xl text-body-sm text-text-secondary">{descripcion}</p>
        ) : null}
      </header>
      <div>{children}</div>
    </section>
  )
}

interface PgSwatchProps {
  readonly token: string
  readonly label: string
  readonly hex?: string
  readonly textoSobre?: "claro" | "oscuro"
}

export function PgSwatch({ token, label, hex, textoSobre = "oscuro" }: PgSwatchProps) {
  const colorTexto = textoSobre === "claro" ? "text-white" : "text-text-primary"
  return (
    <div className="flex flex-col gap-1.5">
      <div
        className={`flex h-20 items-end rounded-xl border border-border-strong/40 p-3 ${colorTexto}`}
        style={{ background: `var(--color-${token})` }}
      >
        <span className="font-mono text-[10px] opacity-70">{hex ?? `--color-${token}`}</span>
      </div>
      <div className="flex flex-col gap-0.5 px-1">
        <span className="font-medium text-caption text-text-primary">{label}</span>
        <span className="font-mono text-[10px] text-text-tertiary">{token}</span>
      </div>
    </div>
  )
}
