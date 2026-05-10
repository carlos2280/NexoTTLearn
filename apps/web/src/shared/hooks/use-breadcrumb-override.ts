import type { BreadcrumbCrumb } from "@/shared/ui/patterns/app-topbar"
import { createContext, useContext, useEffect, useRef } from "react"

export const BreadcrumbOverrideContext = createContext<{
  set: (crumbs: readonly BreadcrumbCrumb[]) => void
  clear: () => void
} | null>(null)

/** Sobreescribe el breadcrumb del layout mientras el componente está montado. */
export function useBreadcrumbOverride(crumbs: readonly BreadcrumbCrumb[] | undefined) {
  const ctx = useContext(BreadcrumbOverrideContext)
  const crumbsRef = useRef(crumbs)
  crumbsRef.current = crumbs

  // biome-ignore lint/correctness/useExhaustiveDependencies: JSON.stringify estabiliza array de crumbs; ctx es estable por contexto
  useEffect(() => {
    if (!(ctx && crumbs)) {
      return
    }
    ctx.set(crumbs)
    return () => {
      ctx.clear()
    }
  }, [JSON.stringify(crumbs)])
}
