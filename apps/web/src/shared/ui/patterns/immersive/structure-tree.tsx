import { cn } from "@/shared/lib/cn"
import { ChevronRight } from "lucide-react"
import { useState } from "react"
import type { ImmersiveMode, TreeNode } from "./types"

interface StructureTreeProps {
  readonly nodes: readonly TreeNode[]
  readonly selectedId: string | null
  readonly onSelect: (id: string) => void
  readonly mode?: ImmersiveMode
  /** Conjunto de ids inicialmente expandidos. Default: todos los del primer nivel. */
  readonly defaultExpanded?: ReadonlySet<string>
}

/**
 * Árbol jerárquico genérico. No conoce el dominio (cursos, módulos, etc).
 * Se le pasan nodos con label/icon/meta/children y dispara onSelect.
 *
 * Diseñado para reuso entre admin (modo edit con [+ Acción] al final de la
 * fila) y participante (modo read sin acciones).
 */
export function StructureTree({
  nodes,
  selectedId,
  onSelect,
  mode = "edit",
  defaultExpanded,
}: StructureTreeProps) {
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    if (defaultExpanded) {
      return new Set(defaultExpanded)
    }
    return new Set(nodes.map((n) => n.id))
  })

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })

  return (
    <div className="flex flex-col gap-0.5 px-2 py-2">
      {nodes.map((node) => (
        <TreeRow
          key={node.id}
          node={node}
          depth={0}
          selectedId={selectedId}
          expanded={expanded}
          onSelect={onSelect}
          onToggle={toggle}
          mode={mode}
        />
      ))}
    </div>
  )
}

interface TreeRowProps {
  readonly node: TreeNode
  readonly depth: number
  readonly selectedId: string | null
  readonly expanded: ReadonlySet<string>
  readonly onSelect: (id: string) => void
  readonly onToggle: (id: string) => void
  readonly mode: ImmersiveMode
}

function TreeRow({ node, depth, selectedId, expanded, onSelect, onToggle, mode }: TreeRowProps) {
  const isSelected = selectedId === node.id
  const hasChildren = Boolean(node.children && node.children.length > 0)
  const isExpanded = expanded.has(node.id)

  return (
    <div className="flex flex-col">
      <TreeRowHeader
        node={node}
        depth={depth}
        isSelected={isSelected}
        isExpanded={isExpanded}
        hasChildren={hasChildren}
        onSelect={onSelect}
        onToggle={onToggle}
        mode={mode}
      />

      {hasChildren && isExpanded ? (
        <div>
          {node.children?.map((child) => (
            <TreeRow
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              expanded={expanded}
              onSelect={onSelect}
              onToggle={onToggle}
              mode={mode}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

interface TreeRowHeaderProps {
  readonly node: TreeNode
  readonly depth: number
  readonly isSelected: boolean
  readonly isExpanded: boolean
  readonly hasChildren: boolean
  readonly onSelect: (id: string) => void
  readonly onToggle: (id: string) => void
  readonly mode: ImmersiveMode
}

function TreeRowHeader({
  node,
  depth,
  isSelected,
  isExpanded,
  hasChildren,
  onSelect,
  onToggle,
  mode,
}: TreeRowHeaderProps) {
  return (
    <div
      className={cn(
        "group flex items-center gap-1.5 rounded-[var(--radius-sm)] py-1.5 pr-1.5 text-sm",
        "transition-colors duration-150",
        isSelected
          ? "bg-[var(--gradient-brand-soft)] text-text-primary"
          : "text-text-secondary hover:bg-glass-2 hover:text-text-primary",
      )}
      style={{ paddingLeft: `${depth * 12 + 6}px` }}
    >
      <button
        type="button"
        aria-label={isExpanded ? "Colapsar" : "Expandir"}
        aria-expanded={isExpanded}
        onClick={(e) => {
          e.stopPropagation()
          if (hasChildren) {
            onToggle(node.id)
          }
        }}
        className={cn(
          "flex size-4 shrink-0 items-center justify-center rounded text-text-muted",
          "transition-transform duration-200",
          !hasChildren && "invisible",
          isExpanded && "rotate-90",
        )}
      >
        <ChevronRight className="size-3.5" strokeWidth={2} />
      </button>

      <button
        type="button"
        onClick={() => onSelect(node.id)}
        className="flex min-w-0 flex-1 items-center gap-2 text-left"
      >
        {node.icon ? (
          <span
            className={cn("shrink-0", isSelected ? "text-brand-violet-soft" : "text-text-muted")}
            style={node.accent ? { color: node.accent } : undefined}
            aria-hidden="true"
          >
            {node.icon}
          </span>
        ) : null}

        <span className={cn("truncate font-medium", isSelected && "text-text-primary")}>
          {node.label}
        </span>

        {node.meta ? (
          <span className="ml-auto shrink-0 text-[11px] text-text-muted">{node.meta}</span>
        ) : null}

        {node.badge}
      </button>

      {mode === "edit" && node.action ? (
        <span className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
          {node.action}
        </span>
      ) : null}
    </div>
  )
}
