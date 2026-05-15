import { cn } from "@/shared/lib/cn"
import type { SlugArea } from "@/shared/lib/slug-area"

interface SkillChipProps {
  readonly etiqueta: string
  readonly area: SlugArea
  readonly size?: "sm" | "md"
  readonly className?: string
}

/**
 * SkillChip — el idioma común del sistema para mostrar skills.
 *
 * Formato `familia.detalle` en mono, con tinta del área a la que pertenece.
 * Familia opaca, detalle fuerte. Borde sutil del color del área.
 *
 * Si la etiqueta no tiene punto, se renderiza como un solo término fuerte.
 */
export function SkillChip({ etiqueta, area, size = "md", className }: SkillChipProps) {
  const partes = etiqueta.split(".")
  const familia = partes.length > 1 ? partes[0] : null
  const detalle = partes.length > 1 ? partes.slice(1).join(".") : etiqueta

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-pill border bg-surface font-mono",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]",
        className,
      )}
      style={{
        borderColor: `rgb(var(--color-area-${area}-rgb) / 0.3)`,
        color: `var(--color-area-${area}-on-soft)`,
      }}
    >
      {familia ? (
        <>
          <span className="opacity-60">{familia}.</span>
          <span className="font-semibold">{detalle}</span>
        </>
      ) : (
        <span className="font-semibold">{detalle}</span>
      )}
    </span>
  )
}
