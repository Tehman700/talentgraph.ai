import { useState, useEffect } from 'react'

interface Props {
  status?: string
}

export function TopBar({ status = 'Live' }: Props) {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const hh = String(time.getHours()).padStart(2, '0')
  const mm = String(time.getMinutes()).padStart(2, '0')
  const ss = String(time.getSeconds()).padStart(2, '0')

  return (
    <div
      style={{ fontFamily: 'var(--font-mono)' }}
      className="fixed top-0 left-0 right-0 h-16 z-40 flex items-center justify-between px-7 text-sm tracking-widest uppercase"
    >
      <span className="text-ink font-medium">SkillPath</span>

      <div className="flex items-center gap-2 bg-white border border-ink px-4 py-1.5 rounded-full text-xs normal-case tracking-normal">
        <span className="w-3 h-3 rounded-full bg-blue inline-block" />
        <span>{status}</span>
      </div>

      <div className="flex items-center gap-6 text-xs normal-case tracking-normal">
        <span className="text-blue tabular-nums">{hh} {mm} {ss}</span>
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-lime inline-block" />
          Open Beta
        </span>
      </div>
    </div>
  )
}
