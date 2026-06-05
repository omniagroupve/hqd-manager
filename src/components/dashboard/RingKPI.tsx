import { useEffect, useRef } from 'react'

interface Props {
  label: string
  value: number
  pct: number
  color: string
  prefix?: string
  suffix?: string
  warning?: string
}

const R = 36
const CIRC = 2 * Math.PI * R

export default function RingKPI({ label, value, pct, color, prefix = '', suffix = '', warning }: Props) {
  const circleRef = useRef<SVGCircleElement>(null)

  useEffect(() => {
    if (!circleRef.current) return
    const offset = CIRC * (1 - Math.min(pct, 1))
    circleRef.current.style.setProperty('--target-offset', String(offset))
    circleRef.current.style.strokeDashoffset = String(CIRC)
    // trigger reflow
    void circleRef.current.getBoundingClientRect()
    circleRef.current.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1) 0.3s'
    circleRef.current.style.strokeDashoffset = String(offset)
  }, [pct])

  const displayVal = value >= 1000
    ? `${(value / 1000).toFixed(1)}k`
    : value >= 100
    ? value.toFixed(0)
    : value.toFixed(0)

  return (
    <div className="glass rounded-2xl p-3 flex flex-col items-center gap-1">
      <div className="relative w-20 h-20">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 88 88">
          {/* Track */}
          <circle cx="44" cy="44" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
          {/* Progress */}
          <circle
            ref={circleRef}
            cx="44" cy="44" r={R}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={CIRC}
            style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}
          />
        </svg>
        {/* Center value */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm font-bold text-white num leading-none">
            {prefix}{displayVal}{suffix}
          </span>
        </div>
      </div>
      <p className="text-[10px] font-semibold tracking-wider text-gray-500">{label}</p>
      {warning && (
        <p className="text-[10px] font-medium" style={{ color }}>⚠ {warning}</p>
      )}
    </div>
  )
}
