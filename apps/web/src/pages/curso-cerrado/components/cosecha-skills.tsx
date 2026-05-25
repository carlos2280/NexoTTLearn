import { slugArea } from "@/shared/lib/slug-area"
import type { SkillCosechadaCierre } from "@nexott-learn/shared-types"
import { motion, useReducedMotion } from "framer-motion"
import { Check } from "lucide-react"

interface CosechaSkillsProps {
  readonly skills: readonly SkillCosechadaCierre[]
}

export function CosechaSkills({ skills }: CosechaSkillsProps) {
  const reducedMotion = useReducedMotion()
  const ease: [number, number, number, number] = [0.16, 1, 0.3, 1]

  if (skills.length === 0) {
    return null
  }

  return (
    <motion.section
      initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.0, duration: 0.7, ease }}
      className="flex flex-col items-center gap-5 text-center"
      aria-labelledby="cosecha-titulo"
    >
      <p id="cosecha-titulo" className="text-body text-text-secondary">
        Has aportado capacidad nueva a tu ficha:
      </p>

      <ul className="flex flex-col items-start gap-2.5">
        {skills.map((skill, i) => (
          <motion.li
            key={skill.skillId}
            initial={reducedMotion ? { opacity: 1 } : { opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.15 + i * 0.08, duration: 0.5, ease }}
            className="flex items-center gap-3"
          >
            <Check
              className="h-4 w-4 shrink-0"
              strokeWidth={2.5}
              aria-hidden={true}
              style={{ color: `var(--color-area-${slugArea(skill.areaNombre)})` }}
            />
            <span className="font-medium text-body text-text-primary">{skill.skillNombre}</span>
            <span className="text-caption text-text-tertiary">{skill.areaNombre}</span>
          </motion.li>
        ))}
      </ul>
    </motion.section>
  )
}
