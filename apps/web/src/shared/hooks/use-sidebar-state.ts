import { useEffect, useState } from "react"

const STORAGE_KEY = "nx-sidebar-collapsed"

export interface SidebarState {
  readonly collapsed: boolean
  readonly toggle: () => void
  readonly setCollapsed: (next: boolean) => void
}

function readInitial(): boolean {
  if (typeof window === "undefined") {
    return false
  }
  try {
    return localStorage.getItem(STORAGE_KEY) === "1"
  } catch {
    return false
  }
}

export function useSidebarState(): SidebarState {
  const [collapsed, setCollapsedState] = useState(readInitial)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0")
    } catch {
      // ignorar
    }
  }, [collapsed])

  return {
    collapsed,
    setCollapsed: setCollapsedState,
    toggle: () => setCollapsedState((c) => !c),
  }
}
