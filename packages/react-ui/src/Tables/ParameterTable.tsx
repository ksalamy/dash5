import React, { useMemo } from 'react'
import clsx from 'clsx'
import { Table } from '../Data/Table'
import { ParameterField, ParameterFieldUnit } from './ParameterField'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faInfoCircle } from '@fortawesome/pro-regular-svg-icons'
import { IconProp } from '@fortawesome/fontawesome-svg-core'
import { makeValueUnitString } from '@mbari/utils'

export interface ParameterTableProps {
  className?: string
  style?: React.CSSProperties
  parameters: ParameterProps[]
  altHeaderLabel?: string
  onParamUpdate: (
    name: string,
    overrideValue: string,
    overrideUnit: string
  ) => void
  onVerifyValue?: (value: string) => string
  unitOptions?: ParameterFieldUnit[]
}

export interface ParameterProps {
  name: string
  description?: string
  value: string
  unit?: string
  dvlOff?: boolean
  overrideValue?: string
  overrideUnit?: string
  insert?: string
}

export const ParameterTable: React.FC<ParameterTableProps> = ({
  className,
  style,
  parameters,
  altHeaderLabel,
  onParamUpdate,
  unitOptions,
}) => {
  const ParameterRows = useMemo(
    () =>
      parameters.map(
        ({
          name,
          description,
          value,
          unit,
          overrideValue,
          overrideUnit,
          dvlOff,
        }) => {
          const handleOverride = (newValue: string, newUnit: string) => {
            onParamUpdate(name, newValue, newUnit)
          }
          return {
            cells: [
              {
                label: (
                  <span
                    className={clsx(
                      'font-medium',
                      overrideValue && 'text-teal-600',
                      !overrideValue && dvlOff && 'text-orange-500/80',
                      !overrideValue && !dvlOff && 'opacity-60'
                    )}
                  >
                    {name}
                  </span>
                ),
                secondary: (
                  <span className="text-stone-600/60 ">{description}</span>
                ),
                span: 3,
                highlighted: true, // removes scrollable table styles on this cell
              },
              {
                label: (
                  <div>
                    <span className="text-stone-600/60">
                      {makeValueUnitString(value, unit)}
                    </span>
                    {dvlOff && (
                      <span className="ml-4 text-orange-500/80">
                        DVL is off
                        <FontAwesomeIcon
                          icon={faInfoCircle as IconProp}
                          className="ml-2"
                        />
                      </span>
                    )}
                  </div>
                ),
                span: 2,
                highlighted: true,
                highlightedStyle: 'text-base',
              },
              {
                label: (
                  <ParameterField
                    overrideValue={overrideValue}
                    onOverride={handleOverride}
                    overrideUnit={overrideUnit}
                    unit={unit}
                    unitOptions={unitOptions}
                    name={name}
                    defaultValue={value}
                  />
                ),
                span: 3,
                highlighted: true,
                highlightedStyle: 'text-base text-teal-600',
              },
            ],
          }
        }
      ),
    [parameters]
  )

  return (
    <Table
      className={className}
      style={style}
      scrollable
      grayHeader
      colInRow={8}
      header={{
        cells: [
          {
            label: altHeaderLabel ?? 'PARAMETER',
            span: 3,
          },
          {
            label: 'DEFAULT VALUE',
            span: 2,
          },
          { label: 'OVERRIDE VALUE', span: 3 },
        ],
      }}
      rows={ParameterRows}
    />
  )
}

ParameterTable.displayName = 'Tables.ParameterTable'
