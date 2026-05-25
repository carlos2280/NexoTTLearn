import { cn } from "@/shared/lib/cn"
import { Search, X } from "lucide-react"
import { useEffect, useState } from "react"

interface SearchFieldProps {
  readonly valor: string
  readonly onCambio: (v: string) => void
  readonly placeholder?: string
  readonly retardoMs?: number
  readonly ariaLabel?: string
  readonly className?: string
}

export function SearchField({
  valor,
  onCambio,
  placeholder = "Buscar…",
  retardoMs = 300,
  ariaLabel = "Buscar",
  className,
}: SearchFieldProps) {
  const [interno, setInterno] = useState(valor)

  useEffect(() => {
    setInterno(valor)
  }, [valor])

  useEffect(() => {
    if (interno === valor) {
      return
    }
    const id = setTimeout(() => onCambio(interno), retardoMs)
    return () => clearTimeout(id)
  }, [interno, onCambio, retardoMs, valor])

  return (
    <div
      className={cn(
        "group/search inline-flex h-9 w-full max-w-sm items-center gap-2 rounded-lg",
        "border border-border-strong bg-surface px-3 shadow-xs",
        "transition-[border-color,box-shadow] duration-base ease-default",
        "hover:border-border-emphasis hover:shadow-sm",
        "focus-within:border-aurora-violet focus-within:shadow-ring-aurora-soft",
        className,
      )}
    >
      <Search
        className="h-4 w-4 shrink-0 text-text-tertiary transition-colors duration-base ease-default group-focus-within/search:text-aurora-violet"
        strokeWidth={1.5}
        aria-hidden={true}
      />
      <input
        type="search"
        aria-label={ariaLabel}
        placeholder={placeholder}
        value={interno}
        onChange={(e) => setInterno(e.target.value)}
        className="flex-1 bg-transparent text-body-sm text-text-primary outline-none placeholder:text-text-tertiary"
      />
      {interno.length > 0 ? (
        <button
          type="button"
          aria-label="Limpiar búsqueda"
          onClick={() => {
            setInterno("")
            onCambio("")
          }}
          className="inline-flex h-5 w-5 items-center justify-center rounded-pill text-text-tertiary transition-colors duration-fast ease-default hover:bg-subtle hover:text-text-secondary"
        >
          <X className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden={true} />
        </button>
      ) : null}
    </div>
  )
}
