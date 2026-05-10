import { cn } from "@/shared/lib/cn"
import { ThemeToggle } from "@/shared/ui/primitives/theme-toggle"
import { motion } from "framer-motion"
import { Sparkles } from "lucide-react"
import type { ReactNode } from "react"

interface AuthShellProps {
  readonly appMark?: string
  readonly appName?: string
  readonly appSub?: string
  readonly heroEyebrow?: string
  readonly heroTitle: string
  readonly heroSubtitle?: string
  readonly manifesto?: string
  readonly version?: string
  readonly children: ReactNode
}

const transitionFade = { duration: 0.6, ease: [0.2, 0.8, 0.2, 1] as const }

export function AuthShell({
  appMark = "Nx",
  appName = "NexoTT",
  appSub = "Learn",
  heroEyebrow = "Plataforma de capacitacion",
  heroTitle,
  heroSubtitle,
  manifesto,
  version,
  children,
}: AuthShellProps) {
  return (
    <div className="relative min-h-dvh w-full overflow-hidden bg-surface-0 text-text-primary">
      <BackgroundFx />

      {/* Theme toggle anclado top-right (sobre todo el shell) */}
      <div className="absolute top-5 right-5 z-20">
        <ThemeToggle />
      </div>

      <div className="relative z-10 grid min-h-dvh grid-cols-1 lg:grid-cols-[1.05fr_1fr]">
        {/* ── Hero (visible solo en lg+) ───────────────────────── */}
        <aside className="relative hidden lg:flex">
          <div className="relative z-10 flex w-full flex-col justify-between p-12 xl:p-16">
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={transitionFade}
              className="flex items-center gap-3"
            >
              <BrandMark mark={appMark} />
              <div className="flex flex-col leading-tight">
                <span className="font-semibold text-sm tracking-tight">{appName}</span>
                <span className="text-text-muted text-xs">{appSub}</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...transitionFade, delay: 0.1 }}
              className="flex max-w-xl flex-col gap-6"
            >
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-glass-border bg-glass-1 px-3 py-1 font-medium text-text-secondary text-xs backdrop-blur">
                <Sparkles className="size-3.5 text-brand-cyan" aria-hidden="true" />
                {heroEyebrow}
              </span>
              <h1 className="pb-1 font-bold font-display text-5xl leading-[1.15] tracking-tight xl:text-6xl">
                <HeroTitle text={heroTitle} />
              </h1>
              {heroSubtitle ? (
                <p className="max-w-md text-base text-text-secondary leading-relaxed">
                  {heroSubtitle}
                </p>
              ) : null}
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ ...transitionFade, delay: 0.3 }}
              className="flex items-end justify-between gap-4 text-text-muted text-xs"
            >
              {manifesto ? (
                <p className="max-w-xs text-text-secondary italic leading-relaxed">
                  &ldquo;{manifesto}&rdquo;
                </p>
              ) : (
                <span />
              )}
              {version ? (
                <span className="font-mono uppercase tracking-widest">{version}</span>
              ) : null}
            </motion.div>
          </div>
        </aside>

        {/* ── Form panel ───────────────────────────────────────── */}
        <main className="relative flex items-center justify-center px-5 py-10 sm:px-8 lg:p-12">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...transitionFade, delay: 0.15 }}
            className="w-full max-w-md"
          >
            {/* Brand mobile (visible solo bajo lg) */}
            <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">
              <BrandMark mark={appMark} compact={true} />
              <div className="flex flex-col leading-tight">
                <span className="font-semibold text-sm tracking-tight">{appName}</span>
                <span className="text-text-muted text-xs">{appSub}</span>
              </div>
            </div>

            <div className="relative rounded-[var(--radius-2xl)] border border-glass-border bg-glass-1 p-7 shadow-[0_28px_80px_-20px_rgb(0_0_0/0.7)] backdrop-blur-2xl sm:p-9">
              {/* Glow ring sutil sobre la card */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-[var(--radius-2xl)] bg-[linear-gradient(135deg,rgb(124_58_237/0.18),transparent_40%,rgb(34_211_238/0.14))] opacity-60 mix-blend-screen"
              />
              <div className="relative">{children}</div>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  )
}

/* ── Titulo del hero: ultima linea con gradiente ───────────── */
function HeroTitle({ text }: { readonly text: string }) {
  const lines = text.split("\n")
  const last = lines.length - 1
  return (
    <span className="block whitespace-pre-line">
      {lines.map((line, i) => (
        <span
          // biome-ignore lint/suspicious/noArrayIndexKey: heroTitle es estatico durante el lifetime del componente
          key={i}
          className={cn("block", i === last && "text-gradient-brand")}
        >
          {line}
        </span>
      ))}
    </span>
  )
}

/* ── Brand mark con anillo gradiente y breathing ───────────── */
function BrandMark({
  mark,
  compact = false,
}: { readonly mark: string; readonly compact?: boolean }) {
  return (
    <div
      className={cn(
        "relative grid place-items-center rounded-[var(--radius-md)]",
        "bg-[linear-gradient(135deg,var(--brand-violet)_0%,var(--brand-cyan)_100%)]",
        "shadow-[0_8px_24px_-4px_rgb(124_58_237/0.6)]",
        compact ? "size-9 text-sm" : "size-11 text-base",
      )}
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 animate-[breathing_4s_ease-in-out_infinite] rounded-[var(--radius-md)] bg-[linear-gradient(135deg,var(--brand-violet)_0%,var(--brand-cyan)_100%)] opacity-60 blur-md"
      />
      <span className="relative font-bold text-white tracking-tight">{mark}</span>
    </div>
  )
}

/* ── Fondo: grid sutil + 2 orbes glow drifting ─────────────── */
function BackgroundFx() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {/* scrim base (token --hero-scrim, varia por tema) */}
      <div className="absolute inset-0" style={{ backgroundImage: "var(--hero-scrim)" }} />
      {/* grid */}
      <div className="mask-radial-fade absolute inset-0 bg-grid-subtle opacity-60" />
      {/* orbe violet */}
      <div
        className="-left-32 absolute top-1/4 size-[480px] rounded-full opacity-70"
        style={{
          background: "radial-gradient(circle, rgb(124 58 237 / 0.55) 0%, transparent 65%)",
          filter: "blur(40px)",
          animation: "orb-drift 22s ease-in-out infinite",
        }}
      />
      {/* orbe cyan */}
      <div
        className="absolute top-1/2 right-[-10%] size-[420px] rounded-full opacity-50"
        style={{
          background: "radial-gradient(circle, rgb(34 211 238 / 0.45) 0%, transparent 65%)",
          filter: "blur(40px)",
          animation: "orb-drift 26s ease-in-out infinite reverse",
        }}
      />
      {/* viñeta inferior */}
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-[linear-gradient(to_top,var(--surface-0),transparent)]" />
    </div>
  )
}
