import { PgSection } from "./pg-section"

interface Ley {
  readonly numero: string
  readonly titulo: string
  readonly cuerpo: string
}

const LEYES: readonly Ley[] = [
  {
    numero: "01",
    titulo: "Lo difícil no se nota",
    cuerpo:
      "Si el usuario lo nota como decoración, sobra. Si lo siente sin nombrarlo, está bien hecho.",
  },
  {
    numero: "02",
    titulo: "Una jerarquía por pantalla",
    cuerpo: "Una sola cosa manda. El resto respira a su alrededor. Si todo pesa igual, nada pesa.",
  },
  {
    numero: "03",
    titulo: "Aurora es recurso escaso",
    cuerpo:
      "Solo en 3–5 momentos cumbre de toda la app. Nunca de fondo, nunca en banners, nunca por adorno.",
  },
  {
    numero: "04",
    titulo: "Tres capas que no se cruzan",
    cuerpo: "Marca, acción y feedback tienen colores distintos. Cada capa hace su trabajo.",
  },
  {
    numero: "05",
    titulo: "Tokens, nunca hex",
    cuerpo: "La identidad se mantiene desde una fuente única. Hardcoded es deuda.",
  },
  {
    numero: "06",
    titulo: "Variantes, no forks",
    cuerpo:
      "Si necesitas algo distinto, añade variante al componente base. Nunca un fork con className.",
  },
  {
    numero: "07",
    titulo: "Cumplido se desvanece, pendiente respira",
    cuerpo: "La app no aplaude cada paso. Lo que falta llama la atención, lo hecho se difumina.",
  },
  {
    numero: "08",
    titulo: "Motion responde, no decora",
    cuerpo: "Cada animación es respuesta a una acción. Los loops decorativos están prohibidos.",
  },
  {
    numero: "09",
    titulo: "La marca vive en la suma",
    cuerpo: "Ningún componente individual grita NexoTT. Es la combinación lo que da identidad.",
  },
  {
    numero: "10",
    titulo: "Calidez profesional, sin emojis",
    cuerpo:
      'Hablamos en serio, con calidez sobria. "Curso completado" — no "¡Genial!". Es producto serio.',
  },
]

const TRES_CAPAS = [
  {
    capa: "Marca",
    rol: "Login, bienvenida, certificado",
    ejemplo: "Aurora: cyan, violet y magenta",
    color: "var(--color-aurora-violet)",
  },
  {
    capa: "Acción",
    rol: "CTA primario, focus, links",
    ejemplo: "Índigo profundo",
    color: "var(--color-accent)",
  },
  {
    capa: "Feedback",
    rol: "Errores, éxitos, advertencias",
    ejemplo: "Semánticos por significado",
    color: "var(--color-success)",
  },
]

export function PgManifiesto() {
  return (
    <div className="flex flex-col gap-16">
      <PgSection
        eyebrow="Manifiesto · Norte del producto"
        titulo="Menos es más"
        descripcion="Cada elemento cumple su función o es basura. Antes de añadir, pregunta: ¿soluciona un problema o decora?"
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {LEYES.map((ley) => (
            <LeyCard key={ley.numero} ley={ley} />
          ))}
        </div>
      </PgSection>

      <PgSection
        eyebrow="Sistema · Capas"
        titulo="Tres capas que no se cruzan"
        descripcion="Marca, acción y feedback viven en familias de color distintas. Cada una con su trabajo y su momento."
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {TRES_CAPAS.map((c) => (
            <CapaCard key={c.capa} capa={c} />
          ))}
        </div>
      </PgSection>

      <PgSection
        eyebrow="Antes de añadir cualquier cosa"
        titulo="Las 5 preguntas"
        descripcion="Si un cambio falla en una sola de estas preguntas, no entra al producto."
      >
        <ol className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-6">
          {[
            "¿Soluciona un problema?",
            "¿Existe ya un token, variante o patrón?",
            "¿Encaja en una de las 3 capas de color?",
            "¿Compite con algo más en la pantalla?",
            "¿Aporta o decora?",
          ].map((pregunta, idx) => (
            <li key={pregunta} className="flex items-start gap-4">
              <span className="tabular w-8 shrink-0 font-mono text-caption text-text-tertiary">
                0{idx + 1}
              </span>
              <span className="text-body text-text-primary">{pregunta}</span>
            </li>
          ))}
        </ol>
      </PgSection>
    </div>
  )
}

function LeyCard({ ley }: { ley: Ley }) {
  return (
    <article className="group hover:-translate-y-0.5 flex gap-4 rounded-2xl border border-border bg-surface p-5 transition-all duration-base ease-out hover:shadow-[var(--shadow-card-elevated)]">
      <span className="tabular shrink-0 font-mono text-caption text-text-tertiary">
        {ley.numero}
      </span>
      <div className="flex flex-col gap-1.5">
        <h3 className="font-semibold text-body text-text-primary">{ley.titulo}</h3>
        <p className="text-body-sm text-text-secondary">{ley.cuerpo}</p>
      </div>
    </article>
  )
}

interface CapaCardProps {
  readonly capa: {
    readonly capa: string
    readonly rol: string
    readonly ejemplo: string
    readonly color: string
  }
}

function CapaCard({ capa }: CapaCardProps) {
  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6">
      <div className="flex items-center gap-3">
        <span
          className="h-3 w-3 rounded-pill"
          style={{ background: capa.color }}
          aria-hidden={true}
        />
        <span className="text-h3 text-text-primary">{capa.capa}</span>
      </div>
      <div className="flex flex-col gap-1">
        <span className="nx-eyebrow text-text-tertiary">Cuándo aparece</span>
        <span className="text-body-sm text-text-secondary">{capa.rol}</span>
      </div>
      <div className="flex flex-col gap-1">
        <span className="nx-eyebrow text-text-tertiary">Ejemplo</span>
        <span className="font-mono text-caption text-text-primary">{capa.ejemplo}</span>
      </div>
    </article>
  )
}
