import { cn } from "@/shared/lib/cn"
import { useTheme } from "@/shared/lib/theme"
import { Moon, Sun } from "lucide-react"

interface ThemeToggleProps {
  readonly className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggle } = useTheme()
  const isDark = theme === "dark"

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Activar modo claro" : "Activar modo oscuro"}
      title={isDark ? "Modo claro" : "Modo oscuro"}
      className={cn(
        "relative inline-flex size-9 items-center justify-center",
        "rounded-[var(--radius-md)] border border-glass-border bg-glass-1",
        "text-text-secondary transition-all duration-200",
        "ease-[cubic-bezier(0.2,0.8,0.2,1)]",
        "hover:border-glass-border-strong hover:bg-glass-2 hover:text-text-primary",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-violet",
        "focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0",
        className,
      )}
    >
      <Sun
        aria-hidden="true"
        className={cn(
          "absolute size-4 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
          isDark ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100",
        )}
      />
      <Moon
        aria-hidden="true"
        className={cn(
          "absolute size-4 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
          isDark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0",
        )}
      />
    </button>
  )
}
