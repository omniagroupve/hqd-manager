import { useEffect, useRef, useState } from 'react'

interface Props {
  value: number
  prefix?: string
  suffix?: string
  decimals?: number
  className?: string
}

export default function AnimatedNumber({ value, prefix = '', suffix = '', decimals = 2, className = '' }: Props) {
  const [display, setDisplay] = useState(value)
  const ref = useRef<number>(value)
  const frame = useRef<number>(0)

  useEffect(() => {
    const start = ref.current
    const end = value
    const duration = 600
    const startTime = performance.now()

    function tick(now: number) {
      const progress = Math.min((now - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = start + (end - start) * eased
      setDisplay(current)
      if (progress < 1) frame.current = requestAnimationFrame(tick)
      else ref.current = end
    }

    frame.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame.current)
  }, [value])

  return (
    <span className={className}>
      {prefix}{display.toLocaleString('es-VE', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}
    </span>
  )
}
