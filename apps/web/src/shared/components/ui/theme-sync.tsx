import { useTheme } from "@/shared/hooks/use-theme"

/**
 * ThemeSync — monta el hook useTheme aislado para que las re-renders
 * por cambio de tema (modo system reaccionando al SO, sync entre pestañas)
 * no afecten al árbol de App. Renderiza null.
 */
export function ThemeSync() {
  useTheme()
  return null
}
