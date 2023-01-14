import React, { useCallback, useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { DateTime } from 'luxon'
import { useResizeObserver } from '@mbari/utils'
import { Tick } from './MissionProgress/Tick'
import { Progress } from './MissionProgress/Progress'
import { End } from './MissionProgress/End'
import { Point } from './MissionProgress/Point'
import { timeSinceStart } from '@mbari/utils'

const styles = {
  container: 'flex py-2',
  toolbar: 'flex-grow mx-4 my-auto h-9 overflow-hidden cursor-pointer',
  title: 'flex-shrink-0 text-md font-display my-auto mx-4',
}

export interface MissionProgressToolbarProps {
  className?: string
  style?: React.CSSProperties
  startTime: string
  endTime: string
  ticks: number
  ariaLabel: string
  onScrub?: (millis?: number | null) => void
  indicatorTime?: number | null
}

export const MissionProgressToolbar: React.FC<MissionProgressToolbarProps> = ({
  className,
  ticks,
  ariaLabel,
  startTime,
  endTime,
  indicatorTime,
  onScrub: handleScrub,
}) => {
  const container = useRef(null as HTMLButtonElement | null)
  const {
    size: { height: containerHeight, width: containerWidth },
  } = useResizeObserver({ element: container, wait: 100 })
  const start = DateTime.fromISO(startTime)
  const end = DateTime.fromISO(endTime)
  const duration = end.diff(start, 'seconds').seconds
  const progress = Math.max(0, -start.diffNow('seconds').seconds / duration)
  const tickHeight = 9
  const totalSegments = ticks + 1 // +1 for start and end which are not rendered
  const height = containerHeight || 20
  const width = containerWidth || 100
  const missionInProgress = progress > 0 && progress < 1
  const useAbsolute = start.diffNow('days').days < -7

  const [interactive, setInteractive] = useState(false)
  const [hoverProgress, setHoverProgress] = useState(null as null | number)
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const x =
        e.clientX - (container?.current?.getBoundingClientRect?.().left ?? 0)
      const progress = x / containerWidth
      setHoverProgress(progress)
      handleScrub?.(start.toMillis() + duration * progress * 1000)
    },
    [container, setHoverProgress, containerWidth, duration]
  )

  const indicatorProgress =
    !interactive && indicatorTime
      ? (indicatorTime - DateTime.fromISO(startTime).toMillis()) /
        (duration * 1000)
      : null

  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handleMouseOver = useCallback(() => {
    if (timeout.current) {
      clearTimeout(timeout.current)
      setInteractive(true)
    }
  }, [timeout, setInteractive])
  const handleMouseOut = useCallback(() => {
    if (timeout.current) {
      clearTimeout(timeout.current)
    }
    timeout.current = setTimeout(() => {
      setHoverProgress(null)
      handleScrub?.(null)
      setInteractive(false)
    }, 250)
  }, [timeout, setInteractive, handleScrub])

  return (
    <div className={clsx(styles.container, className)} aria-label={ariaLabel}>
      <h3 className={styles.title}>Timeline</h3>
      <button
        ref={container}
        className={styles.toolbar}
        onMouseOver={handleMouseOver}
        onFocus={handleMouseOver}
        onMouseOut={handleMouseOut}
        onBlur={handleMouseOut}
      >
        {height > 0 && width > 0 && (
          <svg
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            onMouseMove={handleMouseMove}
          >
            <Point x={5} y={height / 2} label="Launch" />
            {[...Array(totalSegments)].map((_, i) => {
              if (i < 1 || i === totalSegments) return null
              const x = (width / totalSegments) * i
              const additionalSeconds = (duration * x) / width
              const label = useAbsolute
                ? start.plus({ seconds: additionalSeconds }).toFormat('M/d')
                : timeSinceStart(startTime, additionalSeconds)
              const tickId = `${ariaLabel}-tick-${i}-${label}`

              return (
                <Tick
                  key={tickId}
                  ariaLabel={tickId}
                  x={x}
                  y={height / 2 - tickHeight / 2}
                  height={tickHeight}
                  label={label as string}
                />
              )
            })}
            {missionInProgress && (
              <Point x={width * progress} y={height / 2} label="Projected" />
            )}
            <Progress x={0} y={height / 2} width={width} percent={progress} />
            {hoverProgress && (
              <Point
                x={width * hoverProgress}
                y={height / 2}
                label={start
                  .plus({ seconds: hoverProgress * duration })
                  .toFormat('MMM d, h:mm a')}
                align={hoverProgress > 0.75 ? 'right' : 'left'}
                highlight
              />
            )}
            {!interactive && indicatorProgress && (
              <Point
                x={width * indicatorProgress}
                y={height / 2}
                label={start
                  .plus({ seconds: indicatorProgress * duration })
                  .toFormat('MMM d, h:mm a')}
                align={indicatorProgress > 0.75 ? 'right' : 'left'}
                highlight
              />
            )}
            <End x={width - 7} y={height / 2 - 6} height={12} width={6} />
          </svg>
        )}
      </button>
    </div>
  )
}

MissionProgressToolbar.displayName = 'Components.MissionProgressToolbar'
