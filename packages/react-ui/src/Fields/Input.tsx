import React from 'react'
import clsx from 'clsx'

export interface InputProps {
  name: string
  className?: string
  style?: React.CSSProperties
  placeholder?: string
  value?: string
  error?: boolean
  disabled?: boolean
  onBlur?: React.FocusEventHandler<HTMLInputElement>
  onChange?: React.ChangeEventHandler<HTMLInputElement>
  onFocus?: React.FocusEventHandler<HTMLInputElement>
  onKeyUp?: React.KeyboardEventHandler<HTMLInputElement>
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>
  type?: string
}

const style = {
  input:
    'font-body border rounded px-2 py-1 flex flex-grow max-w-full focus:outline-none focus:border-green-300',
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      name,
      error,
      disabled,
      className,
      placeholder,
      value,
      style: inlineStyle,
      onBlur,
      onChange,
      onFocus,
      onKeyUp,
      onKeyDown,
      type = 'text',
      ...props
    },
    forwardedRef
  ) => {
    const controlledInputProps = value || value === '' ? { value } : {}
    return (
      <input
        {...props}
        name={name}
        ref={forwardedRef}
        className={clsx(
          style.input,
          error ? 'border-error text-error' : '',
          disabled ? 'cursor-not-allowed opacity-50' : '',
          className
        )}
        disabled={disabled}
        placeholder={placeholder}
        style={inlineStyle}
        onBlur={onBlur}
        onChange={onChange}
        onFocus={onFocus}
        onKeyUp={onKeyUp}
        onKeyDown={onKeyDown}
        type={type}
        autoComplete="off"
        autoCorrect="off"
        {...controlledInputProps}
      />
    )
  }
)

Input.displayName = 'Fields.Input'
