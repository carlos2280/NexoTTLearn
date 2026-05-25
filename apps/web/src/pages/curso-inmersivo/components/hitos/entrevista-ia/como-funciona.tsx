interface ItemFuncionamiento {
  readonly clave: string
  readonly texto: string
}

/**
 * Texto fijo del sistema para explicar como funciona la entrevista IA al
 * participante (vista 1 — spec 06). NO se configura desde el admin: son las
 * 3 reglas estables de cualquier entrevista.
 */
const ITEMS: readonly ItemFuncionamiento[] = [
  { clave: "preguntas", texto: "Se generan preguntas segun lo que has visto en este curso." },
  { clave: "respuesta", texto: "Respondes a tu ritmo, escribiendo." },
  {
    clave: "cierre",
    texto: "La conversacion termina cuando el evaluador considera que ha terminado.",
  },
]

export function ComoFunciona() {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6">
      <h3 className="nx-eyebrow text-text-tertiary">Como funciona</h3>
      <ul className="flex flex-col gap-3">
        {ITEMS.map((item) => (
          <li key={item.clave} className="flex items-start gap-3">
            <span
              aria-hidden={true}
              className="mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-pill bg-aurora-violet"
            />
            <p className="text-body-sm text-text-secondary">{item.texto}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
