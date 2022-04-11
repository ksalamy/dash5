import React from 'react'
import clsx from 'clsx'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBuilding } from '@fortawesome/pro-regular-svg-icons'
import { IconProp } from '@fortawesome/fontawesome-svg-core'
import { swallow } from '@mbari/utils'

export interface CommsCellProps {
  className?: string
  style?: React.CSSProperties
  command: string
  entry: string
  name?: string
  description?: string
  day: string
  time: string
  isUpload: boolean
  isScheduled: boolean
  onSelect: () => void
}

const styles = {
  container: 'flex items-center bg-white p-4 font-display',
  detailsContainer: 'flex flex-grow flex-col pl-1',
  command: 'whitespace-pre-line font-light',
  icon: 'px-6 text-2xl opacity-60',
  description: 'flex flex-grow flex-col p-2 opacity-60',
  buttonWrapper: 'flex w-full items-center text-left',
}

const acknowledgeIcon = (
  <svg
    aria-label="acknowledge icon"
    width="36"
    height="30"
    viewBox="0 0 36 30"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M18.5 7.5L22.5 11.5L32.5 1.5"
      stroke="#6B7280"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M6.68717 27.8404H6.16355L5.86528 27.4101L2.67817 22.8116L2.28337 22.242L2.67817 21.6723L5.86528 17.0738L6.16355 16.6435H6.68717H9.9668V11.5V10.5H10.9668H14.0032H15.0032V11.5V16.6435H28.7213C30.3726 16.6435 31.7023 17.5319 32.5847 18.6069C33.4565 19.669 33.9978 21.0365 33.9978 22.242C33.9978 23.2791 33.7982 24.6585 33.012 25.8073C32.1826 27.0193 30.7911 27.8404 28.7213 27.8404H6.68717Z"
      stroke="#6B7280"
      strokeWidth="2"
    />
  </svg>
)

export const CommsCell: React.FC<CommsCellProps> = ({
  className,
  style,
  command,
  entry,
  name,
  description,
  day,
  time,
  isUpload,
  isScheduled,
  onSelect,
}) => {
  const regFontEntry = entry.slice(0, -3)
  const boldFontEntry = entry.slice(-3)
  return (
    <article
      style={style}
      className={clsx(styles.container, className)}
      onClick={swallow(onSelect)}
    >
      <button className={styles.buttonWrapper}>
        <ul className={styles.detailsContainer}>
          <li
            className={clsx(
              styles.command,
              isScheduled ? 'text-indigo-600' : 'text-green-600'
            )}
            aria-label="command text"
          >
            {command}
          </li>
          <li aria-label="entry name and number">
            {regFontEntry}
            <strong>{boldFontEntry}</strong>
          </li>
          <li className="opacity-60" aria-label="owner name">
            {name}
          </li>
        </ul>
        <div className={styles.icon}>
          {isUpload ? (
            <FontAwesomeIcon
              icon={faBuilding as IconProp}
              aria-label="transmitting icon"
            />
          ) : (
            <div>{acknowledgeIcon}</div>
          )}
        </div>

        <ul className={styles.description}>
          <li aria-label="action description">{description}</li>
          <li>
            <span aria-label="day">{day}</span>{' '}
            <span aria-label="time">{time}</span>
          </li>
        </ul>
      </button>
    </article>
  )
}

CommsCell.displayName = 'Components.CommsCell'
