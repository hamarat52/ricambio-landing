import { forwardRef } from 'react'

/**
 * Minimal flat vector people (ink, pictogram style), 2–3 poses each. Poses
 * are <g data-pose> groups; set their opacity to blend between them.
 */
type Pose = { id: string; head: [number, number]; limbs: string[]; prop?: string }

const STROKE = { body: 27, arm: 17 }

const PEOPLE: Record<string, Pose[]> = {
  emre: [
    {
      id: 'upright',
      head: [62, 26],
      limbs: [
        'M60 50 L58 128',
        'M58 128 L50 180 L48 234',
        'M58 128 L68 180 L72 234',
        'M60 58 L50 98 L76 84',
        'M60 58 L70 100 L72 138',
      ],
      prop: 'M70 66 h12 v22 h-12 z',
    },
    {
      id: 'slumped',
      head: [74, 46],
      limbs: [
        'M64 62 Q 72 92 58 130',
        'M58 130 L50 182 L48 234',
        'M58 130 L68 182 L72 234',
        'M64 68 L56 108 L74 112',
        'M64 68 L74 110 L72 150',
      ],
      prop: 'M70 98 h12 v22 h-12 z',
    },
    {
      id: 'armsUp',
      head: [60, 26],
      limbs: [
        'M60 50 L58 128',
        'M58 128 L46 180 L40 234',
        'M58 128 L72 180 L80 234',
        'M60 56 L36 32 L28 6',
        'M60 56 L86 32 L94 8',
      ],
      prop: 'M88 -12 h12 v22 h-12 z',
    },
  ],
  luca: [
    {
      id: 'scan',
      head: [56, 26],
      limbs: [
        'M56 50 L58 128',
        'M58 128 L50 180 L48 234',
        'M58 128 L68 180 L72 234',
        'M56 58 L76 84 L96 80',
        'M56 58 L64 98 L90 96',
      ],
      prop: 'M94 70 h20 v14 h-20 z',
    },
    {
      id: 'phone',
      head: [60, 28],
      limbs: [
        'M60 52 L58 128',
        'M58 128 L50 180 L48 234',
        'M58 128 L68 180 L72 234',
        'M60 58 L50 98 L76 84',
        'M60 58 L70 100 L72 138',
      ],
      prop: 'M70 66 h12 v22 h-12 z',
    },
  ],
  selin: [
    {
      id: 'laptop',
      head: [56, 30],
      limbs: [
        'M56 54 L54 128',
        'M54 128 L86 134 L88 200',
        'M54 128 L84 140 L80 200',
        'M56 62 L70 100 L100 104',
        'M56 62 L64 104 L96 110',
      ],
      prop: 'M92 108 h44 v6 h-44 z M100 78 l30 -2 l6 30 l-30 2 z',
    },
    {
      id: 'cheer',
      head: [58, 28],
      limbs: [
        'M58 52 L56 128',
        'M56 128 L86 134 L88 200',
        'M56 128 L84 140 L80 200',
        'M58 58 L40 34 L34 10',
        'M58 58 L76 92 L104 100',
      ],
      prop: 'M92 108 h44 v6 h-44 z',
    },
  ],
}

interface Props {
  who: 'emre' | 'luca' | 'selin'
  className?: string
}

export const Silhouette = forwardRef<SVGSVGElement, Props>(function Silhouette({ who, className = '' }, ref) {
  const poses = PEOPLE[who]
  return (
    <svg ref={ref} className={`silhouette ${className}`} viewBox="0 -20 150 260" aria-hidden="true">
      {poses.map((p, i) => (
        <g key={p.id} data-pose={p.id} style={{ opacity: i === 0 ? 1 : 0 }}>
          <circle cx={p.head[0]} cy={p.head[1]} r={17} />
          {p.limbs.map((d, k) => (
            <path key={k} d={d} strokeWidth={k === 0 ? STROKE.body : k < 3 ? STROKE.body - 3 : STROKE.arm} />
          ))}
          {p.prop && <path className="silhouette__prop" d={p.prop} />}
        </g>
      ))}
    </svg>
  )
})

/** Blend poses: weights by pose id (missing ids → 0). */
export function setPoses(svg: SVGSVGElement | null, weights: Record<string, number>) {
  if (!svg) return
  svg.querySelectorAll<SVGGElement>('g[data-pose]').forEach((g) => {
    g.style.opacity = String(weights[g.dataset.pose ?? ''] ?? 0)
  })
}
