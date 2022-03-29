import React, { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { IconDefinition } from '@fortawesome/pro-regular-svg-icons'
import { ToolTip, ToolTipAlignment, ToolTipDirection } from './ToolTip'
import clsx from 'clsx'
import { IconProp } from '@fortawesome/fontawesome-svg-core'

export interface IconButtonProps {
  tooltip?: string
  tooltipAlignment?: ToolTipAlignment
  toolTipDirection?: ToolTipDirection
  icon: IconDefinition
  disabled?: boolean
  inactive?: boolean
  onClick?: (target: HTMLButtonElement) => void
  className?: string
  style?: React.CSSProperties
  noPadding?: boolean
  ariaLabel: string
}

const style = {
  button: 'rounded-full w-10 h-10 flex-shrink-0 text-lg leading-none',
  buttonHover: 'hover:bg-primary-600 hover:bg-opacity-10',
  inactive: 'opacity-50',
  disabled: 'opacity-25 pointer-events-none',
}

export const IconButton: React.FC<IconButtonProps> = ({
  disabled,
  icon,
  onClick: clickHandlerFromProps,
  className,
  style: styleFromProps,
  tooltip,
  tooltipAlignment = 'center',
  toolTipDirection = 'below',
  inactive,
  noPadding,
  ariaLabel,
}) => {
  const [hoverTimeout, setHoverTimeout] = useState<any>()
  const [hover, setHover] = useState(false)

  const handleMouseOver: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    if (tooltip) {
      setHoverTimeout(setTimeout(() => setHover(true), 500))
    }
  }
  const handleMouseOut: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    if (tooltip) {
      clearTimeout(hoverTimeout)
      setHover(false)
    }
  }
  const handleClick: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (clickHandlerFromProps) {
      clickHandlerFromProps(e.currentTarget)
    }
  }
  return (
    <button
      className={clsx([
        style.button,
        (className ?? '').indexOf('absolute') < 0 && 'relative',
        (className ?? '').indexOf('hover:bg') < 0 && style.buttonHover,
        !noPadding && 'p-2',
        className,
        disabled && !inactive && style.disabled,
        inactive && style.inactive,
      ])}
      onClick={handleClick}
      style={styleFromProps}
      onMouseEnter={handleMouseOver}
      onMouseLeave={handleMouseOut}
      aria-label={ariaLabel}
    >
      <FontAwesomeIcon icon={icon as IconProp} />
      {tooltip ? (
        <ToolTip
          label={tooltip}
          active={hover}
          direction={toolTipDirection}
          align={tooltipAlignment}
        />
      ) : null}
    </button>
  )
}

IconButton.displayName = 'Navigation.IconButton'
