import { forwardRef, type CSSProperties } from 'react'

/**
 * Hand-drawn arrow (a nod to the pitch deck). Strokes are normalised with
 * pathLength=1, so drawing is just `--draw` (0 → 1) on the element, either
 * driven by scroll or by the looping CSS animation (`hand-arrow--loop`).
 */
export const ARROWS = {
  down: {
    viewBox: '0 0 64 120',
    d: 'M33 4 C 27 24, 39 40, 32 60 C 26 78, 34 92, 32 110',
    head: 'M19 95 C 25 101, 29 106, 32 111 C 36 104, 40 99, 46 93',
  },
  right: {
    viewBox: '0 0 160 64',
    d: 'M4 40 C 30 22, 58 50, 86 34 C 104 24, 124 30, 150 30',
    head: 'M134 16 C 140 22, 146 26, 152 30 C 145 35, 139 40, 133 47',
  },
  curveDown: {
    viewBox: '0 0 160 140',
    d: 'M6 12 C 60 2, 120 18, 132 60 C 138 84, 128 104, 118 126',
    head: 'M104 112 C 110 118, 114 122, 117 128 C 123 121, 128 117, 135 113',
  },
  curveLeft: {
    viewBox: '0 0 160 120',
    d: 'M152 10 C 120 6, 70 14, 52 48 C 40 70, 36 88, 22 108',
    head: 'M14 88 C 16 96, 18 102, 21 110 C 28 106, 34 104, 42 103',
  },
} as const

export type ArrowName = keyof typeof ARROWS

interface Props {
  name: ArrowName
  className?: string
  style?: CSSProperties
  loop?: boolean
  strokeWidth?: number
}

export const HandArrow = forwardRef<SVGSVGElement, Props>(function HandArrow(
  { name, className = '', style, loop = false, strokeWidth = 2.4 },
  ref,
) {
  const a = ARROWS[name]
  return (
    <svg
      ref={ref}
      className={`hand-arrow ${loop ? 'hand-arrow--loop' : ''} ${className}`}
      viewBox={a.viewBox}
      style={style}
      aria-hidden="true"
      focusable="false"
    >
      <path className="hand-arrow__shaft" d={a.d} pathLength={1} strokeWidth={strokeWidth} />
      <path className="hand-arrow__head" d={a.head} pathLength={1} strokeWidth={strokeWidth} />
    </svg>
  )
})
