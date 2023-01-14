import React from 'react'
import clsx from 'clsx'

export const Point: React.FC<{
  x: number
  y: number
  label: string
  highlight?: boolean
  align?: 'left' | 'right'
}> = ({ x, y, label, highlight = false, align }) => (
  <>
    <text
      x={x}
      textAnchor={align === 'right' ? 'end' : 'start'}
      y={y - 10}
      className={clsx(
        'text-center font-display',
        highlight ? 'fill-violet-600' : 'fill-black/50'
      )}
      fontSize={10}
      aria-label={label}
    >
      {label}
    </text>
    <circle
      cx={x}
      cy={y}
      r="4"
      className={clsx(
        highlight
          ? 'fill-violet-600 stroke-violet-600'
          : 'fill-black stroke-black'
      )}
      strokeWidth="2"
    />
  </>
)
