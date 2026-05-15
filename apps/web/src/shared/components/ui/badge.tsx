import type { HTMLAttributes } from "react"
import { type VariantProps, tv } from "tailwind-variants"

/**
 * Badge — etiqueta de estado o categoría.
 *
 * Identidad NexoTT:
 * - `variant="tinta"` (default) — sin pill, sin fondo, sin dot. Texto en color
 *   del tono con línea inferior 2px. Editorial, calma. Es el primitivo.
 * - `variant="soft"` — pill con fondo soft + texto on-soft. Cuando necesitas
 *   un chip claramente delimitado (filtros densos, contadores inline en un
 *   texto largo, items seguidos en un log).
 *
 * El `tono="contorno"` mantiene su pill outline (otra semántica: tag/etiqueta).
 */
const badgeStyles = tv({
  base: ["inline-flex items-center gap-1.5 whitespace-nowrap", "text-caption font-medium"],
  variants: {
    variant: {
      soft: "rounded-pill px-2.5 py-0.5",
      tinta: "border-b-2 pb-0.5",
    },
    tono: {
      neutro: "",
      acento: "",
      success: "",
      warning: "",
      danger: "",
      info: "",
      contorno:
        "rounded-pill border border-border-strong bg-transparent px-2.5 py-0.5 text-text-secondary",
    },
  },
  compoundVariants: [
    { variant: "soft", tono: "neutro", class: "bg-subtle text-text-secondary" },
    { variant: "soft", tono: "acento", class: "bg-accent-soft text-accent-on-soft" },
    { variant: "soft", tono: "success", class: "bg-success-soft text-success-on-soft" },
    { variant: "soft", tono: "warning", class: "bg-warning-soft text-warning-on-soft" },
    { variant: "soft", tono: "danger", class: "bg-danger-soft text-danger-on-soft" },
    { variant: "soft", tono: "info", class: "bg-info-soft text-info-on-soft" },

    { variant: "tinta", tono: "neutro", class: "border-text-tertiary text-text-secondary" },
    { variant: "tinta", tono: "acento", class: "border-accent text-accent-on-soft" },
    { variant: "tinta", tono: "success", class: "border-success text-success-on-soft" },
    { variant: "tinta", tono: "warning", class: "border-warning text-warning-on-soft" },
    { variant: "tinta", tono: "danger", class: "border-danger text-danger-on-soft" },
    { variant: "tinta", tono: "info", class: "border-info text-info-on-soft" },
  ],
  defaultVariants: {
    variant: "tinta",
    tono: "neutro",
  },
})

const dotStyles = tv({
  base: "inline-block h-1.5 w-1.5 shrink-0 rounded-pill",
  variants: {
    tono: {
      neutro: "bg-text-tertiary",
      acento: "bg-accent",
      success: "bg-success",
      warning: "bg-warning",
      danger: "bg-danger",
      info: "bg-info",
      contorno: "bg-text-tertiary",
    },
  },
  defaultVariants: { tono: "neutro" },
})

interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeStyles> {
  readonly conPunto?: boolean
}

export function Badge(props: BadgeProps) {
  const { variant, tono, conPunto, className, children, ...rest } = props
  const mostrarPunto = conPunto && variant !== "tinta"
  return (
    <span className={badgeStyles({ variant, tono, className })} {...rest}>
      {mostrarPunto ? <span className={dotStyles({ tono })} aria-hidden={true} /> : null}
      {children}
    </span>
  )
}
