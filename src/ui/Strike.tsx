import { forwardRef } from 'react'

/**
 * Hand-drawn red marker strike-through. Set `--draw` (0 → 1) on the element
 * to draw it; the stroke keeps its width however the box is stretched.
 */
export const Strike = forwardRef<SVGSVGElement, { className?: string; variant?: 0 | 1 | 2 }>(function Strike(
  { className = '', variant = 0 },
  ref,
) {
  const d = [
    'M2 13 C 18 9, 36 15, 54 10 S 86 8, 98 7',
    'M2 10 C 22 14, 40 7, 60 11 S 88 12, 98 8',
    'M2 12 C 20 8, 44 13, 62 9 S 90 11, 98 9',
  ][variant]
  return (
    <svg ref={ref} className={`strike ${className}`} viewBox="0 0 100 20" preserveAspectRatio="none" aria-hidden="true">
      <path d={d} pathLength={1} />
    </svg>
  )
})
