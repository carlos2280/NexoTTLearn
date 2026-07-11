import { Select, SelectItem } from "@/shared/components/ui/select"
import { lenguajeEjecutableSchema } from "@nexott-learn/shared-types"

export const LENGUAJES_CODIGO = [
  { id: "typescript", etiqueta: "TypeScript" },
  { id: "javascript", etiqueta: "JavaScript" },
  { id: "python", etiqueta: "Python" },
  { id: "java", etiqueta: "Java" },
  { id: "csharp", etiqueta: "C#" },
  { id: "cpp", etiqueta: "C++" },
  { id: "go", etiqueta: "Go" },
  { id: "rust", etiqueta: "Rust" },
  { id: "sql", etiqueta: "SQL" },
  { id: "bash", etiqueta: "Bash" },
  { id: "json", etiqueta: "JSON" },
  { id: "yaml", etiqueta: "YAML" },
  { id: "html", etiqueta: "HTML" },
  { id: "css", etiqueta: "CSS" },
  { id: "markdown", etiqueta: "Markdown" },
  { id: "otro", etiqueta: "Otro" },
] as const

export type LenguajeCodigo = (typeof LENGUAJES_CODIGO)[number]["id"]

interface OpcionLenguaje {
  readonly id: string
  readonly etiqueta: string
}

/**
 * Lenguajes que el runner del navegador (`features/codigo-ejecucion`) puede
 * ejecutar de verdad. Derivada de la fuente de verdad `lenguajeEjecutableSchema`
 * (shared-types) para no divergir del backend/worker. Se usa en el Reto de
 * código (CODIGO_PREGUNTAS), que sí se ejecuta. El snippet ilustrativo ofrece
 * la lista completa porque solo resalta, no ejecuta.
 */
export const LENGUAJES_EJECUTABLES: readonly OpcionLenguaje[] = LENGUAJES_CODIGO.filter(
  (l) => lenguajeEjecutableSchema.safeParse(l.id).success,
)

interface SelectLenguajeProps {
  readonly value: string
  readonly onChange: (value: string) => void
  readonly id?: string
  /**
   * Lista de lenguajes a ofrecer. Por defecto, todos. Pasa
   * `LENGUAJES_EJECUTABLES` para restringir a los que el runner ejecuta.
   */
  readonly lenguajes?: readonly OpcionLenguaje[]
}

export function SelectLenguaje({
  value,
  onChange,
  id,
  lenguajes = LENGUAJES_CODIGO,
}: SelectLenguajeProps) {
  // Guard: si el valor guardado (p. ej. un reto viejo importado con un lenguaje
  // ya no ofrecido) no está en la lista, lo agregamos para no dejar el select
  // vacío ni perder el valor al primer render.
  const opciones = asegurarValorPresente(lenguajes, value)

  return (
    <Select id={id} value={value} onValueChange={onChange}>
      {opciones.map((l) => (
        <SelectItem key={l.id} value={l.id}>
          {l.etiqueta}
        </SelectItem>
      ))}
    </Select>
  )
}

function asegurarValorPresente(
  lenguajes: readonly OpcionLenguaje[],
  value: string,
): readonly OpcionLenguaje[] {
  if (!value || lenguajes.some((l) => l.id === value)) {
    return lenguajes
  }
  const conocido = LENGUAJES_CODIGO.find((l) => l.id === value)
  return [...lenguajes, conocido ?? { id: value, etiqueta: value }]
}
