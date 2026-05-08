import { useEffect, useState } from "react"

interface UseScrolledOptions {
  readonly threshold?: number
}

export function useScrolled({ threshold = 16 }: UseScrolledOptions = {}): boolean {
  const [isScrolled, setIsScrolled] = useState(() => window.scrollY > threshold)

  useEffect(() => {
    const handle = (): void => {
      setIsScrolled(window.scrollY > threshold)
    }
    handle()
    window.addEventListener("scroll", handle, { passive: true })
    return () => window.removeEventListener("scroll", handle)
  }, [threshold])

  return isScrolled
}
