import { cn } from "@/shared/lib/cn"
import { Root as LabelRoot } from "@radix-ui/react-label"
import type { ComponentPropsWithoutRef } from "react"
import { forwardRef } from "react"

type LabelProps = ComponentPropsWithoutRef<typeof LabelRoot>

export const Label = forwardRef<HTMLLabelElement, LabelProps>(function Label(props, ref) {
  const { className, ...rest } = props
  return (
    <LabelRoot
      ref={ref}
      className={cn(
        "font-medium text-[12px] text-[var(--color-text-secondary)] leading-4",
        className,
      )}
      {...rest}
    />
  )
})
