interface AdminSystemStatusProps {
  readonly colapsado: boolean
}

// Versión del build. TODO(versionado): inyectar desde package.json vía
// vite define en lugar de hardcodear. Por ahora, actualizar manualmente.
const VERSION = "v0.1.0"

/**
 * Microelemento decorativo del footer del sidebar.
 * Comunica "el sistema está vivo" sin gritar — dot cyan respirando + versión.
 *
 * Reemplaza al antiguo footer con avatar (redundante con el AdminUserMenu del
 * topbar). El espacio liberado del sidebar respira.
 */
export function AdminSystemStatus({ colapsado }: AdminSystemStatusProps) {
  if (colapsado) {
    return (
      <div className="flex justify-center px-2 py-4" aria-hidden={true}>
        <span className="nx-pulse-dot relative inline-block h-1.5 w-1.5 rounded-pill bg-aurora-cyan text-aurora-cyan" />
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 px-5 py-4 text-caption text-text-tertiary">
      <span
        aria-hidden={true}
        className="nx-pulse-dot relative inline-block h-1.5 w-1.5 shrink-0 rounded-pill bg-aurora-cyan text-aurora-cyan"
      />
      <span className="tabular font-mono">{VERSION}</span>
      <span aria-hidden={true} className="text-text-disabled">
        ·
      </span>
      <span>Sistema activo</span>
    </div>
  )
}
