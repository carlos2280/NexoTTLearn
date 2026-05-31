const FONT_SIZE_NAMES = [
  "eyebrow",
  "caption",
  "body-sm",
  "body",
  "body-lg",
  "input",
  "h1",
  "h2",
  "h3",
  "display-md",
  "display-lg",
  "display-xl",
  "quote",
  "mfa",
] as const

const TEXT_COLOR_NAMES = [
  "on-color",
  "text-primary",
  "text-secondary",
  "text-tertiary",
  "text-disabled",
  "accent",
  "accent-hover",
  "accent-pressed",
  "accent-on-soft",
  "aurora-cyan",
  "aurora-violet",
  "aurora-magenta",
  "aurora-emerald",
  "warmth",
  "warmth-on-soft",
  "glow",
  "success",
  "success-on-soft",
  "warning",
  "warning-on-soft",
  "danger",
  "danger-on-soft",
  "info",
  "info-on-soft",
] as const

export const twMergeConfig = {
  extend: {
    classGroups: {
      "font-size": [{ text: [...FONT_SIZE_NAMES] }],
      "text-color": [{ text: [...TEXT_COLOR_NAMES] }],
    },
  },
} as const
