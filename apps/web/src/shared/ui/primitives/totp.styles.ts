import { tv } from "tailwind-variants"

export type TotpCellState = "default" | "error" | "filled"

export const totpCell = tv({
  base: [
    "size-12 sm:size-14 text-center font-mono font-semibold text-lg sm:text-xl tabular-nums",
    "bg-glass-1 text-text-primary",
    "border border-glass-border rounded-[var(--radius-md)]",
    "transition-all duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)]",
    "hover:border-glass-border-strong",
    "focus-visible:outline-none focus-visible:border-brand-violet focus-visible:bg-glass-2",
    "focus-visible:shadow-[0_0_0_4px_rgb(124_58_237/0.18)]",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    "caret-brand-violet",
  ],
  variants: {
    state: {
      default: "",
      error: [
        "border-danger/60 bg-[rgb(244_63_94/0.04)]",
        "focus-visible:border-danger focus-visible:shadow-[0_0_0_4px_rgb(244_63_94/0.2)]",
      ],
      filled: "border-brand-violet/40 bg-glass-2",
    },
  },
  defaultVariants: { state: "default" },
})
