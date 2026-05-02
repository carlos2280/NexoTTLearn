import { useEffect, useState } from "react"

interface CountdownState {
  readonly seconds: number
  readonly mmss: string
  readonly ended: boolean
}

export function useCountdown(initialSeconds: number): CountdownState {
  const [seconds, setSeconds] = useState(Math.max(0, Math.floor(initialSeconds)))

  useEffect(() => {
    setSeconds(Math.max(0, Math.floor(initialSeconds)))
  }, [initialSeconds])

  useEffect(() => {
    if (seconds <= 0) {
      return
    }
    const id = window.setInterval(() => {
      setSeconds((prev) => (prev <= 1 ? 0 : prev - 1))
    }, 1000)
    return () => window.clearInterval(id)
  }, [seconds])

  return {
    seconds,
    mmss: formatear(seconds),
    ended: seconds === 0,
  }
}

function formatear(total: number): string {
  const m = Math.floor(total / 60)
    .toString()
    .padStart(2, "0")
  const s = (total % 60).toString().padStart(2, "0")
  return `${m}:${s}`
}
