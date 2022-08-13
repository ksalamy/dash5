import React from 'react'
import clsx from 'clsx'
import { TableHeader, TableHeaderProps } from './TableHeader'
import { TableRow, TableRowProps } from './TableRow'

export interface TableProps {
  className?: string
  style?: React.CSSProperties
  rows: TableRowProps[]
  header?: TableHeaderProps
  grayHeader?: boolean
  highlightedStyle?: string
  noBorder?: boolean
  stackable?: boolean
  scrollable?: boolean
  selectedIndex?: number | null
  onSelectRow?: (index: number) => void
  colInRow?: number
}

const gridClassNames = [
  'grid-cols-none',
  'grid-cols-1',
  'grid-cols-2',
  'grid-cols-3',
  'grid-cols-4',
  'grid-cols-5',
  'grid-cols-6',
  'grid-cols-7',
  'grid-cols-8',
]

const styles = {
  containerBorder: 'border-2 border-solid border-stone-200',
  table: 'font-display w-full',
  header: 'sticky top-0 left-0 z-10 bg-white/100',
  borderTop: 'border-t-2 border-solid border-stone-200',
}

export const Table: React.FC<TableProps> = ({
  className,
  style,
  rows,
  header,
  grayHeader,
  highlightedStyle,
  noBorder,
  stackable,
  scrollable,
  onSelectRow,
  selectedIndex,
  colInRow,
}) => {
  // dynamically calculate grid columns unless defined through associated prop
  const colsInRow = colInRow ? colInRow : rows[0]?.cells.length | 0
  const colsInHeader = colsInRow ? colsInRow : header?.cells.length ?? 0

  const handleSelectRow = (index: number) => {
    onSelectRow?.(index)
  }

  return (
    <article
      data-testid="table container"
      className={clsx(
        !noBorder && styles.containerBorder,
        className,
        scrollable && 'overflow-y-auto',
        stackable && 'border-t-0'
      )}
    >
      <table className={clsx(styles.table)} style={style} role="table">
        {header && (
          <thead className={styles.header}>
            <TableHeader
              className={clsx(
                'grid',
                gridClassNames[colsInHeader],
                !onSelectRow && 'gap-4',
                (!scrollable || grayHeader) && 'bg-stone-100'
              )}
              scrollable={scrollable}
              {...header}
            />
          </thead>
        )}
        <tbody>
          {rows.map((row, index) => (
            <TableRow
              key={`${row?.cells[0]}${index}`}
              className={clsx(
                'grid',
                gridClassNames[colsInRow],
                !onSelectRow && 'gap-4',
                onSelectRow &&
                  (selectedIndex === index
                    ? 'bg-sky-200/70'
                    : 'hover:bg-sky-50'),
                index !== 0 && styles.borderTop
              )}
              {...row}
              scrollable={scrollable}
              highlightedStyle={highlightedStyle}
              onSelect={onSelectRow ? () => handleSelectRow(index) : null}
            />
          ))}
        </tbody>
      </table>
    </article>
  )
}

Table.displayName = 'Data.Table'
