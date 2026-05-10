import { useEffect, useRef } from "react"

export function useDebouncedSave<T>(value: T, save: (v: T) => void, delay = 800) {
  const initial = useRef(true)
  const saveRef = useRef(save)
  saveRef.current = save
  useEffect(() => {
    if (initial.current) {
      initial.current = false
      return
    }
    const id = setTimeout(() => saveRef.current(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
}
