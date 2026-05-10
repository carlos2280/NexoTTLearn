import { cn } from "@/shared/lib/cn"
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion"
import type { MouseEventHandler, PointerEvent, ReactNode } from "react"
import { useRef } from "react"

interface MagneticButtonProps {
  readonly type?: "button" | "submit" | "reset"
  readonly disabled?: boolean
  readonly isLoading?: boolean
  readonly fullWidth?: boolean
  readonly variant?: "primary" | "ghost"
  readonly className?: string
  readonly children?: ReactNode
  readonly onClick?: (event: PointerEvent<HTMLButtonElement>) => void
  readonly "aria-label"?: string
}

export function MagneticButton(props: MagneticButtonProps) {
  const {
    type = "button",
    disabled,
    isLoading,
    fullWidth,
    variant = "primary",
    className,
    children,
    onClick,
  } = props

  const reducedMotion = useReducedMotion()
  const localRef = useRef<HTMLButtonElement | null>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 220, damping: 16, mass: 0.4 })
  const sy = useSpring(y, { stiffness: 220, damping: 16, mass: 0.4 })

  function handleMove(event: PointerEvent<HTMLButtonElement>): void {
    if (reducedMotion || disabled || isLoading) {
      return
    }
    const el = localRef.current
    if (!el) {
      return
    }
    const rect = el.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    x.set((event.clientX - cx) * 0.18)
    y.set((event.clientY - cy) * 0.28)
  }

  function handleLeave(): void {
    x.set(0)
    y.set(0)
  }

  const base =
    "relative inline-flex items-center justify-center gap-2 select-none whitespace-nowrap font-medium rounded-full transition-[background-color,color] duration-[var(--duration-base)] ease-[var(--ease-default)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] disabled:opacity-50 disabled:cursor-not-allowed h-12 px-6 text-[14px]"
  const tone =
    variant === "primary"
      ? "bg-[var(--color-text-primary)] text-[var(--color-canvas)] hover:bg-[var(--color-accent)] shadow-[0_1px_0_rgba(255,255,255,0.18)_inset,0_8px_24px_rgba(79,70,229,0.16)]"
      : "bg-transparent text-[var(--color-text-primary)] hover:bg-[var(--color-subtle)]"

  return (
    <motion.button
      ref={(node) => {
        localRef.current = node
      }}
      type={type}
      style={{ x: sx, y: sy }}
      className={cn(base, tone, fullWidth && "w-full", className)}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      aria-label={props["aria-label"]}
      onClick={onClick as unknown as MouseEventHandler<HTMLButtonElement>}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      whileTap={reducedMotion ? undefined : { scale: 0.97 }}
    >
      {isLoading ? (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
          <path fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" opacity="0.85" />
        </svg>
      ) : null}
      {children}
    </motion.button>
  )
}
