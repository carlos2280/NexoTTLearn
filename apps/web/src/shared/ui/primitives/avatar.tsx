import { cn } from "@/shared/lib/cn"
// biome-ignore lint/style/noNamespaceImport: Radix Avatar expone Root/Image/Fallback; namespace import es idiomatico
import * as RadixAvatar from "@radix-ui/react-avatar"
import { type VariantProps, tv } from "tailwind-variants"

const avatar = tv({
  slots: {
    root: [
      "relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden",
      "rounded-full font-semibold tracking-tight uppercase",
    ],
    image: "size-full object-cover",
    fallback: [
      "flex size-full items-center justify-center",
      "bg-[linear-gradient(135deg,var(--brand-violet)_0%,var(--brand-cyan)_100%)]",
      "text-text-on-brand",
    ],
  },
  variants: {
    size: {
      xs: { root: "size-6 text-[10px]" },
      sm: { root: "size-8 text-xs" },
      md: { root: "size-10 text-sm" },
      lg: { root: "size-12 text-base" },
      xl: { root: "size-16 text-lg" },
    },
    ring: {
      true: {
        root: "ring-2 ring-brand-violet/40 ring-offset-2 ring-offset-surface-0",
      },
    },
  },
  defaultVariants: { size: "md" },
})

export interface AvatarProps extends VariantProps<typeof avatar> {
  readonly src?: string
  readonly alt?: string
  readonly initials?: string
  readonly className?: string
}

export function Avatar({ src, alt, initials, size, ring, className }: AvatarProps) {
  const styles = avatar({ size, ring })
  const fallbackText = (initials ?? "??").slice(0, 2)
  return (
    <RadixAvatar.Root className={cn(styles.root(), className)}>
      {src ? <RadixAvatar.Image src={src} alt={alt ?? ""} className={styles.image()} /> : null}
      <RadixAvatar.Fallback className={styles.fallback()} delayMs={src ? 300 : 0}>
        {fallbackText}
      </RadixAvatar.Fallback>
    </RadixAvatar.Root>
  )
}
