/**
 * Re-export desde `@/shared/components/ui/code-editor-nexott/prism-config`.
 * Mantengo este alias por estabilidad de imports existentes en el admin.
 */
// biome-ignore lint/performance/noBarrelFile: alias historico (ver doc arriba).
export {
  LENGUAJE_LABEL,
  highlightCodigo,
} from "@/shared/components/ui/code-editor-nexott/prism-config"
