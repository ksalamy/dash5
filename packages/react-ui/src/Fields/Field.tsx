import { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { IconProp } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React from 'react'
import clsx from 'clsx'
import { Error } from './Error'

import { ErrorMap } from './FieldTypes'

export interface FieldProps {
  label?: string
  name: string
  required?: boolean
  icon?: IconDefinition
  className?: string
  labelClassName?: string
  style?: React.CSSProperties
  errorMessage?: string
  grow?: boolean
  disabled?: boolean
  errors?: ErrorMap
  selfControllable?: boolean
  hint?: string
  children?: React.ReactNode
}

export const getErrorMessage = ({
  name,
  errorMessage,
  errors,
}: {
  name: string
  errorMessage?: string
  errors?: ErrorMap
}) => errorMessage ?? (errors ?? {})[name]?.message

const style = {
  container: 'flex flex-col font-display',
  iconWrap: 'absolute inset-y-0 flex text-stone-300 left-0 ml-3',
  icon: 'm-auto text-stone-700 text-sm w-4',
  fieldWrap: 'relative flex flex-grow flex-wrap',
  required: 'text-emerald-500 text-xs mx-2 my-auto',
  label: 'flex text-sm pb-1',
}

const getGrowStyle = (grow?: boolean) => (grow ? 'flex-grow' : '')
const getDisabledStyle = (disabled?: boolean) => (disabled ? 'opacity-75' : '')

export const Field: React.FC<FieldProps> = ({
  label,
  name,
  className,
  labelClassName,
  icon,
  errorMessage,
  grow,
  children,
  disabled,
  hint,
}) => (
  <div
    className={clsx(
      style.container,
      getGrowStyle(grow),
      getDisabledStyle(disabled),
      className
    )}
  >
    {label && (
      <label htmlFor={name} className={clsx(style.label, labelClassName)}>
        {label}
      </label>
    )}
    <div className={style.fieldWrap}>
      {children}
      {icon ? (
        <span className={clsx(style.iconWrap)}>
          <FontAwesomeIcon icon={icon as IconProp} className={style.icon} />
        </span>
      ) : (
        <span />
      )}
      {errorMessage ? <Error>{errorMessage}</Error> : null}
    </div>
    {hint ? <p className="mt-1 text-sm text-stone-300">{hint}</p> : null}
  </div>
)

Error.displayName = 'Fields.Field'
