import { cn } from "@/shared/lib/cn"
import { Badge } from "@/shared/ui/patterns/badge"
import type { CursoListItem } from "@nexott-learn/shared-types"
import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table"
import { ArrowUpRight } from "lucide-react"
import { useMemo } from "react"
import { ESTADO_META, formatDeadline } from "../lib/format"
import { CursoRowMenu } from "./curso-row-menu"

interface CoursesTableProps {
  readonly items: readonly CursoListItem[]
  readonly onOpen: (curso: CursoListItem) => void
  readonly onEdit: (curso: CursoListItem) => void
  readonly onDuplicate: (curso: CursoListItem) => void
  readonly onSeguimiento: (curso: CursoListItem) => void
  readonly onCandidatos: (curso: CursoListItem) => void
  readonly onUnpublish: (curso: CursoListItem) => void
  readonly onClose: (curso: CursoListItem) => void
  readonly onDelete: (curso: CursoListItem) => void
}

export function CursosTabla({
  items,
  onOpen,
  onEdit,
  onDuplicate,
  onSeguimiento,
  onCandidatos,
  onUnpublish,
  onClose,
  onDelete,
}: CoursesTableProps) {
  const columns = useMemo<ColumnDef<CursoListItem>[]>(
    () => [
      {
        accessorKey: "empresaCliente",
        header: "Cliente",
        cell: ({ row }) => (
          <span className="font-medium text-text-primary">{row.original.empresaCliente}</span>
        ),
      },
      {
        accessorKey: "titulo",
        header: "Curso",
        cell: ({ row }) => <span className="text-text-secondary">{row.original.titulo}</span>,
      },
      {
        accessorKey: "estado",
        header: "Estado",
        cell: ({ row }) => {
          const meta = ESTADO_META[row.original.estado]
          return (
            <Badge tone={meta.tone} size="sm" dot={true}>
              {meta.label}
            </Badge>
          )
        },
      },
      {
        id: "participantes",
        header: () => <span className="text-right">Partic.</span>,
        cell: ({ row }) => (
          <span className="block text-right tabular-nums">
            {row.original.contadores.inscripcionesActivas}
          </span>
        ),
      },
      {
        id: "areas",
        header: () => <span className="text-right">Áreas</span>,
        cell: ({ row }) => (
          <span className="block text-right text-text-muted tabular-nums">
            {row.original.contadores.areas}
          </span>
        ),
      },
      {
        accessorKey: "deadline",
        header: "Deadline",
        cell: ({ row }) => {
          const d = formatDeadline(row.original.deadline)
          return (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 text-sm",
                d.tone === "danger" && "text-danger",
                d.tone === "warning" && "text-warning",
                d.tone === "neutral" && "text-text-muted",
              )}
            >
              {d.label}
            </span>
          )
        },
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Acciones</span>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              aria-label={`Abrir ${row.original.titulo}`}
              onClick={(e) => {
                e.stopPropagation()
                onOpen(row.original)
              }}
              className="flex size-8 items-center justify-center rounded-[var(--radius-sm)] text-text-muted transition-colors hover:bg-glass-2 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-violet"
            >
              <ArrowUpRight className="size-4" strokeWidth={1.75} />
            </button>
            <CursoRowMenu
              curso={row.original}
              onEdit={onEdit}
              onDuplicate={onDuplicate}
              onSeguimiento={onSeguimiento}
              onCandidatos={onCandidatos}
              onUnpublish={onUnpublish}
              onClose={onClose}
              onDelete={onDelete}
            />
          </div>
        ),
      },
    ],
    [onOpen, onEdit, onDuplicate, onSeguimiento, onCandidatos, onUnpublish, onClose, onDelete],
  )

  const table = useReactTable({
    data: items as CursoListItem[],
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-glass-border bg-glass-1">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-[var(--z-sticky)] bg-surface-1/95 backdrop-blur">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-glass-border border-b">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left font-semibold text-[11px] text-text-muted uppercase tracking-wider"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="border-glass-border border-b transition-colors last:border-b-0 hover:bg-glass-2"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 align-middle">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function CursosTablaSkeleton({ rows = 6 }: { readonly rows?: number }) {
  return (
    <div
      aria-busy={true}
      aria-live="polite"
      className="overflow-hidden rounded-[var(--radius-lg)] border border-glass-border bg-glass-1"
    >
      {Array.from({ length: rows }).map((_, index) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders
          key={index}
          className="flex items-center gap-4 border-glass-border border-b px-4 py-4 last:border-b-0"
        >
          <div className="h-3 w-32 rounded bg-glass-2" />
          <div className="h-3 flex-1 rounded bg-glass-2" />
          <div className="h-5 w-20 rounded-full bg-glass-2" />
          <div className="h-3 w-12 rounded bg-glass-2" />
          <div className="h-3 w-20 rounded bg-glass-2" />
          <div className="size-8 rounded bg-glass-2" />
        </div>
      ))}
    </div>
  )
}
