import { Select, SelectItem } from "@/shared/components/ui/select"

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

interface SelectLenguajeProps {
  readonly value: string
  readonly onChange: (value: string) => void
  readonly id?: string
}

export function SelectLenguaje({ value, onChange, id }: SelectLenguajeProps) {
  return (
    <Select id={id} value={value} onValueChange={onChange}>
      {LENGUAJES_CODIGO.map((l) => (
        <SelectItem key={l.id} value={l.id}>
          {l.etiqueta}
        </SelectItem>
      ))}
    </Select>
  )
}
